import { createClient } from "@supabase/supabase-js";
export const supabaseUrl = "https://mthclejfvjbgltslemdj.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10aGNsZWpmdmpiZ2x0c2xlbWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTA3ODY4ODksImV4cCI6MjAwNjM2Mjg4OX0.5TBdr5X3iDd1uJ0fwd8VjMsqMFD8P-QFlPsrbGbCHGc";

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

export default supabase;
