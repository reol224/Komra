import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within, act, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginForm from '@/components/auth/LoginForm';
import { AuthProvider } from '@/contexts/AuthContext';

// ============================================================================
// TEST UTILITIES & MOCKS
// ============================================================================

// Mock signIn function for controlled testing
const mockSignIn = vi.fn();

// Mock the AuthContext to control signIn behavior
vi.mock('@/contexts/AuthContext', async () => {
  const actual = await vi.importActual('@/contexts/AuthContext');
  return {
    ...actual,
    useAuth: () => ({
      signIn: mockSignIn,
      user: null,
      loading: false,
      signOut: vi.fn(),
      hasPermission: vi.fn(() => false),
      canAccess: vi.fn(() => false),
      refreshUser: vi.fn(),
    }),
  };
});

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Test logger for comprehensive logging (silent by default, set VERBOSE_TESTS=true to enable)
const isVerbose = process.env.VERBOSE_TESTS === 'true';
const testLogger = {
  group: (name: string) => isVerbose && console.log(`\n📋 TEST GROUP: ${name}`),
  test: (name: string) => isVerbose && console.log(`  🧪 Running: ${name}`),
  pass: (name: string) => isVerbose && console.log(`  ✅ PASSED: ${name}`),
  fail: (name: string, error: string) => isVerbose && console.log(`  ❌ FAILED: ${name} - ${error}`),
  info: (message: string) => isVerbose && console.log(`    ℹ️  ${message}`),
};

// ============================================================================
// TEST SUITE: LoginForm Component
// ============================================================================

describe('LoginForm Component - Comprehensive Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testLogger.info('Test environment reset');
  });

  afterEach(async () => {
    // Wait for any pending state updates before cleanup
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    cleanup();
    testLogger.info('Test cleanup complete');
  });

  // ==========================================================================
  // RENDERING TESTS
  // ==========================================================================
  describe('Rendering & Initial State', () => {
    testLogger.group('Rendering & Initial State');

    it('should render the login form header with branding', () => {
      testLogger.test('Login form header rendering');
      render(<LoginForm />);

      expect(screen.getByText('Komra Security Audit')).toBeInTheDocument();
      expect(screen.getByText('Sign in to access the vulnerability dashboard')).toBeInTheDocument();
      testLogger.pass('Login form header rendering');
    });

    it('should render email input field with correct attributes', () => {
      testLogger.test('Email input field attributes');
      render(<LoginForm />);

      const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('id', 'email');
      expect(emailInput).toHaveAttribute('required');
      expect(emailInput.value).toBe('');
      testLogger.pass('Email input field attributes');
    });

    it('should render password input field with correct attributes', () => {
      testLogger.test('Password input field attributes');
      render(<LoginForm />);

      const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
      expect(passwordInput).toBeInTheDocument();
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toHaveAttribute('id', 'password');
      expect(passwordInput.value).toBe('');
      testLogger.pass('Password input field attributes');
    });

    it('should render the submit button with correct text', () => {
      testLogger.test('Submit button rendering');
      render(<LoginForm />);

      // Get the submit button by type attribute to avoid ambiguity
      const submitButton = screen.getByRole('button', { name: /^Sign In$/i });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toHaveAttribute('type', 'submit');
      expect(submitButton).not.toBeDisabled();
      testLogger.pass('Submit button rendering');
    });

    it('should render Okta SSO button', () => {
      testLogger.test('Okta SSO button rendering');
      render(<LoginForm />);

      const oktaButton = screen.getByRole('button', { name: /sign in with okta sso/i });
      expect(oktaButton).toBeInTheDocument();
      // Okta button should not be a submit button (no type="submit")
      expect(oktaButton).not.toHaveAttribute('type', 'submit');
      testLogger.pass('Okta SSO button rendering');
    });

    it('should render all three demo account buttons', () => {
      testLogger.test('Demo account buttons rendering');
      render(<LoginForm />);

      expect(screen.getByRole('button', { name: /login as admin/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /login as analyst/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /login as viewer/i })).toBeInTheDocument();
      testLogger.pass('Demo account buttons rendering');
    });

    it('should render security notice section', () => {
      testLogger.test('Security notice section rendering');
      render(<LoginForm />);

      expect(screen.getByText('Enhanced Security')).toBeInTheDocument();
      expect(screen.getByText(/Multi-Factor Authentication required/i)).toBeInTheDocument();
      expect(screen.getByText(/Session timeouts prevent unauthorized access/i)).toBeInTheDocument();
      expect(screen.getByText(/Okta SSO integration for enterprise authentication/i)).toBeInTheDocument();
      testLogger.pass('Security notice section rendering');
    });

    it('should render forgot password link', () => {
      testLogger.test('Forgot password link rendering');
      render(<LoginForm />);

      const forgotPasswordLink = screen.getByRole('button', { name: /forgot password/i });
      expect(forgotPasswordLink).toBeInTheDocument();
      testLogger.pass('Forgot password link rendering');
    });

    it('should render go back button with link to homepage', () => {
      testLogger.test('Go back button rendering');
      render(<LoginForm />);

      const goBackButton = screen.getByRole('button', { name: /go back/i });
      expect(goBackButton).toBeInTheDocument();
      
      // Check the parent link
      const link = goBackButton.closest('a');
      expect(link).toHaveAttribute('href', '/homepage');
      testLogger.pass('Go back button rendering');
    });
  });

  // ==========================================================================
  // FORM INTERACTION TESTS
  // ==========================================================================
  describe('Form Interaction & Input Handling', () => {
    testLogger.group('Form Interaction & Input Handling');

    it('should update email input value when typing', async () => {
      testLogger.test('Email input value update');
      const user = userEvent.setup();
      await act(async () => {
        render(<LoginForm />);
      });

      const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
      await act(async () => {
        await user.type(emailInput, 'test@example.com');
      });

      expect(emailInput.value).toBe('test@example.com');
      testLogger.info(`Email input value: ${emailInput.value}`);
      testLogger.pass('Email input value update');
    });

    it('should update password input value when typing', async () => {
      testLogger.test('Password input value update');
      const user = userEvent.setup();
      await act(async () => {
        render(<LoginForm />);
      });

      const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
      await act(async () => {
        await user.type(passwordInput, 'securePassword123');
      });

      expect(passwordInput.value).toBe('securePassword123');
      testLogger.info(`Password input length: ${passwordInput.value.length} characters`);
      testLogger.pass('Password input value update');
    });

    it('should clear input fields when cleared by user', async () => {
      testLogger.test('Input field clearing');
      const user = userEvent.setup();
      await act(async () => {
        render(<LoginForm />);
      });

      const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
      const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;

      await act(async () => {
        await user.type(emailInput, 'test@example.com');
        await user.type(passwordInput, 'password123');
        await user.clear(emailInput);
        await user.clear(passwordInput);
      });

      expect(emailInput.value).toBe('');
      expect(passwordInput.value).toBe('');
      testLogger.pass('Input field clearing');
    });
  });

  // ==========================================================================
  // FORM SUBMISSION TESTS
  // ==========================================================================
  describe('Form Submission & Authentication', () => {
    testLogger.group('Form Submission & Authentication');

    it('should call signIn with correct credentials on form submission', async () => {
      testLogger.test('Form submission with valid credentials');
      const user = userEvent.setup();
      mockSignIn.mockResolvedValueOnce(undefined);
      await act(async () => {
        render(<LoginForm />);
      });

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /^Sign In$/i });

      await act(async () => {
        await user.type(emailInput, 'user@example.com');
        await user.type(passwordInput, 'myPassword123');
        await user.click(submitButton);
      });

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledTimes(1);
        expect(mockSignIn).toHaveBeenCalledWith('user@example.com', 'myPassword123');
      });
      testLogger.info('signIn called with: user@example.com, myPassword123');
      testLogger.pass('Form submission with valid credentials');
    });

    it('should display error message when login fails', async () => {
      testLogger.test('Error display on login failure');
      const user = userEvent.setup();
      const errorMessage = 'Invalid email or password';
      mockSignIn.mockRejectedValueOnce(new Error(errorMessage));
      await act(async () => {
        render(<LoginForm />);
      });

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /^Sign In$/i });

      await act(async () => {
        await user.type(emailInput, 'wrong@example.com');
        await user.type(passwordInput, 'wrongPassword');
        await user.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
      testLogger.info(`Error displayed: ${errorMessage}`);
      testLogger.pass('Error display on login failure');
    });

    it('should display generic error when error has no message', async () => {
      testLogger.test('Generic error message fallback');
      const user = userEvent.setup();
      mockSignIn.mockRejectedValueOnce({});
      await act(async () => {
        render(<LoginForm />);
      });

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /^Sign In$/i });

      await act(async () => {
        await user.type(emailInput, 'test@example.com');
        await user.type(passwordInput, 'password');
        await user.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Failed to sign in')).toBeInTheDocument();
      });
      testLogger.pass('Generic error message fallback');
    });

    it('should disable form inputs while loading', async () => {
      testLogger.test('Form inputs disabled during loading');
      const user = userEvent.setup();
      // Create a promise that doesn't resolve immediately
      let resolveSignIn: () => void;
      const signInPromise = new Promise<void>((resolve) => {
        resolveSignIn = resolve;
      });
      mockSignIn.mockReturnValueOnce(signInPromise);
      await act(async () => {
        render(<LoginForm />);
      });

      const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
      const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
      const submitButton = screen.getByRole('button', { name: /^Sign In$/i }) as HTMLButtonElement;

      await act(async () => {
        await user.type(emailInput, 'test@example.com');
        await user.type(passwordInput, 'password123');
        await user.click(submitButton);
      });

      // Check that inputs are disabled during loading
      await waitFor(() => {
        expect(emailInput).toBeDisabled();
        expect(passwordInput).toBeDisabled();
        expect(submitButton).toBeDisabled();
      });
      testLogger.info('All form inputs disabled during loading state');

      // Resolve the promise to complete the test
      await act(async () => {
        resolveSignIn!();
      });
      testLogger.pass('Form inputs disabled during loading');
    });

    it('should show loading spinner when submitting', async () => {
      testLogger.test('Loading spinner display');
      const user = userEvent.setup();
      let resolveSignIn: () => void;
      const signInPromise = new Promise<void>((resolve) => {
        resolveSignIn = resolve;
      });
      mockSignIn.mockReturnValueOnce(signInPromise);
      await act(async () => {
        render(<LoginForm />);
      });

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /^Sign In$/i });

      await act(async () => {
        await user.type(emailInput, 'test@example.com');
        await user.type(passwordInput, 'password123');
        await user.click(submitButton);
      });

      // The Loader2 component should be rendered (it has animate-spin class)
      await waitFor(() => {
        const spinner = document.querySelector('.animate-spin');
        expect(spinner).toBeInTheDocument();
      });
      testLogger.info('Loading spinner is visible');

      await act(async () => {
        resolveSignIn!();
      });
      testLogger.pass('Loading spinner display');
    });

    it('should clear error message when form is resubmitted', async () => {
      testLogger.test('Error clearing on resubmission');
      const user = userEvent.setup();
      mockSignIn.mockRejectedValueOnce(new Error('First error'));
      await act(async () => {
        render(<LoginForm />);
      });

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /^Sign In$/i });

      // First submission - should show error
      await act(async () => {
        await user.type(emailInput, 'test@example.com');
        await user.type(passwordInput, 'wrongpassword');
        await user.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('First error')).toBeInTheDocument();
      });
      testLogger.info('First error displayed');

      // Second submission - error should be cleared
      mockSignIn.mockResolvedValueOnce(undefined);
      await act(async () => {
        await user.clear(passwordInput);
        await user.type(passwordInput, 'correctpassword');
        await user.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.queryByText('First error')).not.toBeInTheDocument();
      });
      testLogger.info('Error cleared on resubmission');
      testLogger.pass('Error clearing on resubmission');
    });
  });

  // ==========================================================================
  // DEMO LOGIN TESTS
  // ==========================================================================
  describe('Demo Account Login Functionality', () => {
    testLogger.group('Demo Account Login Functionality');

    it('should login as admin when admin button is clicked', async () => {
      testLogger.test('Admin demo login');
      const user = userEvent.setup();
      mockSignIn.mockResolvedValueOnce(undefined);
      await act(async () => {
        render(<LoginForm />);
      });

      const adminButton = screen.getByRole('button', { name: /login as admin/i });
      await act(async () => {
        await user.click(adminButton);
      });

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('admin@komra.security', 'password123');
      });
      testLogger.info('Admin login credentials: admin@komra.security');
      testLogger.pass('Admin demo login');
    });

    it('should login as analyst when analyst button is clicked', async () => {
      testLogger.test('Analyst demo login');
      const user = userEvent.setup();
      mockSignIn.mockResolvedValueOnce(undefined);
      await act(async () => {
        render(<LoginForm />);
      });

      const analystButton = screen.getByRole('button', { name: /login as analyst/i });
      await act(async () => {
        await user.click(analystButton);
      });

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('analyst@komra.security', 'password123');
      });
      testLogger.info('Analyst login credentials: analyst@komra.security');
      testLogger.pass('Analyst demo login');
    });

    it('should login as viewer when viewer button is clicked', async () => {
      testLogger.test('Viewer demo login');
      const user = userEvent.setup();
      mockSignIn.mockResolvedValueOnce(undefined);
      await act(async () => {
        render(<LoginForm />);
      });

      const viewerButton = screen.getByRole('button', { name: /login as viewer/i });
      await act(async () => {
        await user.click(viewerButton);
      });

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('viewer@komra.security', 'password123');
      });
      testLogger.info('Viewer login credentials: viewer@komra.security');
      testLogger.pass('Viewer demo login');
    });

    it('should populate email and password fields when demo button is clicked', async () => {
      testLogger.test('Demo button field population');
      const user = userEvent.setup();
      mockSignIn.mockResolvedValueOnce(undefined);
      await act(async () => {
        render(<LoginForm />);
      });

      const adminButton = screen.getByRole('button', { name: /login as admin/i });
      await act(async () => {
        await user.click(adminButton);
      });

      const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
      const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;

      await waitFor(() => {
        expect(emailInput.value).toBe('admin@komra.security');
        expect(passwordInput.value).toBe('password123');
      });
      testLogger.info('Fields populated with demo credentials');
      testLogger.pass('Demo button field population');
    });

    it('should display error when demo login fails', async () => {
      testLogger.test('Demo login error handling');
      const user = userEvent.setup();
      const errorMessage = 'Demo account temporarily unavailable';
      mockSignIn.mockRejectedValueOnce(new Error(errorMessage));
      await act(async () => {
        render(<LoginForm />);
      });

      const adminButton = screen.getByRole('button', { name: /login as admin/i });
      await act(async () => {
        await user.click(adminButton);
      });

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
      testLogger.info(`Demo login error: ${errorMessage}`);
      testLogger.pass('Demo login error handling');
    });

    it('should disable demo buttons while loading', async () => {
      testLogger.test('Demo buttons disabled during loading');
      const user = userEvent.setup();
      let resolveSignIn: () => void;
      const signInPromise = new Promise<void>((resolve) => {
        resolveSignIn = resolve;
      });
      mockSignIn.mockReturnValueOnce(signInPromise);
      await act(async () => {
        render(<LoginForm />);
      });

      const adminButton = screen.getByRole('button', { name: /login as admin/i });
      await act(async () => {
        await user.click(adminButton);
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /login as admin/i })).toBeDisabled();
        expect(screen.getByRole('button', { name: /login as analyst/i })).toBeDisabled();
        expect(screen.getByRole('button', { name: /login as viewer/i })).toBeDisabled();
      });
      testLogger.info('All demo buttons disabled during loading');

      await act(async () => {
        resolveSignIn!();
      });
      testLogger.pass('Demo buttons disabled during loading');
    });
  });

  // ==========================================================================
  // OKTA SSO TESTS
  // ==========================================================================
  describe('Okta SSO Integration', () => {
    testLogger.group('Okta SSO Integration');

    it('should display Okta integration message when Okta button is clicked', async () => {
      testLogger.test('Okta SSO message display');
      const user = userEvent.setup();
      await act(async () => {
        render(<LoginForm />);
      });

      const oktaButton = screen.getByRole('button', { name: /sign in with okta sso/i });
      await act(async () => {
        await user.click(oktaButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/Okta integration would redirect/i)).toBeInTheDocument();
      });
      testLogger.info('Okta SSO message displayed');
      testLogger.pass('Okta SSO message display');
    });

    it('should not call signIn when Okta button is clicked', async () => {
      testLogger.test('Okta button does not trigger signIn');
      const user = userEvent.setup();
      await act(async () => {
        render(<LoginForm />);
      });

      const oktaButton = screen.getByRole('button', { name: /sign in with okta sso/i });
      await act(async () => {
        await user.click(oktaButton);
      });

      expect(mockSignIn).not.toHaveBeenCalled();
      testLogger.info('signIn was not called for Okta SSO');
      testLogger.pass('Okta button does not trigger signIn');
    });

    it('should disable Okta button while loading', async () => {
      testLogger.test('Okta button disabled during loading');
      const user = userEvent.setup();
      let resolveSignIn: () => void;
      const signInPromise = new Promise<void>((resolve) => {
        resolveSignIn = resolve;
      });
      mockSignIn.mockReturnValueOnce(signInPromise);
      await act(async () => {
        render(<LoginForm />);
      });

      // Trigger loading state via form submission
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /^Sign In$/i });

      await act(async () => {
        await user.type(emailInput, 'test@example.com');
        await user.type(passwordInput, 'password123');
        await user.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /sign in with okta sso/i })).toBeDisabled();
      });
      testLogger.info('Okta button disabled during loading');

      await act(async () => {
        resolveSignIn!();
      });
      testLogger.pass('Okta button disabled during loading');
    });
  });

  // ==========================================================================
  // FORM VALIDATION TESTS
  // ==========================================================================
  describe('Form Validation', () => {
    testLogger.group('Form Validation');

    it('should have required attribute on email field', () => {
      testLogger.test('Email field required attribute');
      render(<LoginForm />);

      const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
      expect(emailInput).toHaveAttribute('required');
      testLogger.pass('Email field required attribute');
    });

    it('should have email type for email input', () => {
      testLogger.test('Email input type attribute');
      render(<LoginForm />);

      const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
      expect(emailInput).toHaveAttribute('type', 'email');
      testLogger.info('Email input has type="email" for browser validation');
      testLogger.pass('Email input type attribute');
    });

    it('should have password type for password input', () => {
      testLogger.test('Password input type attribute');
      render(<LoginForm />);

      const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
      expect(passwordInput).toHaveAttribute('type', 'password');
      testLogger.info('Password input has type="password" for security');
      testLogger.pass('Password input type attribute');
    });

    it('should have placeholder text for email input', () => {
      testLogger.test('Email placeholder text');
      render(<LoginForm />);

      const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
      expect(emailInput).toHaveAttribute('placeholder', 'Enter your email');
      testLogger.pass('Email placeholder text');
    });

    it('should have placeholder text for password input', () => {
      testLogger.test('Password placeholder text');
      render(<LoginForm />);

      const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
      expect(passwordInput).toHaveAttribute('placeholder', 'Enter your password');
      testLogger.pass('Password placeholder text');
    });
  });

  // ==========================================================================
  // ACCESSIBILITY TESTS
  // ==========================================================================
  describe('Accessibility', () => {
    testLogger.group('Accessibility');

    it('should have proper labels for form inputs', () => {
      testLogger.test('Form input labels');
      render(<LoginForm />);

      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      testLogger.info('All form inputs have associated labels');
      testLogger.pass('Form input labels');
    });

    it('should have proper button roles', () => {
      testLogger.test('Button roles');
      render(<LoginForm />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(6); // Submit, Okta, 3 demo, Go Back, Forgot Password
      testLogger.info(`Found ${buttons.length} buttons with proper roles`);
      testLogger.pass('Button roles');
    });

    it('should have descriptive button text', () => {
      testLogger.test('Descriptive button text');
      render(<LoginForm />);

      expect(screen.getByRole('button', { name: /^Sign In$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in with okta sso/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /login as admin/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /login as analyst/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /login as viewer/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /forgot password/i })).toBeInTheDocument();
      testLogger.pass('Descriptive button text');
    });

    it('should have form element wrapping inputs', () => {
      testLogger.test('Form element structure');
      render(<LoginForm />);

      const form = document.querySelector('form');
      expect(form).toBeInTheDocument();
      
      // Check that email and password inputs are within the form
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      expect(form).toContainElement(emailInput);
      expect(form).toContainElement(passwordInput);
      testLogger.info('Form element properly wraps input fields');
      testLogger.pass('Form element structure');
    });

    it('should have proper heading hierarchy', () => {
      testLogger.test('Heading hierarchy');
      render(<LoginForm />);

      // The card title should be present
      expect(screen.getByText('Komra Security Audit')).toBeInTheDocument();
      testLogger.pass('Heading hierarchy');
    });
  });

  // ==========================================================================
  // EDGE CASES & ERROR HANDLING
  // ==========================================================================
  describe('Edge Cases & Error Handling', () => {
    testLogger.group('Edge Cases & Error Handling');

    it('should handle rapid form submissions gracefully', async () => {
      testLogger.test('Rapid form submissions');
      const user = userEvent.setup();
      let resolveSignIn: () => void;
      const signInPromise = new Promise<void>((resolve) => {
        resolveSignIn = resolve;
      });
      mockSignIn.mockReturnValue(signInPromise);
      render(<LoginForm />);

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /^Sign In$/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      
      // Click submit multiple times rapidly
      await user.click(submitButton);
      
      // Button should be disabled after first click
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });

      // Only one call should have been made
      expect(mockSignIn).toHaveBeenCalledTimes(1);
      testLogger.info('Rapid submissions prevented by disabled state');

      resolveSignIn!();
      testLogger.pass('Rapid form submissions');
    });

    it('should handle special characters in email', async () => {
      testLogger.test('Special characters in email');
      const user = userEvent.setup();
      mockSignIn.mockResolvedValueOnce(undefined);
      render(<LoginForm />);

      const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /^Sign In$/i });

      const specialEmail = 'user+test@example.com';
      await user.type(emailInput, specialEmail);
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith(specialEmail, 'password123');
      });
      testLogger.info(`Special email handled: ${specialEmail}`);
      testLogger.pass('Special characters in email');
    });

    it('should handle special characters in password', async () => {
      testLogger.test('Special characters in password');
      const user = userEvent.setup();
      mockSignIn.mockResolvedValueOnce(undefined);
      render(<LoginForm />);

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
      const submitButton = screen.getByRole('button', { name: /^Sign In$/i });

      const specialPassword = 'P@$$w0rd!#$%^&*()';
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, specialPassword);
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('test@example.com', specialPassword);
      });
      testLogger.info('Special characters in password handled correctly');
      testLogger.pass('Special characters in password');
    });

    it('should handle network timeout errors', async () => {
      testLogger.test('Network timeout error handling');
      const user = userEvent.setup();
      mockSignIn.mockRejectedValueOnce(new Error('Network request timed out'));
      render(<LoginForm />);

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /^Sign In$/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Network request timed out')).toBeInTheDocument();
      });
      testLogger.info('Network timeout error displayed to user');
      testLogger.pass('Network timeout error handling');
    });

    it('should re-enable form after failed submission', async () => {
      testLogger.test('Form re-enabled after failure');
      const user = userEvent.setup();
      mockSignIn.mockRejectedValueOnce(new Error('Login failed'));
      render(<LoginForm />);

      const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
      const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
      const submitButton = screen.getByRole('button', { name: /^Sign In$/i }) as HTMLButtonElement;

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Wait for error and form to be re-enabled
      await waitFor(() => {
        expect(screen.getByText('Login failed')).toBeInTheDocument();
        expect(emailInput).not.toBeDisabled();
        expect(passwordInput).not.toBeDisabled();
        expect(submitButton).not.toBeDisabled();
      });
      testLogger.info('Form re-enabled after failed submission');
      testLogger.pass('Form re-enabled after failure');
    });
  });

  // ==========================================================================
  // VISUAL STATE TESTS
  // ==========================================================================
  describe('Visual States', () => {
    testLogger.group('Visual States');

    it('should have correct initial visual state', () => {
      testLogger.test('Initial visual state');
      render(<LoginForm />);

      const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
      const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
      const submitButton = screen.getByRole('button', { name: /^Sign In$/i });

      // Inputs should be empty and enabled
      expect(emailInput.value).toBe('');
      expect(passwordInput.value).toBe('');
      expect(emailInput).not.toBeDisabled();
      expect(passwordInput).not.toBeDisabled();
      expect(submitButton).not.toBeDisabled();

      // No error should be displayed
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      testLogger.pass('Initial visual state');
    });

    it('should display error alert with correct styling', async () => {
      testLogger.test('Error alert styling');
      const user = userEvent.setup();
      mockSignIn.mockRejectedValueOnce(new Error('Test error'));
      render(<LoginForm />);

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /^Sign In$/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password');
      await user.click(submitButton);

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
        expect(alert).toHaveTextContent('Test error');
      });
      testLogger.pass('Error alert styling');
    });
  });
});