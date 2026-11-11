import { createHash, randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SESSION_COOKIE = 'komra_demo_session';
const sessionDurations: Record<string, number> = {
  admin: 15 * 60,
  analyst: 30 * 60,
  viewer: 30 * 60,
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function clearSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}

export async function POST(request: NextRequest) {
  let credentials: unknown;
  try {
    credentials = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid sign-in request.' }, { status: 400 });
  }

  if (
    credentials === null
    || typeof credentials !== 'object'
    || !('email' in credentials)
    || typeof credentials.email !== 'string'
    || !('password' in credentials)
    || typeof credentials.password !== 'string'
  ) {
    return NextResponse.json({ error: 'Invalid sign-in request.' }, { status: 400 });
  }
  const { email, password } = credentials;

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, email, full_name, role, mfa_enabled, last_activity')
    .eq('email', email)
    .maybeSingle();

  if (userError) {
    console.error('Unable to load demo sign-in account:', userError);
    return NextResponse.json({ error: 'Unable to sign in right now.' }, { status: 500 });
  }
  if (!user || !sessionDurations[user.role]) {
    return NextResponse.json({ error: 'Invalid login credentials.' }, { status: 401 });
  }

  const { data: isValid, error: verificationError } = await supabase.rpc(
    'verify_user_password',
    { input_user_id: user.id, input_password: password },
  );
  if (verificationError) {
    console.error('Unable to verify demo sign-in credentials:', verificationError);
    return NextResponse.json({ error: 'Unable to sign in right now.' }, { status: 500 });
  }
  if (isValid !== true) {
    return NextResponse.json({ error: 'Invalid login credentials.' }, { status: 401 });
  }

  const loginTime = new Date().toISOString();
  const { error: loginUpdateError } = await supabase
    .from('users')
    .update({ last_login: loginTime, last_activity: loginTime })
    .eq('id', user.id);
  if (loginUpdateError) {
    console.error('Unable to record demo user login:', loginUpdateError);
    return NextResponse.json({ error: 'Unable to sign in right now.' }, { status: 500 });
  }

  const duration = sessionDurations[user.role];
  const token = randomBytes(32).toString('base64url');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + duration * 1000).toISOString();
  const previousToken = request.cookies.get(SESSION_COOKIE)?.value;

  if (previousToken) {
    const { error: revokeError } = await supabase
      .from('application_sessions')
      .update({ revoked_at: new Date().toISOString() })
      .eq('token_hash', hashToken(previousToken))
      .is('revoked_at', null);
    if (revokeError) {
      console.error('Unable to revoke previous demo session:', revokeError);
      return NextResponse.json({ error: 'Unable to sign in right now.' }, { status: 500 });
    }
  }

  const { error: sessionError } = await supabase
    .from('application_sessions')
    .insert({
      token_hash: tokenHash,
      user_id: user.id,
      expires_at: expiresAt,
    });
  if (sessionError) {
    console.error('Unable to create demo application session:', sessionError);
    return NextResponse.json({ error: 'Unable to sign in right now.' }, { status: 500 });
  }

  const response = NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      mfa_enabled: user.mfa_enabled,
      last_activity: user.last_activity,
    },
  });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: duration,
  });
  return response;
}

export async function DELETE(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    const { error } = await supabase
      .from('application_sessions')
      .update({ revoked_at: new Date().toISOString() })
      .eq('token_hash', hashToken(token))
      .is('revoked_at', null);

    if (error) {
      console.error('Unable to revoke demo application session:', error);
      return NextResponse.json({ error: 'Unable to end the application session.' }, { status: 500 });
    }
  }

  return clearSessionCookie(new NextResponse(null, { status: 204 }));
}
