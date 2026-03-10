const url = 'https://bhtzkoixmtqbinrzilfn.supabase.co/functions/v1/search-instructors';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJodHprb2l4bXRxYmlucnppbGZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4MDUyNjYsImV4cCI6MjA4NDM4MTI2Nn0.9yv6JEwI0-XBuGewB7zs7vnBccDOxk9UtZLFOCuH5yM';

const test = async () => {
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`,
                'apikey': key
            },
            body: JSON.stringify({ filters: {} })
        });

        console.log("Status:", res.status);
        const data = await res.text();
        console.log("Response:", data);
    } catch (e) {
        console.error("Error:", e);
    }
};

test();
