import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://vvtwnawbwboowuvlksvj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2dHduYXdid2Jvb3d1dmxrc3ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk2NDEwMzQsImV4cCI6MjA0NTIxNzAzNH0.5EBhk6GSRqaiA4RTY_npIKgPAErLBLpvFK4SD2R1pTY',
);
