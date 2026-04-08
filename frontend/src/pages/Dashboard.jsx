import { useState, useEffect } from 'react';
import { Users, ClipboardCheck, UserCheck, CreditCard, DollarSign, AlertCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { dashboardService } from '../services/dashboardService';
import ExpiringSubscriptions from '../components/dashboard/ExpiringSubscriptions';
import UpcomingBirthdays from '../components/dashboard/UpcomingBirthdays';
import RecentPayments from '../components/dashboard/RecentPayments';
import WeeklyChart from '../components/dashboard/WeeklyChart';
import IncomeChart from '../components/dashboard/IncomeChart';
import GenderChart from '../components/dashboard/GenderChart';
import api from '../services/api';

/* ========================= SmartStatCard ========================= */
function SmartStatCard({ title, value, change, icon, color, loading }) {
    const positive = change >= 0;
    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border hover:shadow-md transition">
            <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-500">{title}</span>
                <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
            </div>
            {loading ? (
                <div className="animate-pulse h-8 w-20 bg-gray-200 rounded mt-1" />
            ) : (
                <div className="text-2xl font-bold text-gray-800">{value}</div>
            )}
            {!loading && change !== undefined && (
                <div className={`text-sm mt-1 ${positive ? 'text-green-600' : 'text-red-500'}`}>
                    {positive ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
                    <span className="text-gray-400 ml-1">vs ayer</span>
                </div>
            )}
        </div>
    );
}

/* ========================= DayPerformance ========================= */
function DayPerformance({ loading }) {
    const [stats, setStats] = useState(null);

    useEffect(() => {
        api.get('/attendance/stats/daily')
            .then(r => setStats(r.data))
            .catch(() => {});
    }, []);

    const rows = [
        {
            label: 'Visitas únicas hoy',
            value: stats?.unique_members
        },
        {
            label: 'Duración promedio',
            value: stats?.average_duration_minutes
                ? `${Math.floor(stats.average_duration_minutes / 60)}h ${stats.average_duration_minutes % 60}min`
                : '—'
        },
        {
            label: 'Visitas totales hoy',
            value: stats?.total_visits
        },
    ];

    return (
        <div className="bg-white p-6 rounded-xl shadow h-full">
            <h3 className="font-semibold mb-4 text-gray-700">Rendimiento del Día</h3>
            {loading || !stats ? (
                <div className="animate-pulse space-y-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-10 bg-gray-200 rounded" />)}
                </div>
            ) : (
                <div className="space-y-3">
                    {rows.map(({ label, value }) => (
                        <div key={label} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-500">{label}</span>
                            <span className="font-bold text-gray-800">{value ?? '—'}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ========================= Dashboard ========================= */
function Dashboard() {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading]             = useState(true);
    const [error, setError]                 = useState(null);
    const location = useLocation();

    useEffect(() => {
        api.post('/attendance/auto-checkout').catch(() => {});
        loadDashboard();
    }, [location]);

    const loadDashboard = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await dashboardService.getDashboardSummary({
                expiring_days: 7,
                recent_limit: 5,
                stats_days: 7
            });
            setDashboardData(data);
        } catch {
            setError('Error al cargar el dashboard');
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price) =>
        new Intl.NumberFormat('es-MX', {
            style: 'currency', currency: 'MXN', minimumFractionDigits: 0
        }).format(price);

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <p className="text-red-500 mb-4">{error}</p>
                    <button
                        onClick={loadDashboard}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    const m  = dashboardData?.metrics         || {};
    const pm = dashboardData?.payment_metrics  || {};

    return (
        <div className="p-8 space-y-6 bg-primary-50 min-h-screen">

            {/* ── Fila 1: KPIs ── */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                <SmartStatCard
                    title="En el Gym"
                    value={m.current_in_gym ?? 0}
                    loading={loading}
                    icon={<UserCheck className="h-5 w-5 text-white" />}
                    color="bg-primary-700"
                />
                <SmartStatCard
                    title="Asistencias Hoy"
                    value={m.today_visits ?? 0}
                    change={m.today_visits_change}
                    loading={loading}
                    icon={<ClipboardCheck className="h-5 w-5 text-white" />}
                    color="bg-primary-600"
                />
                <SmartStatCard
                    title="Miembros"
                    value={m.total_members ?? 0}
                    loading={loading}
                    icon={<Users className="h-5 w-5 text-white" />}
                    color="bg-primary-500"
                />
                <SmartStatCard
                    title="Subs Activas"
                    value={m.active_subscriptions ?? 0}
                    loading={loading}
                    icon={<CreditCard className="h-5 w-5 text-white" />}
                    color="bg-primary-800"
                />
                <SmartStatCard
                    title="Ingresos Hoy"
                    value={formatPrice(pm.today_income ?? 0)}
                    change={pm.today_income_change}
                    loading={loading}
                    icon={<DollarSign className="h-5 w-5 text-white" />}
                    color="bg-green-600"
                />
                <SmartStatCard
                    title="Pendiente"
                    value={formatPrice(pm.pending_payments ?? 0)}
                    loading={loading}
                    icon={<AlertCircle className="h-5 w-5 text-white" />}
                    color="bg-yellow-500"
                />
            </div>

            {/* ── Fila 2: Gráficas + Rendimiento del Día ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <WeeklyChart data={dashboardData?.weekly_stats || []} loading={loading} />
                    <IncomeChart data={dashboardData?.weekly_income || []} loading={loading} />
                </div>
                <GenderChart data={dashboardData?.gender_stats} loading={loading} />
            </div>

            {/* ── Fila 3: Alertas ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <ExpiringSubscriptions
                    subscriptions={dashboardData?.expiring_subscriptions || []}
                    loading={loading}
                    onRefresh={loadDashboard}
                />
                <RecentPayments
                    payments={dashboardData?.recent_payments || []}
                    loading={loading}
                />
                <UpcomingBirthdays
                    birthdays={dashboardData?.upcoming_birthdays || []}
                    loading={loading}
                />
            </div>

        </div>
    );
}

export default Dashboard;