import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Teach } from './pages/Teach';
import { SearchResults } from './pages/SearchResults';
import { InstructorProfile } from './pages/InstructorProfile';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { SetupPassword } from './pages/SetupPassword';
import { SetupInstructorPassword } from './pages/SetupInstructorPassword';
import { InstructorOnboarding } from './pages/InstructorOnboarding';
import { InstructorVerification } from './pages/InstructorVerification';
import { AdminDashboard } from './pages/AdminDashboard';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Checkout } from './pages/Checkout';
import { useAuth } from './hooks/useAuth';

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
        </main>
      </div>
    </Router>
  );
}

export default App;
