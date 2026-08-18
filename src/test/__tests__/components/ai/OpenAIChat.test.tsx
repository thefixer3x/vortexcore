import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { OpenAIChat } from '@/components/ai/OpenAIChat'

const mocks = vi.hoisted(() => ({
  invoke: vi.fn(),
  toast: vi.fn(),
  getAccessToken: vi.fn(),
  auth: {
    isAuthenticated: true,
    isLoading: false,
  },
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    ...mocks.auth,
    getAccessToken: mocks.getAccessToken,
  }),
}))

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: { invoke: mocks.invoke },
  },
}))

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mocks.toast }),
}))

vi.mock('logrocket', () => ({
  default: { track: vi.fn() },
}))

function openChat() {
  fireEvent.click(screen.getByRole('button'))
}

function sendMessage(content: string) {
  const input = screen.getByPlaceholderText(/Type a message/i)
  fireEvent.change(input, { target: { value: content } })
  fireEvent.click(screen.getByRole('button', { name: 'Send message' }))
}

describe('OpenAIChat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.auth.isAuthenticated = true
    mocks.auth.isLoading = false
    mocks.getAccessToken.mockResolvedValue('mock-token')
    mocks.invoke.mockResolvedValue({
      data: { response: 'You have no transactions yet.', contextStatus: 'empty' },
      error: null,
    })
  })

  it('is not exposed while auth is loading or when the user is signed out', () => {
    mocks.auth.isAuthenticated = false
    const { rerender } = render(<OpenAIChat />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()

    mocks.auth.isAuthenticated = true
    mocks.auth.isLoading = true
    rerender(<OpenAIChat />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('shows a truthful welcome message for authenticated users', () => {
    render(<OpenAIChat />)
    openChat()

    expect(screen.getByText('VortexAI Assistant')).toBeInTheDocument()
    expect(screen.getByText(/available to your signed-in account/i)).toBeInTheDocument()
  })

  it('sends the current access token, prompt, and bounded UI history', async () => {
    render(<OpenAIChat />)
    openChat()
    sendMessage('Review my spending')

    await waitFor(() => {
      expect(mocks.invoke).toHaveBeenCalledWith('openai-chat', {
        headers: { Authorization: 'Bearer mock-token' },
        body: {
          prompt: 'Review my spending',
          history: [
            {
              role: 'assistant',
              content: 'Welcome to VortexCore. I can help explain the balances and transactions available to your signed-in account.',
            },
          ],
        },
      })
    })

    expect(await screen.findByText('You have no transactions yet.')).toBeInTheDocument()
  })

  it('does not invoke the backend without an authenticated token', async () => {
    mocks.getAccessToken.mockResolvedValue(null)
    render(<OpenAIChat />)
    openChat()
    sendMessage('Show my balance')

    expect(await screen.findByText(/couldn't securely load your financial context/i)).toBeInTheDocument()
    expect(mocks.invoke).not.toHaveBeenCalled()
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({
      description: 'Your session has expired. Please sign in again.',
      variant: 'destructive',
    }))
  })

  it('surfaces backend failures without substituting financial claims', async () => {
    mocks.invoke.mockResolvedValue({ data: null, error: { message: 'context unavailable' } })
    render(<OpenAIChat />)
    openChat()
    sendMessage('What changed this month?')

    expect(await screen.findByText(/couldn't securely load your financial context/i)).toBeInTheDocument()
    expect(screen.queryByText(/spending down/i)).not.toBeInTheDocument()
  })

  it('can be minimized, restored, and cleared', () => {
    render(<OpenAIChat />)
    openChat()

    fireEvent.click(screen.getByTitle('Minimize'))
    expect(screen.queryByText('VortexAI Assistant')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText('VortexAI Assistant')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Clear Chat'))
    expect(screen.getAllByText(/available to your signed-in account/i)).toHaveLength(1)
  })
})
