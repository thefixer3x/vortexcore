import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { VortexAssistantChat } from '@/components/ai/VortexAssistantChat'

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

describe('VortexAssistantChat', () => {
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
    const { rerender } = render(<VortexAssistantChat />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()

    mocks.auth.isAuthenticated = true
    mocks.auth.isLoading = true
    rerender(<VortexAssistantChat />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('shows a truthful welcome message for authenticated users', () => {
    render(<VortexAssistantChat />)
    openChat()

    expect(screen.getByText('VortexAI Assistant')).toBeInTheDocument()
    expect(screen.getByText(/Welcome to VortexAI/i)).toBeInTheDocument()
  })

  it('sends the current access token, messages, and UI history', async () => {
    render(<VortexAssistantChat />)
    openChat()
    sendMessage('Review my spending')

    await waitFor(() => {
      expect(mocks.invoke).toHaveBeenCalledWith('ai-router', {
        headers: { Authorization: 'Bearer mock-token' },
        body: {
          messages: [
            {
              role: 'assistant',
              content: 'Welcome to VortexAI. How can I help you today?',
            },
            { role: 'user', content: 'Review my spending' },
          ],
        },
      })
    })

    expect(await screen.findByText('You have no transactions yet.')).toBeInTheDocument()
  })

  it('does not invoke the backend without an authenticated token', async () => {
    mocks.getAccessToken.mockResolvedValue(null)
    render(<VortexAssistantChat />)
    openChat()
    sendMessage('Show my balance')

    expect(await screen.findByText(/Your session has expired/i)).toBeInTheDocument()
    expect(mocks.invoke).not.toHaveBeenCalled()
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({
      description: 'Your session has expired. Please sign in again.',
      variant: 'destructive',
    }))
  })

  it('surfaces backend failures without substituting financial claims', async () => {
    mocks.invoke.mockResolvedValue({ data: null, error: { message: 'context unavailable' } })
    render(<VortexAssistantChat />)
    openChat()
    sendMessage('What changed this month?')

    expect(await screen.findByText(/context unavailable/i)).toBeInTheDocument()
    expect(screen.queryByText(/spending down/i)).not.toBeInTheDocument()
  })

  it('can be minimized, restored, and cleared', () => {
    render(<VortexAssistantChat />)
    openChat()

    fireEvent.click(screen.getByTitle('Minimize'))
    expect(screen.queryByText('VortexAI Assistant')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText('VortexAI Assistant')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Clear Chat'))
    expect(screen.getAllByText(/Welcome to VortexAI/i)).toHaveLength(1)
  })
})
