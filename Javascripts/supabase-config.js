import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// Kunci koneksi resmi ke Supabase
const supabaseUrl = 'https://baqjftjkwbelixvpnask.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhcWpmdGprd2JlbGl4dnBuYXNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNjg5OTMsImV4cCI6MjA5Mjc0NDk5M30.sBXHN6zAqsO8Cl6Hv5lzpkj24duOrgTcDKYhclDi4ec'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
