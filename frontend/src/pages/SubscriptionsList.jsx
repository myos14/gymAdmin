import { useState, useEffect } from 'react';
import { Plus, Search, Calendar, AlertCircle, CheckCircle,
         XCircle, CreditCard, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { subscriptionService } from '../services/subscriptionService';
import SubscriptionModal from '../components/SubscriptionModal';
import RenewSubscriptionModal from '../components/dashboard/RenewSubscriptionModal';
import SubscriptionDetailModal from '../components/SubscriptionDetailModal';

function SubscriptionsList() {
    const [subscriptions, setSubscriptions]     = useState([]);
    const [loading, setLoading]                 = useState(true);
    const [statusFilter, setStatusFilter]       = useState('all');
    const [searchTerm, setSearchTerm]           = useState('');
    const [isModalOpen, setIsModalOpen]         = useState(false);
    const [notification, setNotification]       = useState(null);
    const [renewingSubscription, setRenewingSubscription] = useState(null);
    const [selectedSubscription, setSelectedSubscription] = useState(null);
    const [page, setPage]   = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 50;
    const [metrics, setMetrics] = useState({ total: 0, active: 0, expiringThisWeek: 0, expired: 0 });

    useEffect(() => { loadSubscriptions(); }, [statusFilter, searchTerm, page]);
    useEffect(() => { loadMetrics(); }, []);

    const loadMetrics = async () => {
        try {
            const [allData, activeData, expiredData] = await Promise.all([
                subscriptionService.getAllSubscriptions({ limit: 1 }),
                subscriptionService.getAllSubscriptions({ limit: 1, status: 'active' }),
                subscriptionService.getAllSubscriptions({ limit: 1, status: 'expired' })
            ]);
            let expiringThisWeek = 0;
            const activeTotal = activeData.total || 0;
            if (activeTotal > 0) {
                const activeSubs = await subscriptionService.getAllSubscriptions({ limit: Math.min(activeTotal, 100), status: 'active' });
                expiringThisWeek = (activeSubs.subscriptions || []).filter(s => {
                    const d = calculateDaysRemaining(s.end_date);
                    return d >= 0 && d <= 7;
                }).length;
            }
            setMetrics({ total: allData.total || 0, active: activeData.total || 0, expired: expiredData.total || 0, expiringThisWeek });
        } catch (e) { console.error(e); }
    };

    const loadSubscriptions = async () => {
        try {
            setLoading(true);
            const filters = { skip: (page-1)*limit, limit };
            if (statusFilter !== 'all') filters.status = statusFilter;
            if (searchTerm) filters.search = searchTerm;
            const data = await subscriptionService.getAllSubscriptions(filters);
            setSubscriptions(data.subscriptions || []);
            setTotal(data.total || 0);
        } catch (e) { console.error(e); showNotification('Error al cargar suscripciones', 'error'); }
        finally { setLoading(false); }
    };

    const handleCancelSubscription = async (subscription) => {
        if (!confirm(`¿Está seguro de cancelar la suscripción de ${subscription.member?.first_name}?`)) return;
        try {
            await subscriptionService.cancelSubscription(subscription.id);
            showNotification('Suscripción cancelada exitosamente');
            loadSubscriptions(); loadMetrics();
        } catch { showNotification('Error al cancelar suscripción', 'error'); }
    };

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const calculateDaysRemaining = (endDate) => {
        const today = new Date();
        const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const end = new Date(endDate + 'T00:00:00');
        return Math.ceil((end - todayMidnight) / (1000 * 60 * 60 * 24));
    };

    const getStatusBadge = (status) => {
        const cfg = {
            active:    { bg: 'bg-green-100', text: 'text-green-800',  label: 'Activa',     Icon: CheckCircle },
            expired:   { bg: 'bg-red-100',   text: 'text-red-800',    label: 'Vencida',    Icon: XCircle     },
            cancelled: { bg: 'bg-gray-100',  text: 'text-gray-800',   label: 'Cancelada',  Icon: XCircle     },
        };
        const { bg, text, label, Icon } = cfg[status] || cfg.cancelled;
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${bg} ${text}`}>
                <Icon className="h-3 w-3" />{label}
            </span>
        );
    };

    const getDaysRemainingBadge = (daysRemaining, status) => {
        if (status !== 'active') return null;
        const cls = daysRemaining <= 0   ? 'bg-red-100 text-red-800' :
                    daysRemaining <= 7   ? 'bg-yellow-100 text-yellow-800' :
                    daysRemaining <= 15  ? 'bg-yellow-50 text-yellow-700' :
                                            'bg-blue-100 text-blue-800';
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
                <Calendar className="h-3 w-3" />
                {daysRemaining > 0 ? `${daysRemaining} días` : 'Vence hoy'}
            </span>
        );
    };

    const fmt  = (d) => new Date(d + 'T00:00:00').toLocaleDateString('es-MX', { year:'numeric', month:'short', day:'numeric' });
    const fmtP = (p) => new Intl.NumberFormat('es-MX', { style:'currency', currency:'MXN' }).format(p);
    const totalPages = Math.ceil(total / limit);

    return (
        <div className="p-6 space-y-6 bg-primary-50 min-h-screen">

            {notification && (
                <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                    {notification.message}
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Suscripciones</h1>
                    <p className="text-sm text-gray-400 mt-1">Renovaciones y estado de membresías</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-4 py-2 bg-primary-700 text-white rounded-xl hover:bg-primary-800 transition font-medium flex items-center gap-2 text-sm shadow-sm"
                >
                    <Plus className="h-4 w-4" /> Nueva Suscripción
                </button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { title: 'Total',              value: metrics.total,            icon: <CreditCard  className="h-5 w-5 text-white"/>, color: 'bg-primary-700' },
                    { title: 'Activas',             value: metrics.active,           icon: <CheckCircle className="h-5 w-5 text-white"/>, color: 'bg-green-500'   },
                    { title: 'Vencen esta semana',  value: metrics.expiringThisWeek, icon: <AlertCircle className="h-5 w-5 text-white"/>, color: 'bg-yellow-500'  },
                    { title: 'Vencidas',            value: metrics.expired,          icon: <XCircle     className="h-5 w-5 text-white"/>, color: 'bg-red-400'     },
                ].map(({ title, value, icon, color }) => (
                    <div key={title} className="bg-white p-5 rounded-xl shadow-sm border hover:shadow-md transition">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-500 truncate">{title}</span>
                            <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
                        </div>
                        <div className="text-2xl font-bold text-gray-800 mt-1">{value}</div>
                    </div>
                ))}
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                            type="text"
                            placeholder="Buscar por miembro o plan..."
                            value={searchTerm}
                            onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 bg-white"
                    >
                        <option value="all">Todos los estados</option>
                        <option value="active">Activas</option>
                        <option value="expired">Vencidas</option>
                        <option value="cancelled">Canceladas</option>
                    </select>
                </div>
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto" />
                        <p className="mt-4 text-gray-400 text-sm">Cargando suscripciones...</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
                            <table className="w-full table-fixed">
                                <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
                                    <tr>
                                        {['Miembro','Plan','Inicio','Fin','Estado','Monto','Acciones'].map(h => (
                                            <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {subscriptions.length === 0 ? (
                                        <tr><td colSpan="7" className="px-4 py-8 text-center text-gray-400 text-sm">No se encontraron suscripciones</td></tr>
                                    ) : subscriptions.map(sub => {
                                        const days = calculateDaysRemaining(sub.end_date);
                                        const rowCls = sub.status === 'expired'
                                            ? 'bg-red-50/50 hover:bg-red-50'
                                            : days <= 3 && sub.status === 'active'
                                            ? 'bg-yellow-50/50 hover:bg-yellow-50'
                                            : 'hover:bg-primary-50/40';
                                        return (
                                            <tr
                                                key={sub.id}
                                                onClick={() => setSelectedSubscription(sub)}
                                                className={`cursor-pointer transition ${rowCls}`}
                                            >
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                    {sub.member?.first_name} {sub.member?.last_name_paternal}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-700">
                                                    {sub.plan?.name}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600">
                                                    {fmt(sub.start_date)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="text-sm text-gray-900">{fmt(sub.end_date)}</div>
                                                    {getDaysRemainingBadge(days, sub.status)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {getStatusBadge(sub.status)}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-700">
                                                    <div>{fmtP(sub.amount_paid)}</div>
                                                    {sub.payment_status === 'partial' && (
                                                        <div className="text-xs text-orange-600 font-medium">
                                                            Adeudo: {fmtP((sub.plan_price || sub.plan?.price) - sub.amount_paid)}
                                                        </div>
                                                    )}
                                                    {sub.payment_status === 'pending' && (
                                                        <div className="text-xs text-red-600 font-medium">
                                                            Pendiente: {fmtP(sub.plan_price || sub.plan?.price)}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                                                    <div className="flex items-center gap-1">
                                                        {(sub.status === 'active' || sub.status === 'expired') && (
                                                            <button
                                                                onClick={() => setRenewingSubscription(sub)}
                                                                className="px-2 py-1 text-xs text-primary-600 hover:bg-primary-50 rounded-lg transition font-medium"
                                                            >
                                                                Renovar
                                                            </button>
                                                        )}
                                                        {sub.status === 'active' && (
                                                            <button
                                                                onClick={() => handleCancelSubscription(sub)}
                                                                className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded-lg transition font-medium"
                                                            >
                                                                Cancelar
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50 text-sm">
                                <p className="text-gray-500">
                                    {(page-1)*limit+1}–{Math.min(page*limit, total)} de {total}
                                </p>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}
                                        className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40">
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>
                                    <span className="px-3 py-1 text-gray-600">Pág. {page}/{totalPages}</span>
                                    <button onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page>=totalPages}
                                        className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40">
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Drawer detalle */}
            {selectedSubscription && (
                <>
                    <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setSelectedSubscription(null)} />
                    <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col animate-slide-in-right">
                        <div className="flex items-center justify-between p-5 border-b border-gray-100 flex-shrink-0">
                            <div>
                                <h3 className="font-bold text-gray-900">Detalle de suscripción</h3>
                                <p className="text-xs text-gray-400 mt-0.5">#{selectedSubscription.id}</p>
                            </div>
                            <button onClick={() => setSelectedSubscription(null)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                                <X className="h-5 w-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            <SubscriptionDetailModal
                                subscription={selectedSubscription}
                                onClose={(refresh) => {
                                    setSelectedSubscription(null);
                                    if (refresh) { loadSubscriptions(); loadMetrics(); }
                                }}
                                embedded
                            />
                        </div>
                    </div>
                </>
            )}

            {/* Modales */}
            {isModalOpen && (
                <SubscriptionModal
                    onClose={(reload) => { setIsModalOpen(false); if (reload) { loadSubscriptions(); loadMetrics(); } }}
                    onSuccess={showNotification}
                />
            )}
            {renewingSubscription && (
                <RenewSubscriptionModal
                    subscription={renewingSubscription}
                    onClose={(reload) => {
                        setRenewingSubscription(null);
                        if (reload) { loadSubscriptions(); loadMetrics(); }
                    }}
                    onSuccess={showNotification}
                />
            )}
        </div>
    );
}

export default SubscriptionsList;