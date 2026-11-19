import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  from: vi.fn(),
  createSession: vi.fn(),
  toast: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { signInWithPassword: mocks.signInWithPassword },
    from: mocks.from,
  },
}));
vi.mock('@/lib/sessionManagementService', () => ({
  SessionManagementService: { createSession: mocks.createSession },
}));
vi.mock('@/lib/auditLogger', () => ({
  auditLogger: { log: vi.fn() },
}));
vi.mock('@/components/ui/use-toast', () => ({ toast: mocks.toast }));

import { AuthProvider, useAuth } from '@/contexts/AuthContext';

function LoginProbe() {
  const { user, loading, signIn } = useAuth();
  return (
    <>
      <p>{loading ? 'Loading' : user ? 'Signed in' : 'Signed out'}</p>
      <button onClick={() => void signIn('analyst@example.com', 'password')}>Sign in</button>
    </>
  );
}

describe('Supabase login timestamp', () => {
  const maybeSingle = vi.fn();
  const update = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mocks.signInWithPassword.mockResolvedValue({ data: { user: { id: 'auth-user' } }, error: null });
    mocks.createSession.mockResolvedValue(null);
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ ip: '127.0.0.1' }),
    } as Response);
    update.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({ maybeSingle }),
      }),
    });
    mocks.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'profile-1', email: 'analyst@example.com', role: 'analyst' },
            error: null,
          }),
        }),
      }),
      update,
    });
  });

  it('records the first login before displaying the authenticated dashboard', async () => {
    let finishUpdate!: (value: { data: { id: string }; error: null }) => void;
    maybeSingle.mockReturnValue(new Promise((resolve) => { finishUpdate = resolve; }));
    render(<AuthProvider><LoginProbe /></AuthProvider>);
    await screen.findByText('Signed out');

    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => expect(maybeSingle).toHaveBeenCalled());
    expect(screen.getByText('Signed out')).toBeInTheDocument();
    expect(update).toHaveBeenCalledWith({
      last_login: expect.any(String),
      last_activity: expect.any(String),
    });

    await act(async () => finishUpdate({ data: { id: 'profile-1' }, error: null }));
    expect(await screen.findByText('Signed in')).toBeInTheDocument();
  });

  it('warns when a login timestamp update affects no user', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<AuthProvider><LoginProbe /></AuthProvider>);
    await screen.findByText('Signed out');

    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Signed in')).toBeInTheDocument();
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Login timestamp not recorded',
    }));
    consoleError.mockRestore();
  });
});
