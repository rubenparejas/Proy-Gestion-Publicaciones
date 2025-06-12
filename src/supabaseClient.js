import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://sfssmtefsczbjggsrjml.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmc3NtdGVmc2N6YmpnZ3Nyam1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNjc4ODgsImV4cCI6MjA2NDc0Mzg4OH0.a7ZFRJg1nPP72QlwwffYKPPjsNSxKrhiPf7oEFwuU3c";

export const supabase = createClient(supabaseUrl, supabaseKey);
