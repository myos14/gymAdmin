import { X, Calendar, CreditCard, User, FileText, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useState } from 'react';
import { subscriptionService } from '../services/subscriptionService';

function SubscriptionDetailModal({ subscription, onClose, embedded }) {
    const [paying, setPaying] = useState(false);
    const [payAmount, setPayAmount] = useState('');
    const [payError, setPayError] = useState('');

    const formatDate = (dateString) => {
        return new Date(dateString + 'T00:00:00').toLocaleDateString('es-MX', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency', currency: 'MXN'
        }).format(price || 0);
    };

    const calculateDaysRemaining = (endDate) => {
        const today = new Date();
        const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const end = new Date(endDate + 'T00:00:00');
        return Math.ceil((end - todayMidnight) / (1000 * 60 * 60 * 24));
    };

    const planPrice = subscription.plan_price || subscription.plan?.price || 0;
    const amountPaid = subscription.amount_paid || 0;
    const adeudo = planPrice - amountPaid;
    const daysRemaining = calculateDaysRemaining(subscription.end_date);

    const getPaymentStatusInfo = () => {
        switch (subscription.payment_status) {
            case 'paid':
                return { label: 'Pagado', color: 'bg-green-100 text-green-800', icon: CheckCircle };
            case 'partial':
                return { label: 'Pago Parcial', color: 'bg-orange-100 text-orange-800', icon: AlertCircle };
            case 'pending':
                return { label: 'Pendiente', color: 'bg-red-100 text-red-800', icon: AlertCircle };
            default:
                return { label: subscription.payment_status, color: 'bg-gray-100 text-gray-800', icon: Clock };
        }
    };

    const getSubscriptionStatusInfo = () => {
        switch (subscription.status) {
            case 'active':
                return { label: 'Activa', color: 'bg-green-100 text-green-800' };
            case 'expired':
                return { label: 'Vencida', color: 'bg-red-100 text-red-800' };
            case 'cancelled':
                return { label: 'Cancelada', color: 'bg-gray-100 text-gray-800' };
            default:
                return { label: subscription.status, color: 'bg-gray-100 text-gray-800' };
        }
    };
 
    const paymentInfo = getPaymentStatusInfo();
    const statusInfo = getSubscriptionStatusInfo();
    const PaymentIcon = paymentInfo.icon;

    if (embedded) {
        return (
            <div className="p-6 space-y-6">
                {/* Estados */}
                <div className="flex gap-2 flex-wrap pt-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusInfo.color}`}>
                        {statusInfo.label}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${paymentInfo.color}`}>
                        <PaymentIcon className="h-4 w-4" />{paymentInfo.label}
                    </span>
                    {subscription.status === 'active' && (
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            daysRemaining <= 0 ? 'bg-red-100 text-red-800' :
                            daysRemaining <= 7 ? 'bg-orange-100 text-orange-800' :
                            'bg-blue-100 text-blue-800'
                        }`}>
                            {daysRemaining > 0 ? `${daysRemaining} días restantes` : 'Vence hoy'}
                        </span>
                    )}
                </div>

                {/* Miembro */}
                <div>
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <User className="h-4 w-4" /> Miembro
                    </h4>
                    <div className="bg-gray-50 rounded-xl p-4">
                        <p className="font-semibold text-gray-900">
                            {subscription.member?.first_name} {subscription.member?.last_name_paternal} {subscription.member?.last_name_maternal || ''}
                        </p>
                    </div>
                </div>

                {/* Plan y Fechas */}
                <div>
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Calendar className="h-4 w-4" /> Plan y Vigencia
                    </h4>
                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                        {[
                            { label: 'Plan',        val: subscription.plan?.name },
                            { label: 'Inicio',      val: formatDate(subscription.start_date) },
                            { label: 'Vencimiento', val: formatDate(subscription.end_date),
                                cls: daysRemaining <= 7 && subscription.status === 'active' ? 'text-orange-600' : 'text-gray-900' },
                            { label: 'Duración',    val: subscription.plan?.duration_days === 1 ? '1 visita' :
                                                            subscription.plan?.duration_days >= 36500 ? 'Permanente' :
                                                            `${subscription.plan?.duration_days} días` },
                        ].map(({ label, val, cls }) => (
                            <div key={label} className="flex justify-between text-sm">
                                <span className="text-gray-500">{label}</span>
                                <span className={`font-medium ${cls || 'text-gray-900'}`}>{val}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Pagos */}
                <div>
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <CreditCard className="h-4 w-4" /> Pago
                    </h4>
                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Precio del plan</span>
                            <span className="font-semibold text-gray-900">{formatPrice(planPrice)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Pagado</span>
                            <span className="font-semibold text-green-700">{formatPrice(amountPaid)}</span>
                        </div>
                        {adeudo > 0 ? (
                            <div className="flex justify-between text-sm pt-2 border-t border-orange-200">
                                <span className="text-orange-700 font-medium">Adeudo</span>
                                <span className="font-bold text-orange-700">{formatPrice(adeudo)}</span>
                            </div>
                        ) : (
                            <div className="flex justify-between text-sm pt-2 border-t border-green-200">
                                <span className="text-green-700 font-medium">Saldo</span>
                                <span className="font-bold text-green-700">Liquidado ✓</span>
                            </div>
                        )}
                        {adeudo > 0 && (
                            <div className="pt-3 border-t border-gray-200 space-y-2">
                                <p className="text-xs font-medium text-gray-600">Registrar abono</p>
                                <div className="flex gap-2">
                                    <input
                                        type="number" value={payAmount}
                                        onChange={e => { setPayAmount(e.target.value); setPayError(''); }}
                                        placeholder="Monto" min="0.01" step="0.01" max={adeudo}
                                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                                    />
                                    <button
                                        onClick={async () => {
                                            const amount = parseFloat(payAmount);
                                            if (!amount || amount <= 0) { setPayError('Monto inválido'); return; }
                                            if (amount > adeudo) { setPayError(`Máximo ${formatPrice(adeudo)}`); return; }
                                            setPaying(true);
                                            try {
                                                await subscriptionService.registerPayment(subscription.id, { amount, payment_method: 'efectivo' });
                                                onClose(true);
                                            } catch { setPayError('Error al registrar'); }
                                            finally { setPaying(false); }
                                        }}
                                        disabled={paying}
                                        className="px-3 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50"
                                    >
                                        {paying ? '...' : 'Abonar'}
                                    </button>
                                </div>
                                {payError && <p className="text-red-500 text-xs">{payError}</p>}
                            </div>
                        )}
                    </div>
                </div>

                {subscription.notes && (
                    <div>
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <FileText className="h-4 w-4" /> Notas
                        </h4>
                        <div className="bg-gray-50 rounded-xl p-4">
                            <p className="text-gray-700 text-sm">{subscription.notes}</p>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl">
                
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Detalle de suscripción</h3>
                        <p className="text-sm text-gray-500 mt-1">#{subscription.id}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="p-6 space-y-6">

                    {/* Estados */}
                    <div className="flex gap-2 flex-wrap">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusInfo.color}`}>
                            {statusInfo.label}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${paymentInfo.color}`}>
                            <PaymentIcon className="h-4 w-4" />
                            {paymentInfo.label}
                        </span>
                        {subscription.status === 'active' && (
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                daysRemaining <= 0 ? 'bg-red-100 text-red-800' :
                                daysRemaining <= 7 ? 'bg-orange-100 text-orange-800' :
                                'bg-blue-100 text-blue-800'
                            }`}>
                                {daysRemaining > 0 ? `${daysRemaining} días restantes` : 'Vence hoy'}
                            </span>
                        )}
                    </div>

                    {/* Miembro */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <User className="h-4 w-4" /> Miembro
                        </h4>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="font-semibold text-gray-900 text-lg">
                                {subscription.member?.first_name} {subscription.member?.last_name_paternal} {subscription.member?.last_name_maternal || ''}
                            </p>
                        </div>
                    </div>

                    {/* Plan y Fechas */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Calendar className="h-4 w-4" /> Plan y Vigencia
                        </h4>
                        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Plan</span>
                                <span className="font-semibold text-gray-900">{subscription.plan?.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Inicio</span>
                                <span className="font-medium text-gray-900">{formatDate(subscription.start_date)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Vencimiento</span>
                                <span className={`font-medium ${daysRemaining <= 7 && subscription.status === 'active' ? 'text-orange-600' : 'text-gray-900'}`}>
                                    {formatDate(subscription.end_date)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Duración</span>
                                <span className="font-medium text-gray-900">
                                    {subscription.plan?.duration_days === 1 ? '1 visita' :
                                        subscription.plan?.duration_days >= 36500 ? 'Permanente' :
                                    `${subscription.plan?.duration_days} días`}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Pagos */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <CreditCard className="h-4 w-4" /> Información de Pago
                        </h4>
                        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Precio del plan</span>
                                <span className="font-semibold text-gray-900">{formatPrice(planPrice)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Pagado</span>
                                <span className="font-semibold text-green-700">{formatPrice(amountPaid)}</span>
                            </div>
                            {adeudo > 0 && (
                                <div className="flex justify-between pt-2 border-t border-orange-200">
                                    <span className="text-orange-700 font-medium">Adeudo</span>
                                    <span className="font-bold text-orange-700">{formatPrice(adeudo)}</span>
                                </div>
                            )}
                            {adeudo <= 0 && (
                                <div className="flex justify-between pt-2 border-t border-green-200">
                                    <span className="text-green-700 font-medium">Saldo</span>
                                    <span className="font-bold text-green-700">Liquidado ✓</span>
                                </div>
                            )}
                            {adeudo > 0 && (
                                <div className="pt-3 border-t border-gray-200 space-y-2">
                                    <p className="text-sm font-medium text-gray-700">Registrar abono</p>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            value={payAmount}
                                            onChange={e => { setPayAmount(e.target.value); setPayError(''); }}
                                            placeholder="Monto"
                                            min="0.01"
                                            step="0.01"
                                            max={adeudo}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        />
                                        <button
                                            onClick={async () => {
                                                const amount = parseFloat(payAmount);
                                                if (!amount || amount <= 0) { setPayError('Ingresa un monto válido'); return; }
                                                if (amount > adeudo) { setPayError(`Máximo ${formatPrice(adeudo)}`); return; }
                                                setPaying(true);
                                                try {
                                                    await subscriptionService.registerPayment(subscription.id, { amount, payment_method: 'efectivo' });
                                                    onClose(true);
                                                } catch {
                                                    setPayError('Error al registrar pago');
                                                } finally {
                                                    setPaying(false);
                                                }
                                            }}
                                            disabled={paying}
                                            className="px-3 py-2 bg-blue-600/80 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                        >
                                            {paying ? '...' : 'Abonar'}
                                        </button>
                                    </div>
                                    {payError && <p className="text-red-500 text-xs">{payError}</p>}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Notas */}
                    {subscription.notes && (
                        <div>
                            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <FileText className="h-4 w-4" /> Notas
                            </h4>
                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-gray-700 text-sm">{subscription.notes}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end p-6 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}

export default SubscriptionDetailModal;