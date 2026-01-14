import { useState, useEffect } from 'react';
import { Users, ClipboardCheck, UserCheck, CreditCard, DollarSign, AlertCircle } from 'lucide-react';
import StatsCard from '../components/dashboard/StatsCard';
import ExpiringSubscriptions from '../components/dashboard/ExpiringSubscriptions';
import RecentPayments from '../components/dashboard/RecentPayments';
import WeeklyChart from '../components/dashboard/WeeklyChart';
import IncomeChart from '../components/dashboard/IncomeChart';
import PlanMetrics from '../components/dashboard/PlanMetrics';
import { dashboardService } from '../services/dashboardService';

function Dashboard() {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadDashboard();
    }, []);

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
        } catch (err) {
            console.error('Error loading dashboard:', err);
            setError('Error al cargar el dashboard');
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 0
        }).format(price);
    };

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <p className="text-error-600 mb-4">{error}</p>
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

    return (
        <div className="p-12 space-y-6 bg-primary-50 min-h-screen">
            {/* 6 Cards compactos */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                <StatsCard
                    title="En el Gym Ahora"
                    value={loading ? '...' : dashboardData?.metrics.current_in_gym || 0}
                    icon={UserCheck}
                    color="bg-primary-700"
                />
                <StatsCard
                    title="Asistencias Hoy"
                    value={loading ? '...' : dashboardData?.metrics.today_visits || 0}
                    subtitle={loading ? '' : `${dashboardData?.metrics.current_in_gym || 0} miembros únicos`}
                    icon={ClipboardCheck}
                    color="bg-primary-600"
                />
                <StatsCard
                    title="Miembros Totales"
                    value={loading ? '...' : dashboardData?.metrics.total_members || 0}
                    icon={Users}
                    color="bg-primary-500"
                />
                <StatsCard
                    title="Suscripciones Activas"
                    value={loading ? '...' : dashboardData?.metrics.active_subscriptions || 0}
                    icon={CreditCard}
                    color="bg-primary-800"
                />
                <StatsCard
                    title="Ingresos Hoy"
                    value={loading ? '...' : formatPrice(dashboardData?.payment_metrics.today_income || 0)}
                    icon={DollarSign}
                    color="bg-success-600"
                />
                <StatsCard
                    title="Pagos Pendientes"
                    value={loading ? '...' : formatPrice(dashboardData?.payment_metrics.pending_payments || 0)}
                    icon={AlertCircle}
                    color="bg-warning-600"
                />
            </div>

            {/* Alertas y Metricas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <PlanMetrics
                    planMetrics={dashboardData?.plan_metrics || []}
                    loading={loading}
                />
                <ExpiringSubscriptions
                    subscriptions={dashboardData?.expiring_subscriptions || []}
                    loading={loading}
                    onRefresh={loadDashboard}
                />
                <RecentPayments
                    payments={dashboardData?.recent_payments || []}
                    loading={loading}
                />
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <WeeklyChart
                    data={dashboardData?.weekly_stats || []}
                    loading={loading}
                />
                <IncomeChart
                    data={dashboardData?.weekly_income || []}
                    loading={loading}
                />
            </div>
        </div>
    );
}

export default Dashboard;