import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://dnyoewdnwjkprcaebtyh.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRueW9ld2Rud2prcHJjYWVidHloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0NjcwNDgsImV4cCI6MjA2MTA0MzA0OH0.UZodk_01mEynTmF-641WdIM0sv00Ue8aVS8KPgW32Z8";

export const supabase = createClient(supabaseUrl, supabaseKey);