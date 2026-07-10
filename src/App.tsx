import { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuth } from './hooks/useAuth';

// Lazy load pages for mobile-first code splitting
const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const Teach = lazy(() => import('./pages/Teach').then(m => ({ default: m.Teach })));
const SearchResults = lazy(() => import('./pages/SearchResults').then(m => ({ default: m.SearchResults })));
const InstructorProfile = lazy(() => import('./pages/InstructorProfile').then(m => ({ default: m.InstructorProfile })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Signup = lazy(() => import('./pages/Signup').then(m => ({ default: m.Signup })));
const SetupPassword = lazy(() => import('./pages/SetupPassword').then(m => ({ default: m.SetupPassword })));
const SetupInstructorPassword = lazy(() => import('./pages/SetupInstructorPassword').then(m => ({ default: m.SetupInstructorPassword })));
const InstructorOnboarding = lazy(() => import('./pages/InstructorOnboarding').then(m => ({ default: m.InstructorOnboarding })));
const InstructorVerification = lazy(() => import('./pages/InstructorVerification').then(m => ({ default: m.InstructorVerification })));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const Checkout = lazy(() => import('./pages/Checkout').then(m => ({ default: m.Checkout })));

function App() {
  const { initialize } = useAuth();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <Router>
      <div className="sd-shell">
        <Navbar />
        <main>
          <Suspense fallback={<div className="sd-container sd-row sd-center" style={{ minHeight: '60vh', color: 'var(--ink-mute)' }}>Loading...</div>}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/teach" element={<Teach />} />
              <Route path="/search" element={<SearchResults />} />
              <Route path="/instructor/:id" element={<InstructorProfile />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
              <Route path="/verify" element={<ProtectedRoute><InstructorVerification /></ProtectedRoute>} />
              <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/setup-password" element={<SetupPassword />} />
              <Route path="/setup-instructor-password" element={<SetupInstructorPassword />} />
              <Route path="/instructor-onboarding" element={<ProtectedRoute><InstructorOnboarding /></ProtectedRoute>} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </Router>
  );
}

export default App;
