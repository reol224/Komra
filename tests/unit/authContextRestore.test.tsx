import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

function RestoredUser() {
  const { user, loading } = useAuth();
  return <p>{loading ? 'Loading' : user?.email || 'Signed out'}</p>;
}

function renderWithStoredUsers() {
  return render(
    <AuthProvider>
      <RestoredUser />
    </AuthProvider>,
  );
}

describe('AuthProvider cached user restoration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('restores a regular user when the demo-user key is absent', async () => {
    localStorage.setItem('user', JSON.stringify({
      id: 'regular-user',
      email: 'analyst@example.com',
      role: 'analyst',
      session_id: '',
      authMethod: 'supabase',
    }));

    renderWithStoredUsers();

    expect(await screen.findByText('analyst@example.com')).toBeInTheDocument();
  });

  it('prefers the demo user when both cached user keys exist', async () => {
    localStorage.setItem('user', JSON.stringify({
      id: 'regular-user',
      email: 'analyst@example.com',
      role: 'analyst',
      session_id: '',
      authMethod: 'supabase',
    }));
    localStorage.setItem('demo_user', JSON.stringify({
      id: 'demo-user',
      email: 'admin@komra.security',
      role: 'admin',
      session_id: '',
      authMethod: 'demo',
    }));

    renderWithStoredUsers();

    expect(await screen.findByText('admin@komra.security')).toBeInTheDocument();
  });
});
