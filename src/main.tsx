import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  createRoot(document.getElementById('root')!).render(
    <div style={{ padding: '2rem', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <h1 style={{ color: '#ef4444' }}>Configuration Error</h1>
      <p style={{ color: '#374151', marginBottom: '1rem' }}>SkillDrive is missing its required database connection configuration.</p>
      <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '1rem', borderRadius: '0.375rem', color: '#991b1b' }}>
        <p>Please click the <strong>Connect to Supabase</strong> button in the top-right corner of your editor to connect a project, then restart the development server.</p>
        <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>Missing variables: {!supabaseUrl && 'VITE_SUPABASE_URL'} {!supabaseAnonKey && 'VITE_SUPABASE_ANON_KEY'}</p>
      </div>
    </div>
  );
} else {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
