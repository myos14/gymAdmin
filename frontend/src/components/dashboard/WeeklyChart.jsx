import InfoCard from '../../components/common/InfoCard';

const WeeklyChart = ({ data, loading }) => {
    const maxVisits = Math.max(...(data?.map(d => d.total_visits) ?? [1]), 1);
    const totalVisits = data?.reduce((sum, d) => sum + d.total_visits, 0) ?? 0;
    const avgVisits = data?.length ? totalVisits / data.length : 0;
    const today = new Date().toISOString().split('T')[0];

    const rightContent = (
        <div className="text-right">
            <p className="text-xs text-gray-400">Promedio diario</p>
            <p className="text-sm font-semibold text-gray-700">
                {Math.round(avgVisits)} visitas
            </p>
        </div>
    );

    const renderBody = () => {
        if (loading) {
            return <div className="animate-pulse h-48 bg-gray-200 rounded" />;
        }

        if (!data || data.length === 0) {
            return (
                <div className="text-center py-8">
                    <p className="text-gray-400">No hay datos disponibles</p>
                </div>
            );
        }
        return (
            <div className="flex items-end justify-between h-48 gap-2">
                {data.map((day, index) => {
                    const height = maxVisits > 0 ? (day.total_visits / maxVisits) * 100 : 0;
                    const isToday = day.date === today;

                    return (
                        <div key={index} className="flex-1 flex flex-col items-center">
                            <div className="relative w-full h-full flex items-end">
                                <div
                                    className={`w-full rounded-t transition-all ${
                                        isToday ? 'bg-primary-700' : 'bg-primary-500'
                                    } hover:opacity-80 cursor-pointer group`}
                                    style={{ height: `${height}%`, minHeight: height > 0 ? '4px' : '0' }}
                                >
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
                                        {day.total_visits} visitas
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                                    </div>
                                </div>
                            </div>
                            <div className="text-center mt-2">
                                <p className={`text-xs ${isToday ? 'font-bold text-primary-700' : 'text-gray-400'}`}>
                                    {day.day_name.substring(0, 3)}
                                </p>
                                <p className={`text-xs ${isToday ? 'font-bold text-primary-700' : 'text-gray-400'}`}>
                                    {new Date(day.date).getDate()}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };
    return (
        <InfoCard
            title="Asistencias últimos 7 días"
            rightContent={!loading && data?.length ? rightContent : null}
        >
            {renderBody()}
        </InfoCard>
    );
};

export default WeeklyChart;