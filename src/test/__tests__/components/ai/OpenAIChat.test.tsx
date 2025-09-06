import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OpenAIChat } from '@/components/ai/OpenAIChat'
import { testUtils } from '../../../setup'

// Mock the auth context
const mockAuthContext = {
  user: testUtils.mockUser,
  isAuthenticated: true,
  getAccessToken: vi.fn(() => Promise.resolve('mock-token')),
}

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
}))

// Mock toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

// Mock LogRocket
vi.mock('logrocket', () => ({
  default: {
    track: vi.fn(),
  },
}))

describe('OpenAIChat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset fetch mock
    global.fetch = vi.fn()
  })

  it('shows chat button initially', () => {
    render(<OpenAIChat />)
    
    const chatButton = screen.getByRole('button')
    expect(chatButton).toBeInTheDocument()
    expect(chatButton).toHaveClass('rounded-full')
  })

  it('opens chat interface when button is clicked', () => {
    render(<OpenAIChat />)
    
    const chatButton = screen.getByRole('button')
    fireEvent.click(chatButton)
    
    expect(screen.getByText('VortexAI Assistant')).toBeInTheDocument()
    expect(screen.getByText(/Welcome to VortexCore/i)).toBeInTheDocument()
  })

  it('displays initial welcome message', () => {
    render(<OpenAIChat />)
    
    // Open chat
    fireEvent.click(screen.getByRole('button'))
    
    expect(screen.getByText(/Welcome to VortexCore! How can I assist you/i)).toBeInTheDocument()
  })

  it('allows user to type and send messages', async () => {
    render(<OpenAIChat />)
    
    // Open chat
    fireEvent.click(screen.getByRole('button'))
    
    const messageInput = screen.getByPlaceholderText(/Type a message/i)
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    fireEvent.change(messageInput, { target: { value: 'Hello AI' } })
    expect(messageInput).toHaveValue('Hello AI')
    expect(sendButton).not.toBeDisabled()
  })

  it('sends message and displays user input', async () => {
    // Mock successful API response
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({ response: 'Hello! How can I help you?' })
    })
    
    render(<OpenAIChat />)
    
    // Open chat
    fireEvent.click(screen.getByRole('button'))
    
    const messageInput = screen.getByPlaceholderText(/Type a message/i)
    
    fireEvent.change(messageInput, { target: { value: 'Hello AI' } })
    const allButtons = screen.getAllByRole('button')
    const sendButton = allButtons.find(button => button.type === 'submit')
    expect(sendButton).toBeDefined()
    fireEvent.click(sendButton as HTMLElement)
    
    // Check user message is displayed
    await waitFor(() => {
      expect(screen.getByText('Hello AI')).toBeInTheDocument()
    })
    
    // Check API was called
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/functions/v1/ai-router'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        })
      })
    )
  })

  it('handles API errors gracefully', async () => {
    // Mock API error
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))
    
    render(<OpenAIChat />)
    
    // Open chat
    fireEvent.click(screen.getByRole('button'))
    
    const messageInput = screen.getByPlaceholderText(/Type a message/i)
    
    fireEvent.change(messageInput, { target: { value: 'Test message' } })
    const allButtons = screen.getAllByRole('button')
    const sendButton = allButtons.find(button => button.type === 'submit')
    fireEvent.click(sendButton!)
    
    await waitFor(() => {
      expect(screen.getByText(/I'm sorry, I encountered an error/i)).toBeInTheDocument()
    })
  })

  it('shows loading state while waiting for response', async () => {
    // Mock delayed response
    global.fetch = vi.fn().mockImplementationOnce(() =>
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({ response: 'Response' })
      }), 100))
    )
    
    render(<OpenAIChat />)
    
    // Open chat
    fireEvent.click(screen.getByRole('button'))
    
    const messageInput = screen.getByPlaceholderText(/Type a message/i)
    
    fireEvent.change(messageInput, { target: { value: 'Test message' } })
    const allButtons = screen.getAllByRole('button')
    const sendButton = allButtons.find(button => button.type === 'submit')
    fireEvent.click(sendButton!)
    
    // Check loading state
    expect(screen.getByText('Thinking...')).toBeInTheDocument()
    
    // Wait for response
    await waitFor(() => {
      expect(screen.getByText('Response')).toBeInTheDocument()
    }, { timeout: 1000 })
  })

  it('can be minimized and restored', () => {
    render(<OpenAIChat />)
    
    // Open chat
    fireEvent.click(screen.getByRole('button'))
    
    // Minimize
    const minimizeButton = screen.getByTitle('Minimize')
    fireEvent.click(minimizeButton)
    
    // Check minimized state
    expect(screen.queryByText('VortexAI Assistant')).not.toBeInTheDocument()
    
    // Restore
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText('VortexAI Assistant')).toBeInTheDocument()
  })

  it('can clear chat history', () => {
    render(<OpenAIChat />)
    
    // Open chat
    fireEvent.click(screen.getByRole('button'))
    
    // Clear chat
    fireEvent.click(screen.getByText('Clear Chat'))
    
    // Should only show welcome message
    const welcomeMessages = screen.getAllByText(/Welcome to VortexCore/i)
    expect(welcomeMessages).toHaveLength(1)
  })

  it('handles streaming responses', async () => {
    // Mock streaming response
    const mockReader = {
      read: vi.fn()
        .mockResolvedValueOnce({
          value: new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Hello"}}]}\n'),
          done: false
        })
        .mockResolvedValueOnce({
          value: new TextEncoder().encode('data: {"choices":[{"delta":{"content":" there!"}}]}\n'),
          done: false
        })
        .mockResolvedValueOnce({
          value: new TextEncoder().encode('data: [DONE]\n'),
          done: true
        })
    }
    
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'text/event-stream' },
      body: { getReader: () => mockReader }
    })
    
    render(<OpenAIChat />)
    
    // Open chat
    fireEvent.click(screen.getByRole('button'))
    
    const messageInput = screen.getByPlaceholderText(/Type a message/i)
    
    fireEvent.change(messageInput, { target: { value: 'Stream test' } })
    const allButtons = screen.getAllByRole('button')
    const sendButton = allButtons.find(button => button.type === 'submit')
    fireEvent.click(sendButton!)
    
    await waitFor(() => {
      expect(screen.getByText('Hello there!')).toBeInTheDocument()
    })
  })
})
