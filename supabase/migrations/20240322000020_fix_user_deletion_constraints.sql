ALTER TABLE public.remediation_plans
DROP CONSTRAINT IF EXISTS remediation_plans_assigned_to_fkey;

ALTER TABLE public.remediation_plans
DROP CONSTRAINT IF EXISTS remediation_plans_created_by_fkey;

ALTER TABLE public.remediation_plans
ADD CONSTRAINT remediation_plans_assigned_to_fkey 
  FOREIGN KEY (assigned_to) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.remediation_plans
ADD CONSTRAINT remediation_plans_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.triage_actions
DROP CONSTRAINT IF EXISTS triage_actions_assigned_to_fkey;

ALTER TABLE public.triage_actions
DROP CONSTRAINT IF EXISTS triage_actions_triaged_by_fkey;

ALTER TABLE public.triage_actions
ADD CONSTRAINT triage_actions_assigned_to_fkey 
  FOREIGN KEY (assigned_to) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.triage_actions
ADD CONSTRAINT triage_actions_triaged_by_fkey 
  FOREIGN KEY (triaged_by) REFERENCES public.users(id) ON DELETE SET NULL;