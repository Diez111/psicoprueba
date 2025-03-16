import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ncbaokvtbmrhhuyjudqj.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jYmFva3Z0Ym1yaGh1eWp1ZHFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxNTUxMjksImV4cCI6MjA1NzczMTEyOX0.TLcMyVzr8aTq6Fc9CBPWfVqi4ov3_gQsjQn5-RToay4";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
