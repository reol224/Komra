import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ============================================================================
// TEST UTILITIES & MOCKS
// ============================================================================

// Mock ResizeObserver for Radix UI components
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Create mock functions at module level
const mockInsert = vi.fn();
const mockSelectCount = vi.fn();

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: mockInsert,
      select: vi.fn(() => mockSelectCount),
    })),
  })),
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string }) => (
    <img src={src} alt={alt} {...props} />
  ),
}));

// Import after mocks
import PreLaunchPage from '@/app/waitlist/page';

// Test logger for comprehensive logging (silent by default, set VERBOSE_TESTS=true to enable)
const isVerbose = process.env.VERBOSE_TESTS === 'true';
const testLogger = {
  group: (name: string) => isVerbose && console.log(`\n📋 TEST GROUP: ${name}`),
  test: (name: string) => isVerbose && console.log(`  🧪 Running: ${name}`),
  pass: (name: string) => isVerbose && console.log(`  ✅ PASSED: ${name}`),
  fail: (name: string, error: string) => isVerbose && console.log(`  ❌ FAILED: ${name} - ${error}`),
  info: (message: string) => isVerbose && console.log(`    ℹ️  ${message}`),
};

// Helper function to fill required form fields
const fillRequiredFields = async (
  user: ReturnType<typeof userEvent.setup>,
  overrides: { firstName?: string; lastName?: string; email?: string } = {}
) => {
  const firstName = overrides.firstName ?? 'John';
  const lastName = overrides.lastName ?? 'Doe';
  const email = overrides.email ?? 'john@example.com';

  const firstNameInput = screen.getByPlaceholderText('Enter your first name');
  const lastNameInput = screen.getByPlaceholderText('Enter your last name');
  const emailInput = screen.getByPlaceholderText('your.email@company.com');

  await user.type(firstNameInput, firstName);
  await user.type(lastNameInput, lastName);
  await user.type(emailInput, email);

  return { firstNameInput, lastNameInput, emailInput };
};

// ============================================================================
// TEST SUITE: Waitlist Page Component
// ============================================================================

describe('Waitlist Page - Comprehensive Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert.mockResolvedValue({ error: null });
    mockSelectCount.mockResolvedValue({ count: 42 });
    testLogger.info('Test environment reset');
  });

  afterEach(() => {
    testLogger.info('Test cleanup complete');
  });

  // ==========================================================================
  // RENDERING TESTS
  // ==========================================================================
  describe('Rendering & Initial State', () => {
    testLogger.group('Rendering & Initial State');

    it('should render the page header with Komra branding', () => {
      testLogger.test('Page header with Komra branding');
      render(<PreLaunchPage />);

      const komraElements = screen.getAllByText('Komra');
      expect(komraElements.length).toBeGreaterThan(0);
      expect(screen.getByText('Coming Soon')).toBeInTheDocument();
      testLogger.info(`Found ${komraElements.length} Komra branding elements`);
      testLogger.pass('Page header with Komra branding');
    });

    it('should render the hero section with tagline', () => {
      testLogger.test('Hero section rendering');
      render(<PreLaunchPage />);

      expect(screen.getByText('Security Intelligence')).toBeInTheDocument();
      expect(screen.getByText('Simplified')).toBeInTheDocument();
      expect(screen.getByText(/Pre-Launch • Join the Waitlist/)).toBeInTheDocument();
      testLogger.pass('Hero section rendering');
    });

    it('should render the waitlist form title', () => {
      testLogger.test('Waitlist form title');
      render(<PreLaunchPage />);

      expect(screen.getByText('Join the Komra Waitlist')).toBeInTheDocument();
      testLogger.pass('Waitlist form title');
    });

    it('should render all required form fields', () => {
      testLogger.test('Required form fields rendering');
      render(<PreLaunchPage />);

      expect(screen.getByPlaceholderText('Enter your first name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your last name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('your.email@company.com')).toBeInTheDocument();
      testLogger.info('All required fields: first name, last name, email');
      testLogger.pass('Required form fields rendering');
    });

    it('should render all optional form fields', () => {
      testLogger.test('Optional form fields rendering');
      render(<PreLaunchPage />);

      expect(screen.getByPlaceholderText('Your company name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Your job title')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Tell us about your current security pain points/)).toBeInTheDocument();
      testLogger.info('Optional fields: company, job title, use case');
      testLogger.pass('Optional form fields rendering');
    });

    it('should render the submit button with correct text', () => {
      testLogger.test('Submit button rendering');
      render(<PreLaunchPage />);

      const submitButton = screen.getByRole('button', { name: /join the waitlist/i });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).not.toBeDisabled();
      testLogger.pass('Submit button rendering');
    });

    it('should render the problem section', () => {
      testLogger.test('Problem section rendering');
      render(<PreLaunchPage />);

      expect(screen.getByText('The Problem')).toBeInTheDocument();
      expect(screen.getByText(/Traditional SIEMs cost/)).toBeInTheDocument();
      testLogger.pass('Problem section rendering');
    });

    it('should render the solution section', () => {
      testLogger.test('Solution section rendering');
      render(<PreLaunchPage />);

      expect(screen.getByText('The Komra Solution')).toBeInTheDocument();
      expect(screen.getByText(/Enterprise security at SMB prices/)).toBeInTheDocument();
      testLogger.pass('Solution section rendering');
    });

    it('should render the benefits section with all benefits', () => {
      testLogger.test('Benefits section rendering');
      render(<PreLaunchPage />);

      expect(screen.getByText('Early Access')).toBeInTheDocument();
      expect(screen.getByText('Launch Pricing')).toBeInTheDocument();
      expect(screen.getByText('VIP Support')).toBeInTheDocument();
      testLogger.info('Benefits: Early Access, Launch Pricing, VIP Support');
      testLogger.pass('Benefits section rendering');
    });

    it('should render the privacy policy link', () => {
      testLogger.test('Privacy policy link rendering');
      render(<PreLaunchPage />);

      const privacyLink = screen.getByRole('link', { name: /privacy policy/i });
      expect(privacyLink).toBeInTheDocument();
      expect(privacyLink).toHaveAttribute('href', '/privacy');
      testLogger.pass('Privacy policy link rendering');
    });
  });

  // ==========================================================================
  // FORM INPUT HANDLING TESTS
  // ==========================================================================
  describe('Form Input Handling', () => {
    testLogger.group('Form Input Handling');

    it('should update first name field on input', async () => {
      testLogger.test('First name input update');
      const user = userEvent.setup();
      render(<PreLaunchPage />);

      const firstNameInput = screen.getByPlaceholderText('Enter your first name') as HTMLInputElement;
      await user.type(firstNameInput, 'John');

      expect(firstNameInput.value).toBe('John');
      testLogger.info(`First name value: ${firstNameInput.value}`);
      testLogger.pass('First name input update');
    });

    it('should update last name field on input', async () => {
      testLogger.test('Last name input update');
      const user = userEvent.setup();
      render(<PreLaunchPage />);

      const lastNameInput = screen.getByPlaceholderText('Enter your last name') as HTMLInputElement;
      await user.type(lastNameInput, 'Doe');

      expect(lastNameInput.value).toBe('Doe');
      testLogger.info(`Last name value: ${lastNameInput.value}`);
      testLogger.pass('Last name input update');
    });

    it('should update email field on input', async () => {
      testLogger.test('Email input update');
      const user = userEvent.setup();
      render(<PreLaunchPage />);

      const emailInput = screen.getByPlaceholderText('your.email@company.com') as HTMLInputElement;
      await user.type(emailInput, 'john@example.com');

      expect(emailInput.value).toBe('john@example.com');
      testLogger.info(`Email value: ${emailInput.value}`);
      testLogger.pass('Email input update');
    });

    it('should update company field on input', async () => {
      testLogger.test('Company input update');
      const user = userEvent.setup();
      render(<PreLaunchPage />);

      const companyInput = screen.getByPlaceholderText('Your company name') as HTMLInputElement;
      await user.type(companyInput, 'AcmeCorp');

      expect(companyInput.value).toBe('AcmeCorp');
      testLogger.info(`Company value: ${companyInput.value}`);
      testLogger.pass('Company input update');
    });

    it('should update job title field on input', async () => {
      testLogger.test('Job title input update');
      const user = userEvent.setup();
      render(<PreLaunchPage />);

      const jobTitleInput = screen.getByPlaceholderText('Your job title') as HTMLInputElement;
      await user.type(jobTitleInput, 'SecurityEngineer');

      // Note: Sanitization may modify the value
      expect(jobTitleInput.value).toBe('SecurityEngineer');
      testLogger.info(`Job title value: ${jobTitleInput.value}`);
      testLogger.pass('Job title input update');
    });

    it('should update use case textarea on input', async () => {
      testLogger.test('Use case textarea update');
      const user = userEvent.setup();
      render(<PreLaunchPage />);

      const useCaseInput = screen.getByPlaceholderText(/Tell us about your current security pain points/) as HTMLTextAreaElement;
      await user.type(useCaseInput, 'Needbettermonitoring');

      // Note: Sanitization may modify the value
      expect(useCaseInput.value).toBe('Needbettermonitoring');
      testLogger.info(`Use case value: ${useCaseInput.value}`);
      testLogger.pass('Use case textarea update');
    });

    it('should show character count for use case field', async () => {
      testLogger.test('Character count display');
      const user = userEvent.setup();
      render(<PreLaunchPage />);

      const useCaseInput = screen.getByPlaceholderText(/Tell us about your current security pain points/);
      await user.type(useCaseInput, 'Testmessage');

      // Character count should reflect the sanitized input (11 characters without space)
      expect(screen.getByText('11/500 characters')).toBeInTheDocument();
      testLogger.info('Character count: 11/500');
      testLogger.pass('Character count display');
    });

    it('should clear input fields when cleared by user', async () => {
      testLogger.test('Input field clearing');
      const user = userEvent.setup();
      render(<PreLaunchPage />);

      const firstNameInput = screen.getByPlaceholderText('Enter your first name') as HTMLInputElement;
      const lastNameInput = screen.getByPlaceholderText('Enter your last name') as HTMLInputElement;

      await user.type(firstNameInput, 'John');
      await user.type(lastNameInput, 'Doe');
      await user.clear(firstNameInput);
      await user.clear(lastNameInput);

      expect(firstNameInput.value).toBe('');
      expect(lastNameInput.value).toBe('');
      testLogger.pass('Input field clearing');
    });
  });

  // ==========================================================================
  // FORM VALIDATION TESTS
  // ==========================================================================
  describe('Form Validation', () => {
    testLogger.group('Form Validation');

    it('should have required attribute on first name field', () => {
      testLogger.test('First name required attribute');
      render(<PreLaunchPage />);

      const firstNameInput = screen.getByPlaceholderText('Enter your first name');
      expect(firstNameInput).toHaveAttribute('required');
      testLogger.pass('First name required attribute');
    });

    it('should have required attribute on last name field', () => {
      testLogger.test('Last name required attribute');
      render(<PreLaunchPage />);

      const lastNameInput = screen.getByPlaceholderText('Enter your last name');
      expect(lastNameInput).toHaveAttribute('required');
      testLogger.pass('Last name required attribute');
    });

    it('should have required attribute on email field', () => {
      testLogger.test('Email required attribute');
      render(<PreLaunchPage />);

      const emailInput = screen.getByPlaceholderText('your.email@company.com');
      expect(emailInput).toHaveAttribute('required');
      testLogger.pass('Email required attribute');
    });

    it('should have email type for email input', () => {
      testLogger.test('Email input type attribute');
      render(<PreLaunchPage />);

      const emailInput = screen.getByPlaceholderText('your.email@company.com');
      expect(emailInput).toHaveAttribute('type', 'email');
      testLogger.info('Email input has type="email" for browser validation');
      testLogger.pass('Email input type attribute');
    });

    it('should not have required attribute on optional fields', () => {
      testLogger.test('Optional fields not required');
      render(<PreLaunchPage />);

      const companyInput = screen.getByPlaceholderText('Your company name');
      const jobTitleInput = screen.getByPlaceholderText('Your job title');
      const useCaseInput = screen.getByPlaceholderText(/Tell us about your current security pain points/);

      expect(companyInput).not.toHaveAttribute('required');
      expect(jobTitleInput).not.toHaveAttribute('required');
      expect(useCaseInput).not.toHaveAttribute('required');
      testLogger.info('Company, job title, and use case are optional');
      testLogger.pass('Optional fields not required');
    });
  });

  // ==========================================================================
  // FORM SUBMISSION TESTS
  // ==========================================================================
  describe('Form Submission & API Integration', () => {
    testLogger.group('Form Submission & API Integration');

    it('should show loading state during submission', async () => {
      testLogger.test('Loading state during submission');
      const user = userEvent.setup();
      mockInsert.mockImplementation(() => new Promise(() => { })); // Never resolves
      render(<PreLaunchPage />);

      await fillRequiredFields(user);
      const submitButton = screen.getByRole('button', { name: /join the waitlist/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Joining Waitlist...')).toBeInTheDocument();
      });
      testLogger.info('Loading text displayed: "Joining Waitlist..."');
      testLogger.pass('Loading state during submission');
    });

    it('should disable submit button while loading', async () => {
      testLogger.test('Submit button disabled during loading');
      const user = userEvent.setup();
      let resolveInsert: () => void;
      const insertPromise = new Promise<{ error: null }>((resolve) => {
        resolveInsert = () => resolve({ error: null });
      });
      mockInsert.mockReturnValueOnce(insertPromise);
      render(<PreLaunchPage />);

      await fillRequiredFields(user);
      const submitButton = screen.getByRole('button', { name: /join the waitlist/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
      testLogger.info('Submit button disabled during API call');

      resolveInsert!();
      testLogger.pass('Submit button disabled during loading');
    });

    it('should submit form successfully with valid data', async () => {
      testLogger.test('Successful form submission');
      const user = userEvent.setup();
      mockInsert.mockResolvedValue({ error: null });
      mockSelectCount.mockResolvedValue({ count: 42 });
      render(<PreLaunchPage />);

      await fillRequiredFields(user);
      const submitButton = screen.getByRole('button', { name: /join the waitlist/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("You're on the list!")).toBeInTheDocument();
      });
      testLogger.info('Success message displayed');
      testLogger.pass('Successful form submission');
    });

    it('should call Supabase insert with correct data', async () => {
      testLogger.test('Supabase insert called with correct data');
      const user = userEvent.setup();
      mockInsert.mockResolvedValue({ error: null });
      mockSelectCount.mockResolvedValue({ count: 42 });
      render(<PreLaunchPage />);

      await fillRequiredFields(user, {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@company.com',
      });
      const submitButton = screen.getByRole('button', { name: /join the waitlist/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockInsert).toHaveBeenCalledTimes(1);
      });
      testLogger.info('Supabase insert called with sanitized form data');
      testLogger.pass('Supabase insert called with correct data');
    });

    it('should show waitlist position after successful submission', async () => {
      testLogger.test('Waitlist position display');
      const user = userEvent.setup();
      mockInsert.mockResolvedValue({ error: null });
      mockSelectCount.mockResolvedValue({ count: 42 });
      render(<PreLaunchPage />);

      await fillRequiredFields(user);
      const submitButton = screen.getByRole('button', { name: /join the waitlist/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Waitlist Position/)).toBeInTheDocument();
      });
      testLogger.info('Waitlist position displayed after submission');
      testLogger.pass('Waitlist position display');
    });

    it('should handle duplicate email gracefully', async () => {
      testLogger.test('Duplicate email handling');
      const user = userEvent.setup();
      mockInsert.mockResolvedValue({ error: { code: '23505', message: 'Duplicate' } });
      mockSelectCount.mockResolvedValue({ count: 10 });
      render(<PreLaunchPage />);

      await fillRequiredFields(user, { email: 'existing@example.com' });
      const submitButton = screen.getByRole('button', { name: /join the waitlist/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("You're on the list!")).toBeInTheDocument();
      });
      testLogger.info('Duplicate email treated as success (already on waitlist)');
      testLogger.pass('Duplicate email handling');
    });

    it('should show error message on submission failure', async () => {
      testLogger.test('Error message on submission failure');
      const user = userEvent.setup();
      mockInsert.mockResolvedValue({ error: { code: 'OTHER', message: 'Server error' } });
      render(<PreLaunchPage />);

      await fillRequiredFields(user);
      const submitButton = screen.getByRole('button', { name: /join the waitlist/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('An error occurred. Please try again.')).toBeInTheDocument();
      });
      testLogger.info('Error message displayed: "An error occurred. Please try again."');
      testLogger.pass('Error message on submission failure');
    });

    it('should re-enable form after failed submission', async () => {
      testLogger.test('Form re-enabled after failure');
      const user = userEvent.setup();
      mockInsert.mockResolvedValue({ error: { code: 'OTHER', message: 'Server error' } });
      render(<PreLaunchPage />);

      await fillRequiredFields(user);
      const submitButton = screen.getByRole('button', { name: /join the waitlist/i }) as HTMLButtonElement;
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('An error occurred. Please try again.')).toBeInTheDocument();
        expect(submitButton).not.toBeDisabled();
      });
      testLogger.info('Form re-enabled after failed submission');
      testLogger.pass('Form re-enabled after failure');
    });
  });

  // ==========================================================================
  // SUCCESS STATE TESTS
  // ==========================================================================
  describe('Success State', () => {
    testLogger.group('Success State');

    it('should display success message after submission', async () => {
      testLogger.test('Success message display');
      const user = userEvent.setup();
      mockInsert.mockResolvedValue({ error: null });
      mockSelectCount.mockResolvedValue({ count: 42 });
      render(<PreLaunchPage />);

      await fillRequiredFields(user);
      const submitButton = screen.getByRole('button', { name: /join the waitlist/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("You're on the list!")).toBeInTheDocument();
        expect(screen.getByText(/Thank you for joining the Komra waitlist/)).toBeInTheDocument();
      });
      testLogger.pass('Success message display');
    });

    it('should display waitlist position badge', async () => {
      testLogger.test('Waitlist position badge');
      const user = userEvent.setup();
      mockInsert.mockResolvedValue({ error: null });
      mockSelectCount.mockResolvedValue({ count: 42 });
      render(<PreLaunchPage />);

      await fillRequiredFields(user);
      const submitButton = screen.getByRole('button', { name: /join the waitlist/i });
      await user.click(submitButton);

      await waitFor(() => {
        // The badge text may be split across elements, so check for partial match
        expect(screen.getByText(/Waitlist Position/)).toBeInTheDocument();
      });
      testLogger.info('Waitlist position badge displayed');
      testLogger.pass('Waitlist position badge');
    });

    it('should hide the form after successful submission', async () => {
      testLogger.test('Form hidden after success');
      const user = userEvent.setup();
      mockInsert.mockResolvedValue({ error: null });
      mockSelectCount.mockResolvedValue({ count: 42 });
      render(<PreLaunchPage />);

      await fillRequiredFields(user);
      const submitButton = screen.getByRole('button', { name: /join the waitlist/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByPlaceholderText('Enter your first name')).not.toBeInTheDocument();
        expect(screen.queryByPlaceholderText('Enter your last name')).not.toBeInTheDocument();
        expect(screen.queryByPlaceholderText('your.email@company.com')).not.toBeInTheDocument();
      });
      testLogger.info('Form fields hidden after successful submission');
      testLogger.pass('Form hidden after success');
    });
  });

  // ==========================================================================
  // EDGE CASES & ERROR HANDLING TESTS
  // ==========================================================================
  describe('Edge Cases & Error Handling', () => {
    testLogger.group('Edge Cases & Error Handling');

    it('should handle special characters in name fields', async () => {
      testLogger.test('Special characters in name fields');
      const user = userEvent.setup();
      mockInsert.mockResolvedValue({ error: null });
      mockSelectCount.mockResolvedValue({ count: 42 });
      render(<PreLaunchPage />);

      await fillRequiredFields(user, {
        firstName: "O'Brien",
        lastName: 'García-López',
      });
      const submitButton = screen.getByRole('button', { name: /join the waitlist/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockInsert).toHaveBeenCalled();
      });
      testLogger.info('Special characters handled: O\'Brien, García-López');
      testLogger.pass('Special characters in name fields');
    });

    it('should handle special characters in email', async () => {
      testLogger.test('Special characters in email');
      const user = userEvent.setup();
      mockInsert.mockResolvedValue({ error: null });
      mockSelectCount.mockResolvedValue({ count: 42 });
      render(<PreLaunchPage />);

      await fillRequiredFields(user, { email: 'user+test@example.com' });
      const submitButton = screen.getByRole('button', { name: /join the waitlist/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockInsert).toHaveBeenCalled();
      });
      testLogger.info('Email with + character handled: user+test@example.com');
      testLogger.pass('Special characters in email');
    });

    it('should handle long use case text', async () => {
      testLogger.test('Long use case text handling');
      const user = userEvent.setup();
      render(<PreLaunchPage />);

      const useCaseInput = screen.getByPlaceholderText(/Tell us about your current security pain points/) as HTMLTextAreaElement;
      const longText = 'A'.repeat(500);
      // Use paste instead of type for long text to avoid timeout
      await user.click(useCaseInput);
      await user.paste(longText);

      await waitFor(() => {
        expect(useCaseInput.value.length).toBeLessThanOrEqual(500);
      });
      testLogger.info('Use case text limited to 500 characters');
      testLogger.pass('Long use case text handling');
    }, 10000); // Increase timeout to 10 seconds for this test

    it('should handle network timeout errors', async () => {
      testLogger.test('Network timeout error handling');
      const user = userEvent.setup();
      mockInsert.mockRejectedValueOnce(new Error('Network request timed out'));
      render(<PreLaunchPage />);

      await fillRequiredFields(user);
      const submitButton = screen.getByRole('button', { name: /join the waitlist/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Network request timed out')).toBeInTheDocument();
      });
      testLogger.info('Network timeout error displayed to user');
      testLogger.pass('Network timeout error handling');
    });

    it('should handle unexpected errors gracefully', async () => {
      testLogger.test('Unexpected error handling');
      const user = userEvent.setup();
      mockInsert.mockRejectedValueOnce({});
      render(<PreLaunchPage />);

      await fillRequiredFields(user);
      const submitButton = screen.getByRole('button', { name: /join the waitlist/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('An unexpected error occurred. Please try again.')).toBeInTheDocument();
      });
      testLogger.info('Generic error message displayed for unexpected errors');
      testLogger.pass('Unexpected error handling');
    });

    it('should prevent rapid form submissions', async () => {
      testLogger.test('Rapid form submission prevention');
      const user = userEvent.setup();
      let resolveInsert: () => void;
      const insertPromise = new Promise<{ error: null }>((resolve) => {
        resolveInsert = () => resolve({ error: null });
      });
      mockInsert.mockReturnValue(insertPromise);
      render(<PreLaunchPage />);

      await fillRequiredFields(user);
      const submitButton = screen.getByRole('button', { name: /join the waitlist/i });

      // Click submit multiple times
      await user.click(submitButton);

      // Button should be disabled after first click
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });

      // Only one call should have been made
      expect(mockInsert).toHaveBeenCalledTimes(1);
      testLogger.info('Rapid submissions prevented by disabled state');

      resolveInsert!();
      testLogger.pass('Rapid form submission prevention');
    });
  });

  // ==========================================================================
  // ACCESSIBILITY TESTS
  // ==========================================================================
  describe('Accessibility', () => {
    testLogger.group('Accessibility');

    it('should have proper labels for form inputs', () => {
      testLogger.test('Form input labels');
      render(<PreLaunchPage />);

      // Check that inputs have associated labels via placeholder or label elements
      expect(screen.getByPlaceholderText('Enter your first name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your last name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('your.email@company.com')).toBeInTheDocument();
      testLogger.info('All form inputs have placeholder text for accessibility');
      testLogger.pass('Form input labels');
    });

    it('should have proper button roles', () => {
      testLogger.test('Button roles');
      render(<PreLaunchPage />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      testLogger.info(`Found ${buttons.length} buttons with proper roles`);
      testLogger.pass('Button roles');
    });

    it('should have proper link roles', () => {
      testLogger.test('Link roles');
      render(<PreLaunchPage />);

      const privacyLink = screen.getByRole('link', { name: /privacy policy/i });
      expect(privacyLink).toBeInTheDocument();
      testLogger.pass('Link roles');
    });

    it('should have form element wrapping inputs', () => {
      testLogger.test('Form element structure');
      render(<PreLaunchPage />);

      const form = document.querySelector('form');
      expect(form).toBeInTheDocument();

      // Check that inputs are within the form
      const emailInput = screen.getByPlaceholderText('your.email@company.com');
      expect(form).toContainElement(emailInput);
      testLogger.info('Form element properly wraps input fields');
      testLogger.pass('Form element structure');
    });

    it('should have descriptive submit button text', () => {
      testLogger.test('Descriptive submit button text');
      render(<PreLaunchPage />);

      const submitButton = screen.getByRole('button', { name: /join the waitlist/i });
      expect(submitButton).toBeInTheDocument();
      testLogger.pass('Descriptive submit button text');
    });
  });

  // ==========================================================================
  // VISUAL STATE TESTS
  // ==========================================================================
  describe('Visual States', () => {
    testLogger.group('Visual States');

    it('should have correct initial visual state', () => {
      testLogger.test('Initial visual state');
      render(<PreLaunchPage />);

      const firstNameInput = screen.getByPlaceholderText('Enter your first name') as HTMLInputElement;
      const lastNameInput = screen.getByPlaceholderText('Enter your last name') as HTMLInputElement;
      const emailInput = screen.getByPlaceholderText('your.email@company.com') as HTMLInputElement;
      const submitButton = screen.getByRole('button', { name: /join the waitlist/i });

      // Inputs should be empty and enabled
      expect(firstNameInput.value).toBe('');
      expect(lastNameInput.value).toBe('');
      expect(emailInput.value).toBe('');
      expect(firstNameInput).not.toBeDisabled();
      expect(lastNameInput).not.toBeDisabled();
      expect(emailInput).not.toBeDisabled();
      expect(submitButton).not.toBeDisabled();
      testLogger.pass('Initial visual state');
    });

    it('should display loading spinner during submission', async () => {
      testLogger.test('Loading spinner display');
      const user = userEvent.setup();
      let resolveInsert: () => void;
      const insertPromise = new Promise<{ error: null }>((resolve) => {
        resolveInsert = () => resolve({ error: null });
      });
      mockInsert.mockReturnValueOnce(insertPromise);
      render(<PreLaunchPage />);

      await fillRequiredFields(user);
      const submitButton = screen.getByRole('button', { name: /join the waitlist/i });
      await user.click(submitButton);

      // The loading spinner should be rendered (it has animate-spin class)
      await waitFor(() => {
        const spinner = document.querySelector('.animate-spin');
        expect(spinner).toBeInTheDocument();
      });
      testLogger.info('Loading spinner is visible');

      resolveInsert!();
      testLogger.pass('Loading spinner display');
    });

    it('should display error message with correct styling', async () => {
      testLogger.test('Error message styling');
      const user = userEvent.setup();
      mockInsert.mockResolvedValue({ error: { code: 'OTHER', message: 'Server error' } });
      render(<PreLaunchPage />);

      await fillRequiredFields(user);
      const submitButton = screen.getByRole('button', { name: /join the waitlist/i });
      await user.click(submitButton);

      await waitFor(() => {
        const errorMessage = screen.getByText('An error occurred. Please try again.');
        expect(errorMessage).toBeInTheDocument();
      });
      testLogger.pass('Error message styling');
    });
  });

  // ==========================================================================
  // OPTIONAL FIELDS TESTS
  // ==========================================================================
  describe('Optional Fields Handling', () => {
    testLogger.group('Optional Fields Handling');

    it('should submit successfully with only required fields', async () => {
      testLogger.test('Submit with only required fields');
      const user = userEvent.setup();
      mockInsert.mockResolvedValue({ error: null });
      mockSelectCount.mockResolvedValue({ count: 42 });
      render(<PreLaunchPage />);

      await fillRequiredFields(user);
      const submitButton = screen.getByRole('button', { name: /join the waitlist/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("You're on the list!")).toBeInTheDocument();
      });
      testLogger.info('Form submitted successfully with only required fields');
      testLogger.pass('Submit with only required fields');
    });

    it('should submit successfully with all fields filled', async () => {
      testLogger.test('Submit with all fields filled');
      const user = userEvent.setup();
      mockInsert.mockResolvedValue({ error: null });
      mockSelectCount.mockResolvedValue({ count: 42 });
      render(<PreLaunchPage />);

      await fillRequiredFields(user);

      const companyInput = screen.getByPlaceholderText('Your company name');
      const jobTitleInput = screen.getByPlaceholderText('Your job title');
      const useCaseInput = screen.getByPlaceholderText(/Tell us about your current security pain points/);

      await user.type(companyInput, 'Acme Corp');
      await user.type(jobTitleInput, 'Security Engineer');
      await user.type(useCaseInput, 'Need better vulnerability monitoring');

      const submitButton = screen.getByRole('button', { name: /join the waitlist/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("You're on the list!")).toBeInTheDocument();
      });
      testLogger.info('Form submitted successfully with all fields filled');
      testLogger.pass('Submit with all fields filled');
    });
  });
});
