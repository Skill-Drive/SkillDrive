import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bhtzkoixmtqbinrzilfn.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJodHprb2l4bXRxYmlucnppbGZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4MDUyNjYsImV4cCI6MjA4NDM4MTI2Nn0.9yv6JEwI0-XBuGewB7zs7vnBccDOxk9UtZLFOCuH5yM'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
