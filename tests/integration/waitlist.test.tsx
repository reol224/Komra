import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

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

describe('Waitlist Form Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert.mockResolvedValue({ error: null });
    mockSelectCount.mockResolvedValue({ count: 42 });
  });

  describe('Form Rendering', () => {
    it('should render the waitlist form with all required fields', () => {
      render(<PreLaunchPage />);

      expect(screen.getByText('Join the Komra Waitlist')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your first name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your last name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('your.email@company.com')).toBeInTheDocument();
    });

    it('should render optional fields', () => {
      render(<PreLaunchPage />);

      expect(screen.getByPlaceholderText('Your company name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Your job title')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Tell us about your current security pain points/)).toBeInTheDocument();
    });

    it('should render the submit button', () => {
      render(<PreLaunchPage />);

      const submitButton = screen.getByRole('button', { name: /join the waitlist/i });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).not.toBeDisabled();
    });

    it('should render the header with Komra branding', () => {
      render(<PreLaunchPage />);

      const komraElements = screen.getAllByText('Komra');
      expect(komraElements.length).toBeGreaterThan(0);
      expect(screen.getByText('Coming Soon')).toBeInTheDocument();
    });

    it('should render the hero section content', () => {
      render(<PreLaunchPage />);

      expect(screen.getByText('Security Intelligence')).toBeInTheDocument();
      expect(screen.getByText('Simplified')).toBeInTheDocument();
      expect(screen.getByText(/Pre-Launch • Join the Waitlist/)).toBeInTheDocument();
    });
  });

  describe('Form Input Handling', () => {
    it('should update first name field on input', async () => {
      const user = userEvent.setup();
      render(<PreLaunchPage />);

      const firstNameInput = screen.getByPlaceholderText('Enter your first name');
      await user.type(firstNameInput, 'John');

      expect(firstNameInput).toHaveValue('John');
    });

    it('should update last name field on input', async () => {
      const user = userEvent.setup();
      render(<PreLaunchPage />);

      const lastNameInput = screen.getByPlaceholderText('Enter your last name');
      await user.type(lastNameInput, 'Doe');

      expect(lastNameInput).toHaveValue('Doe');
    });

    it('should update email field on input', async () => {
      const user = userEvent.setup();
      render(<PreLaunchPage />);

      const emailInput = screen.getByPlaceholderText('your.email@company.com');
      await user.type(emailInput, 'john@example.com');

      expect(emailInput).toHaveValue('john@example.com');
    });

    it('should update company field on input', async () => {
      const user = userEvent.setup();
      render(<PreLaunchPage />);

      const companyInput = screen.getByPlaceholderText('Your company name');
      await user.type(companyInput, 'AcmeCorp');

      expect(companyInput).toHaveValue('AcmeCorp');
    });

    it('should update job title field on input', async () => {
      const user = userEvent.setup();
      render(<PreLaunchPage />);

      const jobTitleInput = screen.getByPlaceholderText('Your job title');
      await user.type(jobTitleInput, 'SecurityEngineer');

      expect(jobTitleInput).toHaveValue('SecurityEngineer');
    });

    it('should update use case textarea on input', async () => {
      const user = userEvent.setup();
      render(<PreLaunchPage />);

      const useCaseInput = screen.getByPlaceholderText(/Tell us about your current security pain points/);
      await user.type(useCaseInput, 'Needbettermonitoring');

      expect(useCaseInput).toHaveValue('Needbettermonitoring');
    });

    it('should show character count for use case field', async () => {
      const user = userEvent.setup();
      render(<PreLaunchPage />);

      const useCaseInput = screen.getByPlaceholderText(/Tell us about your current security pain points/);
      await user.type(useCaseInput, 'Testmessage');

      expect(screen.getByText('11/500 characters')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should have required attribute on first name field', () => {
      render(<PreLaunchPage />);

      const firstNameInput = screen.getByPlaceholderText('Enter your first name');
      expect(firstNameInput).toHaveAttribute('required');
    });

    it('should have required attribute on last name field', () => {
      render(<PreLaunchPage />);

      const lastNameInput = screen.getByPlaceholderText('Enter your last name');
      expect(lastNameInput).toHaveAttribute('required');
    });

    it('should have required attribute on email field', () => {
      render(<PreLaunchPage />);

      const emailInput = screen.getByPlaceholderText('your.email@company.com');
      expect(emailInput).toHaveAttribute('required');
      expect(emailInput).toHaveAttribute('type', 'email');
    });
  });

  describe('Form Submission', () => {
    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      mockInsert.mockImplementation(() => new Promise(() => {})); // Never resolves
      render(<PreLaunchPage />);

      const emailInput = screen.getByPlaceholderText('your.email@company.com');
      const firstNameInput = screen.getByPlaceholderText('Enter your first name');
      const lastNameInput = screen.getByPlaceholderText('Enter your last name');
      const submitButton = screen.getByRole('button', { name: /join the waitlist/i });

      await user.type(firstNameInput, 'John');
      await user.type(lastNameInput, 'Doe');
      await user.type(emailInput, 'john@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Joining Waitlist...')).toBeInTheDocument();
      });
    });

    it('should submit form successfully with valid data', async () => {
      const user = userEvent.setup();
      mockInsert.mockResolvedValue({ error: null });
      mockSelectCount.mockResolvedValue({ count: 42 });

      render(<PreLaunchPage />);

      const emailInput = screen.getByPlaceholderText('your.email@company.com');
      const firstNameInput = screen.getByPlaceholderText('Enter your first name');
      const lastNameInput = screen.getByPlaceholderText('Enter your last name');
      const submitButton = screen.getByRole('button', { name: /join the waitlist/i });

      await user.type(firstNameInput, 'John');
      await user.type(lastNameInput, 'Doe');
      await user.type(emailInput, 'john@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("You're on the list!")).toBeInTheDocument();
      });
    });

    it('should show waitlist position after successful submission', async () => {
      const user = userEvent.setup();
      mockInsert.mockResolvedValue({ error: null });
      mockSelectCount.mockResolvedValue({ count: 42 });

      render(<PreLaunchPage />);

      const emailInput = screen.getByPlaceholderText('your.email@company.com');
      const firstNameInput = screen.getByPlaceholderText('Enter your first name');
      const lastNameInput = screen.getByPlaceholderText('Enter your last name');
      const submitButton = screen.getByRole('button', { name: /join the waitlist/i });

      await user.type(firstNameInput, 'John');
      await user.type(lastNameInput, 'Doe');
      await user.type(emailInput, 'john@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Waitlist Position/)).toBeInTheDocument();
      });
    });

    it('should handle duplicate email gracefully', async () => {
      const user = userEvent.setup();
      mockInsert.mockResolvedValue({ error: { code: '23505', message: 'Duplicate' } });
      mockSelectCount.mockResolvedValue({ count: 10 });

      render(<PreLaunchPage />);

      const emailInput = screen.getByPlaceholderText('your.email@company.com');
      const firstNameInput = screen.getByPlaceholderText('Enter your first name');
      const lastNameInput = screen.getByPlaceholderText('Enter your last name');
      const submitButton = screen.getByRole('button', { name: /join the waitlist/i });

      await user.type(firstNameInput, 'John');
      await user.type(lastNameInput, 'Doe');
      await user.type(emailInput, 'existing@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("You're on the list!")).toBeInTheDocument();
      });
    });

    it('should show error message on submission failure', async () => {
      const user = userEvent.setup();
      mockInsert.mockResolvedValue({ error: { code: 'OTHER', message: 'Server error' } });

      render(<PreLaunchPage />);

      const emailInput = screen.getByPlaceholderText('your.email@company.com');
      const firstNameInput = screen.getByPlaceholderText('Enter your first name');
      const lastNameInput = screen.getByPlaceholderText('Enter your last name');
      const submitButton = screen.getByRole('button', { name: /join the waitlist/i });

      await user.type(firstNameInput, 'John');
      await user.type(lastNameInput, 'Doe');
      await user.type(emailInput, 'john@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('An error occurred. Please try again.')).toBeInTheDocument();
      });
    });
  });

  describe('Success State', () => {
    it('should display success message after submission', async () => {
      const user = userEvent.setup();
      mockInsert.mockResolvedValue({ error: null });
      mockSelectCount.mockResolvedValue({ count: 42 });

      render(<PreLaunchPage />);

      const emailInput = screen.getByPlaceholderText('your.email@company.com');
      const firstNameInput = screen.getByPlaceholderText('Enter your first name');
      const lastNameInput = screen.getByPlaceholderText('Enter your last name');
      const submitButton = screen.getByRole('button', { name: /join the waitlist/i });

      await user.type(firstNameInput, 'John');
      await user.type(lastNameInput, 'Doe');
      await user.type(emailInput, 'john@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("You're on the list!")).toBeInTheDocument();
        expect(screen.getByText(/Thank you for joining the Komra waitlist/)).toBeInTheDocument();
      });
    });
  });

  describe('Page Content', () => {
    it('should display problem section', () => {
      render(<PreLaunchPage />);

      expect(screen.getByText('The Problem')).toBeInTheDocument();
      expect(screen.getByText(/Traditional SIEMs cost/)).toBeInTheDocument();
    });

    it('should display solution section', () => {
      render(<PreLaunchPage />);

      expect(screen.getByText('The Komra Solution')).toBeInTheDocument();
      expect(screen.getByText(/Enterprise security at SMB prices/)).toBeInTheDocument();
    });

    it('should display benefits section', () => {
      render(<PreLaunchPage />);

      expect(screen.getByText('Early Access')).toBeInTheDocument();
      expect(screen.getByText('Launch Pricing')).toBeInTheDocument();
      expect(screen.getByText('VIP Support')).toBeInTheDocument();
    });

    it('should display privacy policy link', () => {
      render(<PreLaunchPage />);

      const privacyLink = screen.getByRole('link', { name: /privacy policy/i });
      expect(privacyLink).toBeInTheDocument();
      expect(privacyLink).toHaveAttribute('href', '/privacy');
    });
  });
});
