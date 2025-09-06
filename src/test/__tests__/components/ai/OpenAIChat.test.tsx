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
    expect(sendButton).toBeDefined()
    fireEvent.click(sendButton as HTMLElement)
    
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
    expect(sendButton).toBeDefined()
    fireEvent.click(sendButton as HTMLElement)
    
    await waitFor(() => {
      expect(screen.getByText('Hello there!')).toBeInTheDocument()
    })
  })
})

/**
 * Additional scenarios for OpenAIChat
 * Testing framework: Vitest
 * Testing library: React Testing Library (@testing-library/react)
 */

describe('OpenAIChat – additional scenarios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset fetch mock per test
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).fetch = vi.fn();
  });

  const openChatAndGetControls = () => {
    // Open the chat widget
    fireEvent.click(screen.getByRole('button'));
    const messageInput = screen.getByPlaceholderText(/Type a message/i) as HTMLInputElement | HTMLTextAreaElement;
    const getSendButton = (): HTMLButtonElement => {
      const all = screen.getAllByRole('button') as HTMLButtonElement[];
      const btn = all.find(b => b.type === 'submit');
      expect(btn).toBeDefined();
      return btn as HTMLButtonElement;
    };
    return { messageInput, getSendButton };
  };

  it('disables send on empty and whitespace-only input and prevents submission', () => {
    render(<OpenAIChat />);

    const { messageInput, getSendButton } = openChatAndGetControls();
    const sendButton = getSendButton();

    // Initially disabled
    expect(sendButton).toBeDisabled();

    // Whitespace should not enable send
    fireEvent.change(messageInput, { target: { value: '   ' } });
    expect(sendButton).toBeDisabled();

    // Attempting to click should not trigger network
    fireEvent.click(sendButton);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('clears input after a successful JSON response', async () => {
    // Mock successful JSON response
    (global.fetch as unknown as vi.Mock).mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({ response: 'Hi there!' }),
    });

    render(<OpenAIChat />);
    const { messageInput, getSendButton } = openChatAndGetControls();

    fireEvent.change(messageInput, { target: { value: 'Hello, world' } });
    const sendButton = getSendButton();
    expect(sendButton).not.toBeDisabled();

    fireEvent.click(sendButton);

    // User message should render
    await waitFor(() => {
      expect(screen.getByText('Hello, world')).toBeInTheDocument();
    });

    // Input should be cleared
    expect(messageInput).toHaveValue('');
  });

  it('handles non-OK HTTP response gracefully (error body JSON)', async () => {
    // Simulate 400/500-like response with JSON body
    (global.fetch as unknown as vi.Mock).mockResolvedValueOnce({
      ok: false,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({ error: 'Bad request' }),
    });

    render(<OpenAIChat />);
    const { messageInput, getSendButton } = openChatAndGetControls();

    fireEvent.change(messageInput, { target: { value: 'Trigger error' } });
    const sendButton = getSendButton();
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText(/I'm sorry, I encountered an error/i)).toBeInTheDocument();
    });

    // Ensure API was called with expected route and method
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/functions/v1/ai-router'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('minimize and restore retains existing chat history', async () => {
    // Return a quick JSON response
    (global.fetch as unknown as vi.Mock).mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({ response: 'AI says hi' }),
    });

    render(<OpenAIChat />);
    const { messageInput, getSendButton } = openChatAndGetControls();

    fireEvent.change(messageInput, { target: { value: 'Hello again' } });
    const sendButton = getSendButton();
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('Hello again')).toBeInTheDocument();
    });

    // Minimize
    fireEvent.click(screen.getByTitle('Minimize'));
    // Restore
    fireEvent.click(screen.getByRole('button'));

    // History should still be present
    expect(screen.getByText('Hello again')).toBeInTheDocument();
  });

  it('removes "Thinking..." indicator after streaming completes', async () => {
    // Mock streaming response sequence
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
    };

    (global.fetch as unknown as vi.Mock).mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'text/event-stream' },
      body: { getReader: () => mockReader }
    });

    render(<OpenAIChat />);
    const { messageInput, getSendButton } = openChatAndGetControls();

    fireEvent.change(messageInput, { target: { value: 'Stream please' } });
    const sendButton = getSendButton();
    fireEvent.click(sendButton);

    // Loading indicator during stream
    expect(screen.getByText('Thinking...')).toBeInTheDocument();

    // Final aggregated message
    await waitFor(() => {
      expect(screen.getByText('Hello there!')).toBeInTheDocument();
    });

    // Indicator removed after completion
    expect(screen.queryByText('Thinking...')).not.toBeInTheDocument();
  });

  it('clear chat removes prior user messages leaving only the welcome message', async () => {
    (global.fetch as unknown as vi.Mock).mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({ response: 'Acknowledged' }),
    });

    render(<OpenAIChat />);
    const { messageInput, getSendButton } = openChatAndGetControls();

    fireEvent.change(messageInput, { target: { value: 'Message to clear' } });
    const sendButton = getSendButton();
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('Message to clear')).toBeInTheDocument();
    });

    // Clear chat
    fireEvent.click(screen.getByText('Clear Chat'));

    // Only welcome message should remain
    const welcomeMessages = screen.getAllByText(/Welcome to VortexCore/i);
    expect(welcomeMessages.length).toBe(1);
    expect(screen.queryByText('Message to clear')).not.toBeInTheDocument();
  });
});
