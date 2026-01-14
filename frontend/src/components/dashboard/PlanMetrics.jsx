import { TrendingUp } from 'lucide-react';

const PlanMetrics = ({ planMetrics, loading }) => {
    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                <h2 className="text-lg font-semibold text-primary mb-4">
                    Planes Más Populares
                </h2>
                <div className="animate-pulse space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-16 bg-gray-200 rounded"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (!planMetrics || planMetrics.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                <h2 className="text-lg font-semibold text-primary mb-4">
                    Planes Más Populares
                </h2>
                <div className="text-center py-8">
                    <p className="text-secondary">No hay datos de planes disponibles</p>
                </div>
            </div>
        );
    }

    const maxCount = Math.max(...planMetrics.map(p => p.active_subscriptions), 1);

    return (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-primary">
                    Planes Más Populares
                </h2>
                <TrendingUp className="h-5 w-5 text-primary-600" />
            </div>

            <div className="space-y-4">
                {planMetrics.map((plan, index) => {
                    const percentage = (plan.active_subscriptions / maxCount) * 100;
                    
                    return (
                        <div key={plan.plan_id}>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg font-bold text-primary-700">
                                        #{index + 1}
                                    </span>
                                <span className="font-medium text-gray-900">
                                    {plan.plan_name}
                                </span>
                                </div>
                                <span className="text-sm font-semibold text-primary-600">
                                    {plan.active_subscriptions} {plan.active_subscriptions === 1 ? 'miembro' : 'miembros'}
                                </span>
                            </div>
                            
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-primary-600 h-2 rounded-full transition-all"
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {planMetrics.length === 0 && (
                <div className="text-center py-4">
                    <p className="text-sm text-gray-500">
                        No hay suscripciones activas aún
                    </p>
                </div>
            )}
        </div>
    );
};

export default PlanMetrics;