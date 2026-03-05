
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.client_projects(id) ON DELETE SET NULL,
  type TEXT NOT NULL DEFAULT 'visita_tecnica',
  title TEXT NOT NULL,
  description TEXT,
  preferred_date DATE NOT NULL,
  preferred_time TEXT NOT NULL DEFAULT '09:00',
  status TEXT NOT NULL DEFAULT 'pendente',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to appointments"
ON public.appointments
FOR ALL
USING (true)
WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
