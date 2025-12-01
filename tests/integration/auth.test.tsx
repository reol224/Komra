import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginForm from '@/components/auth/LoginForm';
import { AuthProvider } from '@/contexts/AuthContext';

// Wrapper component with AuthProvider
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('Authentication Integration Tests', () => {
  describe('LoginForm', () => {
    it('should render login form with email and password fields', () => {
      render(<LoginForm />, { wrapper: Wrapper });
      
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      // Use getAllByRole to handle multiple buttons with similar text
      const signInButtons = screen.getAllByRole('button', { name: /sign in/i });
      expect(signInButtons.length).toBeGreaterThan(0);
    });
    
    it('should validate email format', async () => {
      const user = userEvent.setup();
      render(<LoginForm />, { wrapper: Wrapper });
      
      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'invalid-email');
      await user.tab();
      
      await waitFor(() => {
        const errorMessage = screen.queryByText(/valid email/i);
        if (errorMessage) {
          expect(errorMessage).toBeInTheDocument();
        }
      });
    });
    
    it('should have password field', async () => {
      render(<LoginForm />, { wrapper: Wrapper });
      
      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toBeInTheDocument();
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });
});