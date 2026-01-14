import { useState } from 'react';
import RenewSubscriptionModal from './RenewSubscriptionModal';

const ExpiringSubscriptions = ({ subscriptions, loading, onRefresh }) => {
    const [renewingSubscription, setRenewingSubscription] = useState(null);
    const [notification, setNotification] = useState(null);

    const showNotification = (message, type) => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleRenewClick = (subscription) => {
        console.log('Opening modal for:', subscription); // ← DEBUG
        setRenewingSubscription(subscription);
    };

    const handleCloseModal = (shouldRefresh) => {
        setRenewingSubscription(null);
        if (shouldRefresh && onRefresh) {
            onRefresh();
        }
    };

    if (loading) {
        return (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-primary mb-4">
                Suscripciones por vencer
            </h2>
            <div className="animate-pulse space-y-3">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
            </div>
        </div>
        );
    }

    const getUrgencyColor = (daysRemaining) => {
        if (daysRemaining <= 2) return 'bg-error-100 text-error-800 border-error-200';
        if (daysRemaining <= 5) return 'bg-warning-100 text-warning-800 border-warning-200';
        return 'bg-info-100 text-info-800 border-info-200';
    };

    return (
        <>
        {/* Notification */}
        {notification && (
            <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
                    notification.type === 'success' ? 'bg-success-500' : 'bg-error-500'
                } text-white`}>
                {notification.message}
            </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-primary">
                    Suscripciones por vencer
                </h2>
                <span className="text-sm text-muted">
                    Próximos 7 días
                </span>
            </div>

            {subscriptions.length === 0 ? (
            <div className="text-center py-8">
                <p className="text-secondary">
                    No hay suscripciones por vencer en los próximos días
                </p>
            </div>
            ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {subscriptions.map((sub) => (
                    <div
                        key={sub.id}
                        className={`p-4 rounded-md border ${getUrgencyColor(sub.days_remaining)}`}
                    >
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex-1">
                                <p className="font-medium">
                                    {sub.member.first_name} {sub.member.last_name_paternal}
                                    {sub.member.last_name_maternal && ` ${sub.member.last_name_maternal}`}
                                </p>
                                <p className="text-sm mt-1 opacity-75">
                                    {sub.plan.name}
                                </p>
                            </div>
                        
                            <div className="text-right">
                                <p className="text-sm font-semibold">
                                    {sub.days_remaining === 0 
                                        ? 'Vence hoy' 
                                        : sub.days_remaining === 1
                                        ? '1 día'
                                        : `${sub.days_remaining} días`}
                                </p>
                                <p className="text-xs mt-1 opacity-75">
                                    {new Date(sub.end_date).toLocaleDateString('es-MX', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric'
                                    })}
                                </p>
                            </div>

                            {/* Botón Renovar */}
                            <button
                                onClick={() => handleRenewClick(sub)}
                                className="px-3 py-1.5 bg-primary-600 text-white text-sm rounded-md hover:bg-primary-700 transition-colors"
                            >
                                Renovar
                            </button>
                        </div>
                    </div>
                    ))}
                </div>
            )}
        </div>

        {/* Modal de Renovación */}
        {renewingSubscription && (
            <RenewSubscriptionModal
            subscription={renewingSubscription}
            onClose={handleCloseModal}
            onSuccess={showNotification}
            />
        )}
        </>
    );
};

export default ExpiringSubscriptions;