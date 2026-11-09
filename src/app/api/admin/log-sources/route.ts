import { createClient } from '@supabase/supabase-js';
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

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function getUserId(request: NextRequest): Promise<string | null> {
  try {
    // Extract bearer token from authorization header
    const authHeader = request.headers.get('authorization');
    const accessToken = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1];

    if (!accessToken) {
      return null;
    }

    // Get the authenticated user from the token
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(accessToken);
    if (userError || !user?.email) {
      return null;
    }

    // Look up the application profile by email
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', user.email)
      .single();

    return profile?.id || null;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [{ data: preferences, error: prefError }, { data: customSources, error: customError }] =
      await Promise.all([
        supabaseAdmin
          .from('user_log_source_preferences')
          .select('log_source_type, enabled')
          .eq('user_id', userId),
        supabaseAdmin
          .from('user_custom_log_sources')
          .select('id, name, source_type, enabled')
          .eq('user_id', userId),
      ]);

    if (prefError || customError) {
      throw new Error(
        `Database error: ${prefError?.message || customError?.message}`
      );
    }

    // Create a map of stored preferences for quick lookup
    const prefMap = new Map(
      (preferences || []).map((p) => [p.log_source_type as SourceType, p.enabled])
    );

    // Return all valid source types with their enabled status from database, or default to true
    const allPreferences = VALID_SOURCE_TYPES.map((type) => ({
      type,
      enabled: prefMap.has(type) ? prefMap.get(type)! : true,
    }));

    const response: LogSourcesResponse = {
      preferences: allPreferences,
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
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Request body must be an object' },
        { status: 400 }
      );
    }

    const { action, preferences, source } = body as Record<string, unknown>;

    // Validate action
    const validActions = [
      'update-preference',
      'add-source',
      'update-source',
      'remove-source',
    ];
    if (!validActions.includes(String(action))) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    if (action === 'update-preference') {
      if (!Array.isArray(preferences)) {
        return NextResponse.json(
          { error: 'preferences must be an array' },
          { status: 400 }
        );
      }

      // Validate each preference
      for (const pref of preferences) {
        if (!pref || typeof pref !== 'object') {
          return NextResponse.json(
            { error: 'Each preference must be an object' },
            { status: 400 }
          );
        }
        if (!VALID_SOURCE_TYPES.includes((pref as any).type)) {
          return NextResponse.json(
            { error: `Invalid source type: ${(pref as any).type}` },
            { status: 400 }
          );
        }
        if (typeof (pref as any).enabled !== 'boolean') {
          return NextResponse.json(
            { error: 'enabled must be a boolean' },
            { status: 400 }
          );
        }
      }

      const updates = (preferences as Array<{ type: SourceType; enabled: boolean }>).map((pref) => ({
        user_id: userId,
        log_source_type: pref.type,
        enabled: pref.enabled,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabaseAdmin
        .from('user_log_source_preferences')
        .upsert(updates, { onConflict: 'user_id,log_source_type' });

      if (error) throw error;

      return NextResponse.json({ success: true });
    }

    if (action === 'add-source' || action === 'update-source' || action === 'remove-source') {
      if (!source || typeof source !== 'object') {
        return NextResponse.json(
          { error: 'source must be an object' },
          { status: 400 }
        );
      }

      const sourceObj = source as Record<string, unknown>;

      // Common validation for add and update
      if (action === 'add-source' || action === 'update-source') {
        const sourceTypeStr = String(sourceObj.type);
        if (!VALID_SOURCE_TYPES.includes(sourceTypeStr as SourceType)) {
          return NextResponse.json(
            { error: `Invalid source type: ${sourceTypeStr}` },
            { status: 400 }
          );
        }
        if (typeof sourceObj.name !== 'string' || sourceObj.name.trim().length === 0) {
          return NextResponse.json(
            { error: 'source name must be a non-empty string' },
            { status: 400 }
          );
        }
        if (typeof sourceObj.enabled !== 'boolean') {
          return NextResponse.json(
            { error: 'enabled must be a boolean' },
            { status: 400 }
          );
        }
      }

      if (action === 'add-source') {
        const sourceType = String(sourceObj.type) as SourceType;

        const { error } = await supabaseAdmin
          .from('user_custom_log_sources')
          .insert({
            user_id: userId,
            name: String(sourceObj.name),
            source_type: sourceType,
            enabled: Boolean(sourceObj.enabled),
          });

        if (error) throw error;

        return NextResponse.json({ success: true });
      }

      if (action === 'update-source') {
        if (typeof sourceObj.id !== 'string' || sourceObj.id.length === 0) {
          return NextResponse.json(
            { error: 'source id must be a non-empty string' },
            { status: 400 }
          );
        }

        const sourceType = String(sourceObj.type) as SourceType;

        const { error } = await supabaseAdmin
          .from('user_custom_log_sources')
          .update({
            name: String(sourceObj.name),
            source_type: sourceType,
            enabled: Boolean(sourceObj.enabled),
            updated_at: new Date().toISOString(),
          })
          .eq('id', sourceObj.id)
          .eq('user_id', userId);

        if (error) throw error;

        return NextResponse.json({ success: true });
      }

      if (action === 'remove-source') {
        if (typeof sourceObj.id !== 'string' || sourceObj.id.length === 0) {
          return NextResponse.json(
            { error: 'source id must be a non-empty string' },
            { status: 400 }
          );
        }

        const { error } = await supabaseAdmin
          .from('user_custom_log_sources')
          .delete()
          .eq('id', sourceObj.id)
          .eq('user_id', userId);

        if (error) throw error;

        return NextResponse.json({ success: true });
      }
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
