import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

const supabaseClient = createClient(
    'https://bhtzkoixmtqbinrzilfn.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJodHprb2l4bXRxYmlucnppbGZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4MDUyNjYsImV4cCI6MjA4NDM4MTI2Nn0.9yv6JEwI0-XBuGewB7zs7vnBccDOxk9UtZLFOCuH5yM' // Using anon key for now, wait we need service role to bypass RLS, let's just see if anything returns
);

const test = async () => {
    console.log("Fetching profiles...");
    const { data: profiles, error } = await supabaseClient
        .from("profiles")
        .select("*");

    console.log("Profiles:", profiles);
    console.log("Error:", error);
};

test();
