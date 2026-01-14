const WeeklyChart = ({ data, loading }) => {
    if (!data || data.length === 0) {
        if (loading) {
            return (
                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                    <h2 className="text-lg font-semibold text-primary mb-4">
                        Asistencias Últimos 7 Días
                    </h2>
                    <div className="animate-pulse h-48 bg-gray-200 rounded"></div>
                </div>
            );
        }
        
        return (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-primary mb-4">
                Asistencias Últimos 7 Días
            </h2>
            <div className="text-center py-8">
                <p className="text-secondary">No hay datos disponibles</p>
            </div>
        </div>
        );
    }

    const maxVisits = Math.max(...data.map(d => d.total_visits), 1);
    const totalVisits = data.reduce((sum, d) => sum + d.total_visits, 0);
    const avgVisits = totalVisits / data.length;

    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-primary">
                    Asistencias Últimos 7 Días
                </h2>
                <div className="text-right">
                    <p className="text-xs text-muted">Promedio diario</p>
                    <p className="text-sm font-semibold text-primary-700">
                        {Math.round(avgVisits)} visitas
                    </p>
                </div>
            </div>

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
                                title={`${day.day_name}: ${day.total_visits} visitas`}
                                >
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
                                        {day.total_visits} visitas
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                    </div>
                                </div>
                            </div>
                            <div className="text-center mt-2">
                                <p className={`text-xs ${isToday ? 'font-bold text-primary-700' : 'text-muted'}`}>
                                    {day.day_name.substring(0, 3)}
                                </p>
                                <p className={`text-xs ${isToday ? 'font-bold text-primary-700' : 'text-muted'}`}>
                                    {new Date(day.date).getDate()}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default WeeklyChart;