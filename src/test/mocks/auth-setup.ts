import { vi } from 'vitest'

// Mock external dependencies that cause hoisting issues
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signInWithOAuth: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({ data: [], error: null })),
      insert: vi.fn(() => ({ data: [], error: null })),
      update: vi.fn(() => ({ data: [], error: null })),
      delete: vi.fn(() => ({ data: [], error: null })),
    }))
  }
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    user: null,
    isLoading: false,
    signIn: vi.fn(),
    signOut: vi.fn(),
    signUp: vi.fn(),
    identifyUser: vi.fn(),
  })
}))

vi.mock('logrocket', () => ({
  default: {
    track: vi.fn(),
    identify: vi.fn(),
  }
}))

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
  toast: vi.fn(),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useLocation: () => ({
      pathname: '/login',
      search: '',
      hash: '',
      state: null,
    }),
    useNavigate: () => vi.fn(),
  }
})

// Mock SocialLoginButtons component that might cause circular deps
vi.mock('@/components/auth/SocialLoginButtons', () => ({
  SocialLoginButtons: () => null
}))
