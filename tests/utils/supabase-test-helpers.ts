import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// Create a test Supabase client
export const createTestSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  return createClient<Database>(supabaseUrl, supabaseKey);
};

// Clean up test data
export const cleanupTestData = async (supabase: ReturnType<typeof createTestSupabaseClient>) => {
  // Delete test endpoints
  await supabase.from('endpoints').delete().like('hostname', 'test-%');
  
  // Delete test vulnerabilities
  await supabase.from('vulnerabilities').delete().like('cve_id', 'TEST-%');
  
  // Delete test users (be careful with this in production!)
  await supabase.from('users').delete().like('email', 'test-%@example.com');
};

// Create test endpoint
export const createTestEndpoint = async (supabase: ReturnType<typeof createTestSupabaseClient>, data?: Partial<any>) => {
  const endpoint = {
    hostname: `test-${Date.now()}`,
    os_type: 'Linux',
    os_version: 'Ubuntu 22.04',
    environment: 'development',
    last_seen: new Date().toISOString(),
    ...data,
  };
  
  const { data: created, error } = await supabase
    .from('endpoints')
    .insert(endpoint)
    .select()
    .single();
  
  if (error) throw error;
  return created;
};

// Create test vulnerability
export const createTestVulnerability = async (supabase: ReturnType<typeof createTestSupabaseClient>, endpointId: string, data?: Partial<any>) => {
  const vulnerability = {
    endpoint_id: endpointId,
    cve_id: `TEST-CVE-${Date.now()}`,
    severity: 'high',
    cvss_score: 7.5,
    package_name: 'test-package',
    package_version: '1.0.0',
    description: 'Test vulnerability',
    status: 'open',
    ...data,
  };
  
  const { data: created, error } = await supabase
    .from('vulnerabilities')
    .insert(vulnerability)
    .select()
    .single();
  
  if (error) throw error;
  return created;
};
