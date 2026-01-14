const RecentPayments = ({ payments, loading }) => {
    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                <h2 className="text-lg font-semibold text-primary mb-4">
                    Pagos Recientes
                </h2>
                <div className="animate-pulse space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-12 bg-gray-200 rounded"></div>
                    ))}
                </div>
            </div>
        );
    }

    const getMethodColor = (method) => {
        const colors = {
            efectivo: 'bg-green-100 text-green-800',
            tarjeta: 'bg-blue-100 text-blue-800',
            transferencia: 'bg-purple-100 text-purple-800',
            otro: 'bg-gray-100 text-gray-800'
        };
        return colors[method] || colors.otro;
    };

    const getMethodLabel = (method) => {
        const labels = {
            efectivo: 'Efectivo',
            tarjeta: 'Tarjeta',
            transferencia: 'Transferencia',
            otro: 'Otro'
        };
        return labels[method] || method;
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(price);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-MX', {
            day: '2-digit',
            month: 'short'
        });
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-primary">
                    Pagos Recientes
                </h2>
            </div>

            {payments.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-secondary">
                        No hay pagos registrados
                    </p>
                </div>
            ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                    {payments.map((payment) => (
                        <div
                        key={payment.id}
                        className="flex items-center justify-between p-3 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                            <div className="flex-1">
                                <p className="font-medium text-sm">
                                    {payment.member_name}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-xs px-2 py-0.5 rounded ${getMethodColor(payment.payment_method)}`}>
                                        {getMethodLabel(payment.payment_method)}
                                    </span>
                                    <span className="text-xs text-muted">
                                        {formatDate(payment.payment_date)}
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-semibold text-success-700">
                                    {formatPrice(payment.amount)}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RecentPayments;