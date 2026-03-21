import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://odcdhadqufanxqozgwdb.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kY2RoYWRxdWZhbnhxb3pnd2RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNTI4ODksImV4cCI6MjA4OTYyODg4OX0.HtsPpKhpsSKjFt7IftoTGL1wwOsxS7QLg2WwiZ86ApA";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
