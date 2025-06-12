//import { createClient } from "@supabase/supabase-js";

//const supabaseUrl = "https://sfssmtefsczbjggsrjml.supabase.co";
//const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmc3NtdGVmc2N6YmpnZ3Nyam1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNjc4ODgsImV4cCI6MjA2NDc0Mzg4OH0.a7ZFRJg1nPP72QlwwffYKPPjsNSxKrhiPf7oEFwuU3c";

//export const supabase = createClient(supabaseUrl, supabaseKey);

// src/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";
import { Database } from "./types/supabase"; // si tienes tipos generados, si no, puedes omitir esto

// ✅ Usa variables de entorno (más seguro para producción)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

// ✅ Crea el cliente de Supabase
export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

// Si no tienes tipos generados con Supabase CLI, simplemente haz:
/// export const supabase = createClient(supabaseUrl, supabaseKey);
