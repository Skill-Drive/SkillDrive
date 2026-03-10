import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { session, loading, profile } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!session) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check for specific roles if provided
    if (allowedRoles && profile) {
        const userRole = profile.role;
        if (!allowedRoles.includes(userRole)) {
            // If they don't have access, send them to dashboard
            return <Navigate to="/dashboard" replace />;
        }
    }

    return <>{children}</>;
}
