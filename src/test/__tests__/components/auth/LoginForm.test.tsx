import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LoginForm } from '../../../../components/auth/LoginForm'
import { testUtils, TestWrapper } from '../../../setup'

// Mock the auth context
const mockAuthContext = {
  signIn: vi.fn(),
  user: null,
  isLoading: false,
  isAuthenticated: false,
}

// Mock the auth context manually since vi.mock is not available
// We'll use a different approach for now

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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

  it('calls signIn with correct credentials on form submission', async () => {
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
      expect(mockAuthContext.signIn).toHaveBeenCalledWith('test@vortexcore.app', 'password123')
    })
  })

  it('shows loading state during authentication', async () => {
    mockAuthContext.isLoading = true
    
    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    )
    
    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled()
  })

  it('handles authentication error gracefully', async () => {
    mockAuthContext.signIn.mockRejectedValueOnce(new Error('Invalid credentials'))
    
    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    )
    
    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    
    fireEvent.change(emailInput, { target: { value: 'test@vortexcore.app' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
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
