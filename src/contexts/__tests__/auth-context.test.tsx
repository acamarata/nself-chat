import { render, screen, waitFor, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '../auth-context'

const mockPush = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock the auth config
jest.mock('@/config/auth.config', () => ({
  authConfig: {
    useDevAuth: true,
    devAuth: {
      autoLogin: false,
      defaultUser: null,
      availableUsers: [
        {
          id: 'test-user-1',
          email: 'owner@nself.org',
          username: 'owner',
          displayName: 'System Owner',
          role: 'owner',
          avatarUrl: null,
        },
        {
          id: 'test-user-2',
          email: 'member@nself.org',
          username: 'member',
          displayName: 'Member User',
          role: 'member',
          avatarUrl: null,
        },
      ],
    },
    session: {
      maxAge: 30 * 24 * 60 * 60,
    },
  },
}))

// Test component factory - creates a new component for each test
function createTestComponent() {
  return function TestComponent() {
    const { user, loading, signIn, signUp, signOut, updateProfile } = useAuth()
    return (
      <div>
        <div data-testid="loading">{loading.toString()}</div>
        <div data-testid="user">{user ? user.email : 'no user'}</div>
        <div data-testid="user-role">{user ? user.role : 'no role'}</div>
        <button onClick={() => signIn('owner@nself.org', 'password')}>Sign In Owner</button>
        <button onClick={() => signIn('member@nself.org', 'password')}>Sign In Member</button>
        <button onClick={() => signUp('new@example.com', 'password', 'newuser', 'New User')}>
          Sign Up
        </button>
        <button onClick={() => signOut()}>Sign Out</button>
        <button onClick={() => updateProfile({ displayName: 'Updated Name' })}>
          Update Profile
        </button>
      </div>
    )
  }
}

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPush.mockClear()
    localStorage.clear()
  })

  it('provides auth context to children', async () => {
    const TestComponent = createTestComponent()

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('loading')).toBeInTheDocument()
    expect(screen.getByTestId('user')).toBeInTheDocument()
  })

  it('throws error when useAuth is used outside AuthProvider', () => {
    const TestComponent = createTestComponent()
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(<TestComponent />)).toThrow('useAuth must be used within an AuthProvider')

    consoleSpy.mockRestore()
  })

  it('initially shows loading state then completes', async () => {
    const TestComponent = createTestComponent()

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
    })
  })

  it('handles sign in successfully with predefined user', async () => {
    const TestComponent = createTestComponent()

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
    })

    const signInButton = screen.getByText('Sign In Owner')

    await act(async () => {
      signInButton.click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('owner@nself.org')
      expect(mockPush).toHaveBeenCalledWith('/chat')
    })
  })

  it('handles sign in with member role', async () => {
    const TestComponent = createTestComponent()

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
    })

    const signInButton = screen.getByText('Sign In Member')

    await act(async () => {
      signInButton.click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('member@nself.org')
      expect(screen.getByTestId('user-role')).toHaveTextContent('member')
      expect(mockPush).toHaveBeenCalledWith('/chat')
    })
  })

  it('handles sign up successfully', async () => {
    const TestComponent = createTestComponent()

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
    })

    const signUpButton = screen.getByText('Sign Up')

    await act(async () => {
      signUpButton.click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('new@example.com')
      expect(mockPush).toHaveBeenCalledWith('/chat')
    })
  })

  it('handles sign out after sign in', async () => {
    const TestComponent = createTestComponent()

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
    })

    // First sign in
    const signInButton = screen.getByText('Sign In Owner')
    await act(async () => {
      signInButton.click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('owner@nself.org')
    })

    // Then sign out
    const signOutButton = screen.getByText('Sign Out')
    await act(async () => {
      signOutButton.click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('no user')
      expect(mockPush).toHaveBeenCalledWith('/')
    })
  })

  it('handles profile update in dev mode', async () => {
    const TestComponent = createTestComponent()

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
    })

    // First sign in
    const signInButton = screen.getByText('Sign In Owner')
    await act(async () => {
      signInButton.click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('owner@nself.org')
    })

    // Then update profile
    const updateButton = screen.getByText('Update Profile')
    await act(async () => {
      updateButton.click()
    })

    // Profile update should work without error in dev mode
    // The user should still be logged in
    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('owner@nself.org')
    })
  })
})
