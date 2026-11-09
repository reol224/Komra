import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

const VALID_SOURCE_TYPES = [
  'application',
  'security',
  'network',
  'system',
  'windows',
  'linux',
  'database',
  'web',
] as const;

type SourceType = (typeof VALID_SOURCE_TYPES)[number];

export interface LogSourcePreference {
  type: SourceType;
  enabled: boolean;
}

export interface CustomLogSource {
  id: string;
  name: string;
  type: SourceType;
  enabled: boolean;
}

export interface LogSourcesResponse {
  preferences: LogSourcePreference[];
  customSources: CustomLogSource[];
}

async function getUserId(): Promise<string | null> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) return null;

    const { data: profile } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single();

    return profile?.id || null;
  } catch {
    return null;
  }
}

export async function GET(): Promise<NextResponse> {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [{ data: preferences, error: prefError }, { data: customSources, error: customError }] =
      await Promise.all([
        supabase
          .from('user_log_source_preferences')
          .select('log_source_type, enabled')
          .eq('user_id', userId),
        supabase
          .from('user_custom_log_sources')
          .select('id, name, source_type, enabled')
          .eq('user_id', userId),
      ]);

    if (prefError || customError) {
      throw new Error(
        `Database error: ${prefError?.message || customError?.message}`
      );
    }

    const response: LogSourcesResponse = {
      preferences: (preferences || []).map((p) => ({
        type: p.log_source_type as SourceType,
        enabled: p.enabled,
      })),
      customSources: (customSources || []).map((c) => ({
        id: c.id,
        name: c.name,
        type: c.source_type as SourceType,
        enabled: c.enabled,
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching log sources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch log source preferences' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, preferences, source } = body as {
      action: 'update-preference' | 'add-source' | 'update-source' | 'remove-source';
      preferences?: Array<{ type: SourceType; enabled: boolean }>;
      source?: { id?: string; name: string; type: SourceType; enabled: boolean };
    };

    if (action === 'update-preference' && preferences) {
      const updates = preferences.map((pref) => ({
        user_id: userId,
        log_source_type: pref.type,
        enabled: pref.enabled,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('user_log_source_preferences')
        .upsert(updates, { onConflict: 'user_id,log_source_type' });

      if (error) throw error;

      return NextResponse.json({ success: true });
    }

    if (action === 'add-source' && source) {
      if (!VALID_SOURCE_TYPES.includes(source.type)) {
        return NextResponse.json(
          { error: 'Invalid source type' },
          { status: 400 }
        );
      }

      const { error } = await supabase
        .from('user_custom_log_sources')
        .insert({
          user_id: userId,
          name: source.name,
          source_type: source.type,
          enabled: source.enabled,
        });

      if (error) throw error;

      return NextResponse.json({ success: true });
    }

    if (action === 'update-source' && source?.id) {
      const { error } = await supabase
        .from('user_custom_log_sources')
        .update({
          name: source.name,
          source_type: source.type,
          enabled: source.enabled,
          updated_at: new Date().toISOString(),
        })
        .eq('id', source.id)
        .eq('user_id', userId);

      if (error) throw error;

      return NextResponse.json({ success: true });
    }

    if (action === 'remove-source' && source?.id) {
      const { error } = await supabase
        .from('user_custom_log_sources')
        .delete()
        .eq('id', source.id)
        .eq('user_id', userId);

      if (error) throw error;

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating log sources:', error);
    return NextResponse.json(
      { error: 'Failed to update log source preferences' },
      { status: 500 }
    );
  }
}
