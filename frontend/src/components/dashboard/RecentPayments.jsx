import InfoCard from '../../components/common/InfoCard';
import { Banknote, CreditCard, Landmark, MoreHorizontal } from 'lucide-react';

const METHOD_CONFIG = {
    efectivo:      { icon: Banknote,       label: 'Efectivo', cls: 'bg-green-50 text-green-700 border border-green-200' },
    tarjeta:       { icon: CreditCard,     label: 'Tarjeta',  cls: 'bg-blue-50 text-blue-700 border border-blue-200' },
    transferencia: { icon: Landmark,       label: 'Transfer', cls: 'bg-purple-50 text-purple-700 border border-purple-200' },
    otro:          { icon: MoreHorizontal, label: 'Otro',     cls: 'bg-gray-50 text-gray-600 border border-gray-200' }
};

const RecentPayments = ({ payments, loading }) => {
    const formatPrice = (price) => new Intl.NumberFormat('es-MX', {
        style: 'currency', currency: 'MXN'
    }).format(price);

    const formatDate = (dateString) => new Date(dateString + 'T00:00:00').toLocaleDateString('es-MX', {
        day: '2-digit', month: 'short'
    });

    return (
        <InfoCard title="Pagos recientes">
            {loading ? (
                <div className="animate-pulse space-y-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-200 rounded" />)}
                </div>
            ) : payments.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-gray-500 text-sm">No hay pagos registrados</p>
                </div>
            ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {payments.map((payment) => {
                        const method = METHOD_CONFIG[payment.payment_method] || METHOD_CONFIG.otro;
                        const MethodIcon = method.icon; // ✅ dentro del map
                        return (
                            <div
                                key={payment.id}
                                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-blue-50 transition-colors"
                            >
                                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                    <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${method.cls}`}>
                                        <MethodIcon className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {payment.member_name}
                                        </p>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="text-xs text-gray-400">{method.label}</span>
                                            <span className="text-gray-300">·</span>
                                            <span className="text-xs text-gray-400">{formatDate(payment.payment_date)}</span>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-sm font-bold text-emerald-700 flex-shrink-0 ml-2">
                                    {formatPrice(payment.amount)}
                                </p>
                            </div>
                        );
                    })}
                </div>
            )}
        </InfoCard>
    );
};

export default RecentPayments;