import { useState, useEffect } from 'react';
import {
    ShieldCheck,
    Users,
    Car,
    Calendar,
    TrendingUp,
    Search,
    MoreVertical,
    Mail,
    Phone,
    ArrowRight,
    ShieldAlert,
    Loader2
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { format } from 'date-fns';

type AdminTab = 'overview' | 'users' | 'instructors' | 'bookings';

export const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState<AdminTab>('overview');
    const [stats, setStats] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchAdminData();
    }, []);

    const fetchAdminData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Stats
            const { data: statsData, error: statsError } = await supabase.functions.invoke('admin-actions', {
                body: { action: 'get-stats' }
            });
            if (statsError) throw statsError;
            setStats(statsData);

            // 2. Fetch Users
            const { data: userData, error: userError } = await supabase.functions.invoke('admin-actions', {
                body: { action: 'list-users' }
            });
            if (userError) throw userError;
            setUsers(userData);

        } catch (err: any) {
            console.error('Failed to fetch admin data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (action: string, params: any) => {
        try {
            const { error } = await supabase.functions.invoke('admin-actions', {
                body: { action, params }
            });
            if (error) throw error;
            await fetchAdminData(); // Refresh
        } catch (err: any) {
            alert(err.message);
        }
    };

    const filteredUsers = users.filter(u =>
        u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const pendingInstructors = users.filter(u => u.role === 'instructor' && !u.instructor_profiles?.[0]?.id_verified);

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <ShieldCheck className="h-8 w-8 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-gray-900 tracking-tight">System Administration</h1>
                                <p className="text-sm text-gray-500 font-medium">Platform-wide control & monitoring</p>
                            </div>
                        </div>
                        <button
                            onClick={fetchAdminData}
                            className="p-2 text-gray-400 hover:text-primary transition-colors"
                        >
                            <Loader2 className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-8 mt-8 border-b border-gray-100">
                        {['overview', 'users', 'instructors', 'bookings'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as AdminTab)}
                                className={`pb-4 text-sm font-bold capitalize transition-all relative ${activeTab === tab ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                {tab}
                                {activeTab === tab && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary animate-in fade-in slide-in-from-bottom-1" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {activeTab === 'overview' && (
                    <div className="space-y-8">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { label: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'blue' },
                                { label: 'Instructors', value: stats?.totalInstructors || 0, icon: Car, color: 'purple' },
                                { label: 'Active Bookings', value: stats?.totalBookings || 0, icon: Calendar, color: 'green' },
                                { label: 'Total Revenue', value: `$${stats?.totalRevenue || 0}`, icon: TrendingUp, color: 'orange' },
                            ].map((stat, i) => (
                                <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={`p-3 rounded-xl bg-${stat.color}-50`}>
                                            <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
                                        </div>
                                    </div>
                                    <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
                                    <h3 className="text-3xl font-black text-gray-900 mt-1">{stat.value}</h3>
                                </div>
                            ))}
                        </div>

                        {/* Recent Activity Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <ShieldAlert className="h-5 w-5 text-orange-500" />
                                    Needs Attention
                                </h3>
                                <div className="space-y-4">
                                    {pendingInstructors.length === 0 ? (
                                        <p className="text-sm text-gray-500 text-center py-8">All instructors are verified!</p>
                                    ) : (
                                        pendingInstructors.slice(0, 5).map((u) => (
                                            <div key={u.id} className="flex items-center justify-between p-4 bg-orange-50 border border-orange-100 rounded-xl">
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">{u.full_name}</p>
                                                    <p className="text-xs text-orange-700">Pending License Verification</p>
                                                </div>
                                                <button
                                                    onClick={() => setActiveTab('instructors')}
                                                    className="p-2 bg-orange-200 text-orange-700 rounded-lg hover:bg-orange-300 transition-colors"
                                                >
                                                    <ArrowRight className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="relative flex-grow max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search users by name or email..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                                />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">User</th>
                                        <th className="px-6 py-4">Role</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Joined</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredUsers.map((u) => (
                                        <tr key={u.id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-400">
                                                        {u.avatar_url ? <img src={u.avatar_url} className="h-full w-full rounded-full object-cover" /> : u.full_name?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900">{u.full_name}</p>
                                                        <p className="text-xs text-gray-500">{u.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${u.role === 'admin' ? 'bg-red-100 text-red-700' :
                                                    u.role === 'instructor' ? 'bg-indigo-100 text-indigo-700' :
                                                        'bg-green-100 text-green-700'
                                                    }`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                                    <span className="text-xs font-medium text-gray-600">Active</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-gray-500">
                                                {format(new Date(u.created_at), 'MMM d, yyyy')}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="p-2 text-gray-400 hover:text-gray-900 transition-colors">
                                                    <MoreVertical className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'instructors' && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                            <ShieldCheck className="h-12 w-12 text-primary mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-900">Verification Queue</h3>
                            <p className="text-gray-500 mt-2">Manage and verify instructor credentials</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {users.filter(u => u.role === 'instructor').map((instructor) => (
                                <div key={instructor.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-400">
                                                    {instructor.avatar_url ? <img src={instructor.avatar_url} className="h-full w-full rounded-full object-cover" /> : instructor.full_name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">{instructor.full_name}</p>
                                                    <p className="text-xs text-gray-500">{instructor.email}</p>
                                                </div>
                                            </div>
                                            <div className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${instructor.instructor_profiles?.[0]?.id_verified ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                                }`}>
                                                {instructor.instructor_profiles?.[0]?.id_verified ? 'Verified' : 'Pending'}
                                            </div>
                                        </div>

                                        <div className="space-y-2 mb-6">
                                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                                <Mail className="h-3 w-3" /> {instructor.email}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                                <Phone className="h-3 w-3" /> {instructor.phone || 'No phone'}
                                            </div>
                                        </div>
                                    </div>

                                    {!instructor.instructor_profiles?.[0]?.id_verified && (
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => handleAction('update-user-role', { userId: instructor.id, newRole: 'instructor' })}
                                                className="flex-grow bg-primary text-white font-bold py-2 rounded-xl text-sm hover:bg-primary/90 transition-colors"
                                            >
                                                Approve
                                            </button>
                                            <button className="flex-grow bg-gray-100 text-gray-600 font-bold py-2 rounded-xl text-sm hover:bg-gray-200 transition-colors">
                                                View Documents
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'bookings' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center text-gray-400">
                        <Calendar className="h-16 w-16 mx-auto mb-4 opacity-20" />
                        <p className="font-medium">Global bookings log visibility coming soon.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
