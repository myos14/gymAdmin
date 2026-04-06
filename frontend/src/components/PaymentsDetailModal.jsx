import { useState, useEffect } from 'react';
import { X, DollarSign } from 'lucide-react';
import { paymentService } from '../services/paymentService';

function PaymentsDetailModal({ startDate, endDate, onClose }) {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPayments();
    }, []);

    const loadPayments = async () => {
        try {
            const data = await paymentService.getPayments({
                start_date: startDate,
                end_date: endDate,
                limit: 100
            });
            setPayments(data);
        } catch (error) {
            console.error('Error loading payments:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString + 'T00:00:00').toLocaleDateString('es-MX', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const methodLabel = {
        efectivo: 'Efectivo',
        tarjeta: 'Tarjeta',
        transferencia: 'Transferencia',
        otro: 'Otro'
    };

    const methodColor = {
        efectivo: 'bg-green-100 text-green-700',
        tarjeta: 'bg-blue-100 text-blue-700',
        transferencia: 'bg-purple-100 text-purple-700',
        otro: 'bg-gray-100 text-gray-700'
    };

    const total = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[85vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-success-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                            Detalle de Ingresos
                        </h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Periodo */}
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                    <p className="text-sm text-gray-600">
                        Del {formatDate(startDate)} al {formatDate(endDate)}
                    </p>
                </div>

                {/* Lista de pagos */}
                <div className="flex-1 overflow-y-auto p-5">
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
                        </div>
                    ) : payments.length === 0 ? (
                        <p className="text-center text-gray-500 py-10">
                            No hay pagos en este periodo
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {payments.map((payment) => (
                                <div
                                    key={payment.id}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <div>
                                        <p className="font-medium text-gray-900 text-sm">
                                            {payment.member?.first_name} {payment.member?.last_name_paternal}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {formatDate(payment.payment_date)}
                                            {payment.notes && ` · ${payment.notes}`}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                            methodColor[payment.payment_method] || methodColor.otro
                                        }`}>
                                            {methodLabel[payment.payment_method] || payment.payment_method}
                                        </span>
                                        <span className="font-bold text-success-600 text-sm">
                                            {formatCurrency(payment.amount)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer con total */}
                {!loading && payments.length > 0 && (
                    <div className="p-5 border-t border-gray-200 bg-gray-50">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                                {payments.length} pagos en el periodo
                            </span>
                            <span className="text-lg font-bold text-success-600">
                                Total: {formatCurrency(total)}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default PaymentsDetailModal;