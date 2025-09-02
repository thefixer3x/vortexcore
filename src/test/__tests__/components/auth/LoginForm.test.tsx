import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LoginForm } from '../../../../components/auth/LoginForm'
import { testUtils } from '../../../setup'
import { TestWrapper } from '../../../test-wrapper'

// Mock the supabase client
const mockSupabase = {
  auth: {
    signInWithPassword: vi.fn(),
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } }))
  }
}

// Mock the supabase client import
vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase
}))

// Mock LogRocket
vi.mock('logrocket', () => ({
  default: {
    track: vi.fn(),
    identify: vi.fn()
  }
}))

// Mock the toast hook
const mockToast = vi.fn()
vi.mock('@/hooks/use-toast', () => ({
  toast: mockToast
}))

// Mock the location hook
vi.mock('@/hooks/use-location', () => ({
  useLocation: () => ({ country: 'US', city: 'Test City' })
}))

// Mock router
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mock implementations
    mockSupabase.auth.signInWithPassword.mockResolvedValue({ data: {}, error: null })
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null })
  })

  it('renders login form correctly', () => {
    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    )
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('displays validation errors for empty fields', async () => {
    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    )
    
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    })
  })

  it('displays validation error for invalid email format', async () => {
    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    )
    
    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
    })
  })

  it('calls signInWithPassword with correct credentials on form submission', async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: { id: 'test-id', email: 'test@vortexcore.app' }, session: { access_token: 'token' } },
      error: null
    })
    
    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    )
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    
    fireEvent.change(emailInput, { target: { value: 'test@vortexcore.app' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@vortexcore.app',
        password: 'password123',
        options: { captchaToken: undefined }
      })
    })
  })

  it('shows loading state during authentication', async () => {
    // Mock a delayed response
    mockSupabase.auth.signInWithPassword.mockImplementationOnce(
      () => new Promise(resolve => setTimeout(() => resolve({ data: {}, error: null }), 100))
    )
    
    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    )
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    
    fireEvent.change(emailInput, { target: { value: 'test@vortexcore.app' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)
    
    // Check loading state immediately after click
    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled()
  })

  it('handles authentication error gracefully', async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: null,
      error: { message: 'Invalid login credentials' }
    })
    
    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    )
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    
    fireEvent.change(emailInput, { target: { value: 'test@vortexcore.app' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Invalid Credentials',
        description: 'Please check your email and password and try again',
        variant: 'destructive'
      })
    })
  })

  it('provides option to switch to sign up', () => {
    render(<LoginForm />)
    
    expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument()
  })

  it('provides forgot password option', () => {
    render(<LoginForm />)
    
    expect(screen.getByRole('link', { name: /forgot password/i })).toBeInTheDocument()
  })
})
