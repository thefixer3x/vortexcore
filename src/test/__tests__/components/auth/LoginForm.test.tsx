import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LoginForm } from '@/components/auth/LoginForm'
import { TestWrapper } from '@/test/test-utils'
import { mockAuthContext } from '@/test/mocks/auth-context'
import { mockSupabase } from '@/test/mocks/supabase'
import { mockLogRocket, mockToast, mockLocation } from '@/test/mocks/external-libs'

// Mock external dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
}))

vi.mock('logrocket', () => mockLogRocket)

vi.mock('@/hooks/use-toast', () => ({
  toast: mockToast.toast,
}))

vi.mock('@/hooks/use-location', () => ({
  useLocation: () => mockLocation,
}))

vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  useNavigate: () => vi.fn(),
}))

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Reset auth context to default state
    mockAuthContext.isLoading = false
    mockAuthContext.isAuthenticated = false
    mockAuthContext.user = null
  })

  it('renders login form correctly', () => {
    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    )
    
    // Check for email input
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    
    // Check for password input
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    
    // Check for sign in button
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('handles form submission with valid credentials', async () => {
    // Mock successful login
    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: { 
        user: { id: 'test-user', email: 'test@example.com' },
        session: { access_token: 'mock-token' }
      },
      error: null,
    })

    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    )
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    
    // Fill out the form
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    
    // Submit the form
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          captchaToken: undefined,
        },
      })
    })
    
    // Check that LogRocket tracking was called
    expect(mockLogRocket.track).toHaveBeenCalledWith('login_attempt', {
      method: 'email',
      location: 'US',
    })
  })

  it('shows loading state during authentication', async () => {
    // Mock loading state
    mockAuthContext.isLoading = true
    
    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    )
    
    const submitButton = screen.getByRole('button')
    expect(submitButton).toBeDisabled()
  })

  it('handles authentication error gracefully', async () => {
    // Mock authentication error
    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: 'Invalid credentials' },
    })

    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    )
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    
    // Fill out and submit the form
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalled()
    })
  })

  it('displays form elements correctly', () => {
    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    )
    
    // Should have basic form structure
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})