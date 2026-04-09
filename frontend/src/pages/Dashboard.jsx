import { useState, useEffect } from 'react';
import { Users, ClipboardCheck, UserCheck, CreditCard, DollarSign, AlertCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { dashboardService } from '../services/dashboardService';
import ExpiringSubscriptions from '../components/dashboard/ExpiringSubscriptions';
import TodayAttendanceModal from '../components/dashboard/TodayAttendanceModal';
import PendingPaymentsModal from '../components/dashboard/PendingPaymentsModal';
import UpcomingBirthdays from '../components/dashboard/UpcomingBirthdays';
import RecentPayments from '../components/dashboard/RecentPayments';
import WeeklyChart from '../components/dashboard/WeeklyChart';
import IncomeChart from '../components/dashboard/IncomeChart';
import GenderChart from '../components/dashboard/GenderChart';
import InGymModal from '../components/dashboard/InGymModal';
import RetentionCard from '../components/dashboard/RetentionCard';
import api from '../services/api';

/* ========================= SmartStatCard ========================= */
function SmartStatCard({ title, value, change, icon, color, loading, clickable }) {
    const positive = change >= 0;
    return (
        <div className={`bg-white p-5 rounded-xl shadow-sm border transition group h-full ${
            clickable ? 'hover:shadow-md hover:border-primary-200' : 'hover:shadow-md'
        }`}>
            <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-500 truncate">{title}</span>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                    {clickable && (
                        <span className="text-[10px] text-gray-300 group-hover:text-primary-400 transition font-medium">
                            Ver →
                        </span>
                    )}
                    <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
                </div>
            </div>

            {loading ? (
                <div className="animate-pulse h-8 w-20 bg-gray-200 rounded mt-1" />
            ) : (
                <div className="flex items-end justify-between mt-1">
                    <div className="text-2xl font-bold text-gray-800">{value}</div>
                    {change !== undefined && (
                        <span className={`text-xs font-medium mb-0.5 ${positive ? 'text-green-600' : 'text-red-500'}`}>
                            {positive ? '↑' : '↓'}{Math.abs(change).toFixed(1)}% vs ayer
                        </span>
                    )}
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
    const [showInGymModal, setShowInGymModal]     = useState(false);
    const [showTodayModal, setShowTodayModal]     = useState(false);
    const [showPendingModal, setShowPendingModal] = useState(false);

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

    const m  = dashboardData?.metrics        || {};
    const pm = dashboardData?.payment_metrics || {};

    return (
        <div className="p-6 md:p-8 space-y-6 bg-primary-50 min-h-screen">

            {/* ── Fila 1: KPIs ── */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                <div onClick={() => setShowInGymModal(true)} className="cursor-pointer h-full">
                    <SmartStatCard
                        title="En el Gym"
                        value={m.current_in_gym ?? 0}
                        loading={loading}
                        icon={<UserCheck className="h-5 w-5 text-white" />}
                        color="bg-primary-700"
                        clickable
                    />
                </div>
                <div onClick={() => setShowTodayModal(true)} className="cursor-pointer h-full">
                    <SmartStatCard
                        title="Asistencias Hoy"
                        value={m.today_visits ?? 0}
                        change={m.today_visits_change}
                        loading={loading}
                        icon={<ClipboardCheck className="h-5 w-5 text-white" />}
                        color="bg-primary-600"
                        clickable
                    />
                </div>
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
                <div onClick={() => setShowPendingModal(true)} className="cursor-pointer h-full">
                    <SmartStatCard
                        title="Pendiente"
                        value={formatPrice(pm.pending_payments ?? 0)}
                        loading={loading}
                        icon={<AlertCircle className="h-5 w-5 text-white" />}
                        color="bg-yellow-500"
                        clickable
                    />
                </div>
            </div>

            {/* ── Fila 2: Gráficas + Retención ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <div className="xl:col-span-2">
                    <WeeklyChart data={dashboardData?.weekly_stats || []} loading={loading} />
                </div>
                <div className="xl:col-span-1">
                    <IncomeChart data={dashboardData?.weekly_income || []} loading={loading} />
                </div>
                <div className="xl:col-span-1">
                    <RetentionCard loading={loading} />
                </div>
            </div>

            {/* ── Fila 3: Operacional ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <ExpiringSubscriptions
                        subscriptions={dashboardData?.expiring_subscriptions || []}
                        loading={loading}
                        onRefresh={loadDashboard}
                    />
                </div>
                <div className="lg:col-span-1">
                    <RecentPayments
                        payments={dashboardData?.recent_payments || []}
                        loading={loading}
                    />
                </div>
            </div>

            {/* ── Fila 4: Cumpleaños + Género ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <UpcomingBirthdays
                        birthdays={dashboardData?.upcoming_birthdays || []}
                        loading={loading}
                    />
                </div>
                <div className="lg:col-span-1">
                    <GenderChart data={dashboardData?.gender_stats} loading={loading} />
                </div>
            </div>

            {/* ── Modales ── */}
            {showInGymModal && (
                <InGymModal onClose={() => setShowInGymModal(false)} />
            )}
            {showTodayModal && (
                <TodayAttendanceModal onClose={() => setShowTodayModal(false)} />
            )}
            {showPendingModal && (
                <PendingPaymentsModal
                    onClose={() => {
                        setShowPendingModal(false);
                        loadDashboard();
                    }}
                />
            )}
        </div>
    );
}

export default Dashboard;