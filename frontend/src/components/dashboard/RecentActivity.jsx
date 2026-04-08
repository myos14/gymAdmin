import InfoCard from '../../components/common/InfoCard';

const RecentActivity = ({ checkins, loading }) => {
    const getStatusBadge = (status) => {
        const badges = {
            active: 'bg-success-100 text-success-800',
            expiring_soon: 'bg-warning-100 text-warning-800',
            expired: 'bg-error-100 text-error-800',
        };
        
        const labels = {
            active: 'Activo',
            expiring_soon: 'Por vencer',
            expired: 'Vencido',
        };

        return (
        <span className={`text-xs px-2 py-1 rounded-full ${badges[status]}`}>
            {labels[status]}
        </span>
        );
    };

    const formatTime = (datetime) => {
        return new Date(datetime).toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
        });
    };

    if (loading) {
        return (
            <InfoCard title="Actividad reciente">
                <div className="animate-pulse space-y-3">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-12 bg-gray-200 rounded"></div>
                    ))}
                </div>
            </InfoCard>
        );
    }
    return (
        <InfoCard title="Actividad reciente">
            {checkins.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-secondary">
                        No hay asistencias recientes
                    </p>
                </div>
            ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {checkins.map((checkin) => (
                        <div
                            key={checkin.id}
                            className="p-3 rounded-md bg-background-hover hover:bg-gray-100 transition-colors"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="font-medium text-primary">
                                        {checkin.member.first_name} {checkin.member.last_name_paternal}
                                        {checkin.member.last_name_maternal && ` ${checkin.member.last_name_maternal}`}
                                    </p>
                                    <p className="text-sm text-muted mt-1">
                                        Check-in: {formatTime(checkin.check_in_time)}
                                    </p>
                                </div>
                                <div className="ml-4">
                                    {getStatusBadge(checkin.subscription_status)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </InfoCard>
    );
};

export default RecentActivity;