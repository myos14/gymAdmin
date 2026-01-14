import { useState, useEffect } from 'react';
import { Plus, Edit, TrendingUp, XCircle, CheckCircle } from 'lucide-react';
import { planService } from '../services/planService';
import PlanModal from '../components/PlanModal';
import { dashboardService } from '../services/dashboardService';

function PlansList() {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showInactive, setShowInactive] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [notification, setNotification] = useState(null);
    const [topPlan, setTopPlan] = useState(null);

    useEffect(() => {
        loadPlans();
        loadTopPlan();
    }, [showInactive]);

    const loadPlans = async () => {
        try {
            setLoading(true);
            const statusFilter = showInactive ? 'inactive' : 'active';
            const data = await planService.getAllPlans(statusFilter);
            
            const sortedPlans = data.sort((a, b) => a.duration_days - b.duration_days);
            setPlans(sortedPlans);
        } catch (error) {
            console.error('Error loading plans:', error);
            showNotification('Error al cargar planes', 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadTopPlan = async () => {
        try {
            const data = await dashboardService.getDashboardSummary({ expiring_days: 7 });
            if (data.plan_metrics && data.plan_metrics.length > 0) {
                setTopPlan(data.plan_metrics[0]);
            }
        } catch (error) {
            console.error('Error loading top plan:', error);
        }
    };

    const handleAddPlan = () => {
        setSelectedPlan(null);
        setIsModalOpen(true);
    };

    const handleEditPlan = (plan) => {
        setSelectedPlan(plan);
        setIsModalOpen(true);
    };

    const handleToggleStatus = async (plan) => {
        const action = plan.is_active ? 'desactivar' : 'activar';
        if (!confirm(`¿Está seguro de ${action} el plan "${plan.name}"?`)) {
            return;
        }

        try {
            await planService.toggleStatus(plan.id, plan.is_active);
            showNotification(
                `Plan ${plan.is_active ? 'desactivado' : 'activado'} exitosamente`,
                'success'
            );
            loadPlans();
        } catch (error) {
            console.error('Error toggling status:', error);
            showNotification('Error al cambiar estado del plan', 'error');
        }
    };

    const handleModalClose = (shouldReload) => {
        setIsModalOpen(false);
        setSelectedPlan(null);
        if (shouldReload) {
            loadPlans();
        }
    };

    const showNotification = (message, type) => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const formatPrice = (price, planName = '') => {
        if (planName.toLowerCase() === 'staff' || price === 0) {
            return 'Gratis';
        }
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(price);
    };

    const formatDuration = (days) => {
        if (days === 1) return '1 día';
        if (days === 7) return '1 semana';
        if (days === 30) return '1 mes';
        if (days === 60) return '2 meses';
        if (days === 180) return '6 meses';
        if (days === 365) return '1 año';
        return `${days} días`;
    };

    // Calcular métricas
    const activeCount = plans.filter(p => p.is_active).length;

    if (loading) {
        return (
            <div className="p-6 space-y-6 bg-primary-50 min-h-screen">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                    <p className="ml-4 text-secondary">Cargando planes...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 bg-primary-50 min-h-screen">
            {/* Notification */}
            {notification && (
                <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
                    notification.type === 'success' ? 'bg-success-500' : 'bg-error-500'
                } text-white`}>
                    {notification.message}
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-primary">Planes</h1>
                    <p className="text-secondary mt-1">Configuración de precios y duración</p>
                </div>
                <button
                    onClick={handleAddPlan}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    <Plus className="h-5 w-5" />
                    Agregar Plan
                </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Total Planes */}
                <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-secondary">Total Planes</p>
                            <p className="text-2xl font-bold text-primary">{plans.length}</p>
                        </div>
                        <div className="bg-primary-100 rounded-full p-3">
                            <TrendingUp className="h-6 w-6 text-primary-600" />
                        </div>
                    </div>
                </div>

                {/* Planes Activos */}
                <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-secondary">Planes Activos</p>
                            <p className="text-2xl font-bold text-success-600">{activeCount}</p>
                        </div>
                        <div className="bg-success-100 rounded-full p-3">
                            <TrendingUp className="h-6 w-6 text-success-600" />
                        </div>
                    </div>
                </div>

                {/* Plan Más Vendido */}
                <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-secondary">Plan Más Vendido</p>
                            <p className="text-lg font-bold text-primary truncate">
                                {topPlan ? topPlan.plan_name : 'N/A'}
                            </p>
                            {topPlan && (
                                <p className="text-xs text-secondary mt-1">
                                    {topPlan.active_subscriptions} miembros
                                </p>
                            )}
                        </div>
                        <div className="bg-warning-100 rounded-full p-3">
                            <TrendingUp className="h-6 w-6 text-warning-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center">
                <label className="flex items-center gap-2 text-sm text-secondary cursor-pointer">
                    <input
                        type="checkbox"
                        checked={showInactive}
                        onChange={(e) => setShowInactive(e.target.checked)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    Mostrar planes inactivos
                </label>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {plans.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-lg">
                        No se encontraron planes
                    </div>
                ) : (
                    plans.map((plan) => (
                        <div
                            key={plan.id}
                            className={`bg-white rounded-lg shadow-sm border p-4 transition-all ${
                                plan.is_active
                                    ? 'border-gray-200 hover:border-primary-300 hover:shadow-md'
                                    : 'border-gray-100 bg-gray-50 opacity-60'
                            }`}
                        >
                            {/* Plan Header */}
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-primary">{plan.name}</h3>
                                    {/* Duración - No mostrar nada si es Staff */}
                                    <p className="text-xs text-secondary mt-1">
                                        {plan.name.toLowerCase() === 'staff'
                                            ? 'Acceso permanente'
                                            : formatDuration(plan.duration_days)
                                        }
                                    </p>
                                </div>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                    plan.is_active
                                        ? 'bg-success-100 text-success-800'
                                        : 'bg-error-100 text-error-800'
                                }`}>
                                    {plan.is_active ? 'Activo' : 'Inactivo'}
                                </span>
                            </div>

                            {/* Price */}
                            <div className="mb-4">
                                <div className="text-2xl font-bold text-primary">
                                    {formatPrice(plan.price, plan.name)}
                                </div>                                
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleEditPlan(plan)}
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-blue-600 text-blue-600 text-xs rounded-lg hover:bg-blue-50 transition-colors"
                                >
                                    <Edit className="h-4 w-4" />
                                    Editar
                                </button>
                                <button
                                    onClick={() => handleToggleStatus(plan)}
                                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 border text-xs rounded-lg transition-colors ${
                                        plan.is_active
                                            ? 'border-gray-400 text-gray-600 hover:border-red-600 hover:text-red-600 hover:bg-red-50'
                                            : 'border-gray-400 text-gray-600 hover:border-green-600 hover:text-green-600 hover:bg-green-50'
                                    }`}
                                >
                                    {plan.is_active ? (
                                        <>
                                            <XCircle className="h-4 w-4" />
                                            Desactivar
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="h-4 w-4" />
                                            Activar
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <PlanModal
                    plan={selectedPlan}
                    onClose={handleModalClose}
                    onSuccess={showNotification}
                />
            )}
        </div>
    );
}

export default PlansList;