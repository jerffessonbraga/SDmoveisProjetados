ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS access_code text;
ALTER TABLE public.client_projects ADD COLUMN IF NOT EXISTS estimated_delivery date;
ALTER TABLE public.project_installments ADD COLUMN IF NOT EXISTS installment_number integer;
ALTER TABLE public.project_production_steps ADD COLUMN IF NOT EXISTS progress integer DEFAULT 0;
ALTER TABLE public.project_production_steps ADD COLUMN IF NOT EXISTS label text;
ALTER TABLE public.project_timeline ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;
