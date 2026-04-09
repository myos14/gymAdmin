import { useState, useEffect } from 'react';
import { X, AlertCircle, DollarSign } from 'lucide-react';
import { subscriptionService } from '../../services/subscriptionService';

function PendingPaymentsModal({ onClose }) {
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(null);
    const [payAmounts, setPayAmounts] = useState({});
    const [notification, setNotification] = useState(null);
    const [payErrors, setPayErrors] = useState({});

    useEffect(() => {
        loadPending();
    }, []);

    const loadPending = async () => {
        try {
            setLoading(true);
            const data = await subscriptionService.getAllSubscriptions({
                status: 'active',
                payment_status: 'pending',
                limit: 100
            });
            const partial = await subscriptionService.getAllSubscriptions({
                status: 'active',
                payment_status: 'partial',
                limit: 100
            });
            const all = [
                ...(data.subscriptions || []),
                ...(partial.subscriptions || [])
            ].sort((a, b) => {
                const adeudoA = (a.plan_price || 0) - (a.amount_paid || 0);
                const adeudoB = (b.plan_price || 0) - (b.amount_paid || 0);
                return adeudoB - adeudoA;
            });
            setSubscriptions(all);
        } catch (err) {
            console.error('Error loading pending:', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePay = async (sub) => {
        const amount = parseFloat(payAmounts[sub.id] || 0);
        const adeudo = (sub.plan_price || 0) - (sub.amount_paid || 0);

        if (!amount || amount <= 0) {
            setPayErrors(prev => ({ ...prev, [sub.id]: 'Ingresa un monto válido' }));
            return;
        }
        if (amount > adeudo) {
            setPayErrors(prev => ({ ...prev, [sub.id]: `No puede exceder el adeudo de ${formatPrice(adeudo)}` }));
            return;
        }

        setPaying(sub.id);
        try {
            await subscriptionService.registerPayment(sub.id, {
                amount,
                payment_method: 'efectivo'
            });
            setNotification({ message: 'Pago registrado', type: 'success' });
            setPayAmounts(prev => ({ ...prev, [sub.id]: '' }));
            setTimeout(() => setNotification(null), 2000);
            await loadPending();
        } catch {
            setNotification({ message: 'Error al registrar', type: 'error' });
            setTimeout(() => setNotification(null), 2000);
        } finally {
            setPaying(null);
        }
    };

    const formatPrice = (p) => new Intl.NumberFormat('es-MX', {
        style: 'currency', currency: 'MXN', minimumFractionDigits: 0
    }).format(p || 0);

    const totalPendiente = subscriptions.reduce((sum, s) => {
        return sum + ((s.plan_price || 0) - (s.amount_paid || 0));
    }, 0);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-xl">

                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-yellow-500 flex items-center justify-center">
                            <AlertCircle className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-gray-900">Pagos Pendientes</h3>
                            <p className="text-xs text-gray-400">
                                {loading ? '...' : `${subscriptions.length} suscripciones · Total: ${formatPrice(totalPendiente)}`}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Notification */}
                {notification && (
                    <div className={`mx-4 mt-3 px-3 py-2 rounded-lg text-sm font-medium ${
                        notification.type === 'success'
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                        {notification.message}
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="animate-pulse h-20 bg-gray-100 rounded-lg" />
                            ))}
                        </div>
                    ) : subscriptions.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <DollarSign className="h-8 w-8 text-green-500" />
                            </div>
                            <p className="text-gray-600 text-sm font-medium">¡Todo al corriente!</p>
                            <p className="text-gray-400 text-xs mt-1">No hay pagos pendientes</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {subscriptions.map((sub) => {
                                const adeudo = (sub.plan_price || 0) - (sub.amount_paid || 0);
                                const isPending = sub.payment_status === 'pending';

                                return (
                                    <div
                                        key={sub.id}
                                        className={`p-4 rounded-xl border ${
                                            isPending
                                                ? 'bg-red-50 border-red-100'
                                                : 'bg-orange-50 border-orange-100'
                                        }`}
                                    >
                                        {/* Member + plan */}
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {sub.member?.first_name} {sub.member?.last_name_paternal}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {sub.plan?.name}
                                                </p>
                                            </div>
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                                isPending
                                                    ? 'bg-red-100 text-red-700'
                                                    : 'bg-orange-100 text-orange-700'
                                            }`}>
                                                {isPending ? 'Sin pago' : 'Parcial'}
                                            </span>
                                        </div>

                                        {/* Payment info */}
                                        <div className="flex gap-4 text-xs mb-3">
                                            <div>
                                                <p className="text-gray-400">Plan</p>
                                                <p className="font-semibold text-gray-700">{formatPrice(sub.plan_price)}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400">Pagado</p>
                                                <p className="font-semibold text-green-700">{formatPrice(sub.amount_paid)}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400">Adeudo</p>
                                                <p className="font-bold text-red-600">{formatPrice(adeudo)}</p>
                                            </div>
                                        </div>

                                        {/* Pay input */}
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                value={payAmounts[sub.id] || ''}
                                                onChange={e => {
                                                    setPayAmounts(prev => ({ ...prev, [sub.id]: e.target.value }));
                                                    setPayErrors(prev => ({ ...prev, [sub.id]: '' }));
                                                }}
                                                placeholder={`Máx. ${formatPrice(adeudo)}`}
                                                min="0.01"
                                                step="0.01"
                                                max={adeudo}
                                                className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-white"
                                            />
                                            {payErrors[sub.id] && (
                                                <p className="text-xs text-red-500 mt-1">{payErrors[sub.id]}</p>
                                            )}
                                            <button
                                                onClick={() => handlePay(sub)}
                                                disabled={paying === sub.id || !payAmounts[sub.id]}
                                                className="px-3 py-1.5 bg-yellow-500 text-white text-sm font-medium rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                {paying === sub.id ? '...' : 'Abonar'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 flex justify-between items-center">
                    <p className="text-xs text-gray-400">
                        {subscriptions.length > 0 && `Total adeudado: ${formatPrice(totalPendiente)}`}
                    </p>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}

export default PendingPaymentsModal;