import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { SearchResults } from './pages/SearchResults';
import { InstructorProfile } from './pages/InstructorProfile';
import { Dashboard } from './pages/Dashboard';
import { Checkout } from './pages/Checkout';

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/instructor/:id" element={<InstructorProfile />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/checkout" element={<Checkout />} />
          </Routes>
        </main>
        <footer className="bg-white border-t border-gray-200 py-8">
          <div className="max-w-7xl mx-auto px-4 text-center text-gray-500">
            &copy; {new Date().getFullYear()} Skill Drive. All rights reserved.
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;