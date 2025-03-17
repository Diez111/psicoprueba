import { createClient } from "@supabase/supabase-js";
import { Patient } from "../types";

const supabaseUrl = "https://ncbaokvtbmrhhuyjudqj.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jYmFva3Z0Ym1yaGh1eWp1ZHFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxNTUxMjksImV4cCI6MjA1NzczMTEyOX0.TLcMyVzr8aTq6Fc9CBPWfVqi4ov3_gQsjQn5-RToay4";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const subscribeToChanges = (callback: (state: { patients: Patient[] }) => void) => {
  const subscription = supabase
    .channel('patients-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'patients'
      },
      async () => {
        const { data } = await supabase
          .from('patients')
          .select('*')
          .order('updated_at', { ascending: false });
        
        if (data) {
          callback({
            patients: data as Patient[]
          });
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
};
