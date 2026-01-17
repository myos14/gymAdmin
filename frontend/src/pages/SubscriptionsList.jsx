import { useState, useEffect } from 'react';
import { Plus, Search, Calendar, AlertCircle, CheckCircle, XCircle, CreditCard, ChevronLeft, ChevronRight } from 'lucide-react';
import { subscriptionService } from '../services/subscriptionService';
import SubscriptionModal from '../components/SubscriptionModal';

function SubscriptionsList() {
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [notification, setNotification] = useState(null);
    
    // Pagination
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 50;

    // Métricas totales (sin filtrar)
    const [metrics, setMetrics] = useState({
        total: 0,
        active: 0,
        expiringThisWeek: 0,
        expired: 0
    });

    useEffect(() => {
        loadSubscriptions();
    }, [statusFilter, searchTerm, page]);

    useEffect(() => {
        loadMetrics();
    }, []);

    const loadMetrics = async () => {
        try {
            // Obtener métricas generales sin filtros
            const data = await subscriptionService.getAllSubscriptions({ limit: 1000 });
            const allSubs = data.subscriptions || [];
            
            const active = allSubs.filter(s => s.status === 'active').length;
            const expired = allSubs.filter(s => s.status === 'expired').length;
            const expiringThisWeek = allSubs.filter(s => {
                if (s.status !== 'active') return false;
                const days = calculateDaysRemaining(s.end_date);
                return days >= 0 && days <= 7;
            }).length;

            setMetrics({
                total: data.total || 0,
                active,
                expired,
                expiringThisWeek
            });
        } catch (error) {
            console.error('Error loading metrics:', error);
        }
    };

    const loadSubscriptions = async () => {
        try {
            setLoading(true);
            const skip = (page - 1) * limit;
            
            const filters = {
                skip,
                limit
            };
        
            if (statusFilter !== 'all') {
                filters.status = statusFilter;
            }

            if (searchTerm) {
                filters.search = searchTerm;
            }
        
            const data = await subscriptionService.getAllSubscriptions(filters);
            setSubscriptions(data.subscriptions || []);
            setTotal(data.total || 0);
        } catch (error) {
            console.error('Error loading subscriptions:', error);
            showNotification('Error al cargar suscripciones', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSubscription = () => {
        setIsModalOpen(true);
    };

    const handleCancelSubscription = async (subscription) => {
        if (!confirm(`¿Está seguro de cancelar la suscripción de ${subscription.member?.first_name}?`)) {
            return;
        }

        try {
            await subscriptionService.cancelSubscription(subscription.id);
            showNotification('Suscripción cancelada exitosamente', 'success');
            loadSubscriptions();
            loadMetrics();
        } catch (error) {
            console.error('Error canceling subscription:', error);
            showNotification('Error al cancelar suscripción', 'error');
        }
    };

    const handleModalClose = (shouldReload) => {
        setIsModalOpen(false);
        if (shouldReload) {
            loadSubscriptions();
            loadMetrics();
        }
    };

    const showNotification = (message, type) => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleFilterChange = (value) => {
        setStatusFilter(value);
        setPage(1);
    };

    const handleSearchChange = (value) => {
        setSearchTerm(value);
        setPage(1);
    };

    const calculateDaysRemaining = (endDate) => {
        const today = new Date();
        const end = new Date(endDate);
        const diffTime = end - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const getStatusBadge = (status) => {
        const badges = {
            active: { bg: 'bg-success-100', text: 'text-success-800', label: 'Activa', icon: CheckCircle },
            expired: { bg: 'bg-error-100', text: 'text-error-800', label: 'Vencida', icon: XCircle },
            cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Cancelada', icon: XCircle }
        };
        
        const badge = badges[status] || badges.active;
        const Icon = badge.icon;
        
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
                <Icon className="h-3 w-3" />
                {badge.label}
            </span>
        );
    };

    const getDaysRemainingBadge = (daysRemaining, status) => {
        if (status !== 'active') return null;
        
        let colorClass = '';
        if (daysRemaining <= 0) {
            colorClass = 'bg-error-100 text-error-800';
        } else if (daysRemaining <= 7) {
            colorClass = 'bg-warning-100 text-warning-800';
        } else if (daysRemaining <= 15) {
            colorClass = 'bg-yellow-100 text-yellow-800';
        } else {
            colorClass = 'bg-info-100 text-info-800';
        }
        
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
                <Calendar className="h-3 w-3" />
                {daysRemaining > 0 ? `${daysRemaining} días` : 'Vencida'}
            </span>
        );
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-MX', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(price);
    };

    const totalPages = Math.ceil(total / limit);

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
                    <h1 className="text-2xl font-bold text-primary">Suscripciones</h1>
                    <p className="text-secondary mt-1">Renovaciones y estado de membresías</p>
                </div>
                <button
                    onClick={handleCreateSubscription}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium flex items-center gap-2"
                >
                    <Plus className="h-5 w-5" />
                    Nueva Suscripción
                </button>
            </div>

            {/* Metrics - 4 cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total */}
                <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-secondary">Total</p>
                            <p className="text-2xl font-bold text-primary">{metrics.total}</p>
                        </div>
                        <div className="bg-primary-100 rounded-full p-3">
                            <CreditCard className="h-6 w-6 text-primary-600" />
                        </div>
                    </div>
                </div>

                {/* Activas */}
                <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-secondary">Activas</p>
                            <p className="text-2xl font-bold text-success-600">{metrics.active}</p>
                        </div>
                        <div className="bg-success-100 rounded-full p-3">
                            <CheckCircle className="h-6 w-6 text-success-600" />
                        </div>
                    </div>
                </div>

                {/* Vencen esta semana */}
                <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-secondary">Vencen esta semana</p>
                            <p className="text-2xl font-bold text-warning-600">{metrics.expiringThisWeek}</p>
                        </div>
                        <div className="bg-warning-100 rounded-full p-3">
                            <AlertCircle className="h-6 w-6 text-warning-600" />
                        </div>
                    </div>
                </div>

                {/* Vencidas */}
                <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-secondary">Vencidas</p>
                            <p className="text-2xl font-bold text-error-600">{metrics.expired}</p>
                        </div>
                        <div className="bg-error-100 rounded-full p-3">
                            <XCircle className="h-6 w-6 text-error-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                            type="text"
                            placeholder="Buscar por miembro o plan..."
                            value={searchTerm}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>

                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => handleFilterChange(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                        <option value="all">Todos los estados</option>
                        <option value="active">Activas</option>
                        <option value="expired">Vencidas</option>
                        <option value="cancelled">Canceladas</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                        <p className="mt-4 text-secondary">Cargando suscripciones...</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                            Miembro
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                            Plan
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                            Inicio
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                            Fin
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                            Estado
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                            Monto
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {subscriptions.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                                                No se encontraron suscripciones
                                            </td>
                                        </tr>
                                    ) : (
                                        subscriptions.map((subscription, index) => {
                                            const daysRemaining = calculateDaysRemaining(subscription.end_date);
                                            
                                            return (
                                                <tr 
                                                    key={subscription.id} 
                                                    className={`${
                                                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                                    } hover:bg-primary-50 transition-colors`}
                                                >
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {subscription.member?.first_name} {subscription.member?.last_name_paternal}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">{subscription.plan?.name}</div>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                        {formatDate(subscription.start_date)}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">{formatDate(subscription.end_date)}</div>
                                                        {getDaysRemainingBadge(daysRemaining, subscription.status)}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        {getStatusBadge(subscription.status)}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                        {formatPrice(subscription.plan_price || subscription.plan?.price)}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                                        {subscription.status === 'active' && (
                                                            <button
                                                                onClick={() => handleCancelSubscription(subscription)}
                                                                className="text-error-600 hover:text-error-900"
                                                            >
                                                                Cancelar
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                        
                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
                                <div className="flex-1 flex justify-between sm:hidden">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Anterior
                                    </button>
                                    <button
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page >= totalPages}
                                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Siguiente
                                    </button>
                                </div>
                                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm text-gray-700">
                                            Mostrando <span className="font-medium">{(page - 1) * limit + 1}</span> a{' '}
                                            <span className="font-medium">{Math.min(page * limit, total)}</span> de{' '}
                                            <span className="font-medium">{total}</span> resultados
                                        </p>
                                    </div>
                                    <div>
                                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                            <button
                                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                                disabled={page === 1}
                                                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <ChevronLeft className="h-5 w-5" />
                                            </button>
                                            <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                                Página {page} de {totalPages}
                                            </span>
                                            <button
                                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                                disabled={page >= totalPages}
                                                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <ChevronRight className="h-5 w-5" />
                                            </button>
                                        </nav>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <SubscriptionModal
                    onClose={handleModalClose}
                    onSuccess={showNotification}
                />
            )}
        </div>
    );
}

export default SubscriptionsList;