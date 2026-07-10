import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Icon, Logo } from './Icon';

export const Navbar = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      await signOut();
      navigate('/login');
    }
  };

  const isAdmin = profile?.role === 'admin';

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/search', label: 'Find an instructor' },
    { path: '/teach', label: 'Teach' },
    ...(user ? [{ path: '/dashboard', label: 'Dashboard' }] : []),
    ...(isAdmin ? [{ path: '/admin', label: 'Admin' }] : []),
  ];

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'color-mix(in oklab, var(--paper) 88%, transparent)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid var(--line)',
    }}>
      <div className="sd-container sd-nav-container" style={{ minHeight: 72 }}>
        <div className="sd-row sd-acenter sd-between" style={{ width: '100%', flexWrap: 'wrap', gap: 12 }}>
          <Link to="/" className="sd-row sd-acenter sd-gap-2" style={{ textDecoration: 'none', background: 'none', border: 0, padding: 0 }}>
            <Logo size={32} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, lineHeight: 1, letterSpacing: '-0.01em', color: 'var(--ink)' }}>
              Skill<em style={{ color: 'var(--cobalt)', fontStyle: 'italic' }}>Drive</em>
            </span>
          </Link>

          <nav className="sd-row sd-nav-links sd-gap-1" style={{ background: 'var(--paper-2)', padding: 4, borderRadius: 999, border: '1px solid var(--line)', overflowX: 'auto', whiteSpace: 'nowrap' }}>
            {navItems.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  padding: '9px 16px',
                  borderRadius: 999,
                  border: 0,
                  background: active ? 'var(--ink)' : 'transparent',
                  color: active ? 'var(--paper)' : 'var(--ink-2)',
                  fontWeight: 600,
                  fontSize: 13,
                  letterSpacing: '-0.005em',
                  transition: 'background .15s, color .15s',
                  textDecoration: 'none',
                  display: 'inline-block',
                }}
              >
                {item.label}
              </Link>
            );
          })}
          </nav>

          <div className="sd-row sd-acenter sd-gap-2 sd-nav-actions">
            {user ? (
            <button
              onClick={handleSignOut}
              className="sd-row sd-acenter sd-gap-2"
              style={{ background: 'transparent', border: '1px solid var(--line)', padding: '6px 14px', borderRadius: 999, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} style={{ width: 28, height: 28, borderRadius: 999, objectFit: 'cover' }} alt="" />
              ) : (
                <Icon name="user" size={16} />
              )}
              {profile?.full_name?.split(' ')[0] || 'Account'}
            </button>
          ) : (
            <Link to="/login" className="sd-btn sd-btn-ghost sd-btn-sm" style={{ textDecoration: 'none' }}>
              Log in
            </Link>
          )}
            <Link to="/teach" className="sd-btn sd-btn-signal sd-btn-sm" style={{ textDecoration: 'none', whiteSpace: 'nowrap' }}>
              Teach with us <Icon name="arrow" size={14}/>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};
