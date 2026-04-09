import { useState } from 'react';
import InfoCard from '../../components/common/InfoCard';

const WeeklyChart = ({ data, loading }) => {
    const [hoveredIndex, setHoveredIndex] = useState(null);

    const maxVisits = Math.max(...(data?.map(d => d.total_visits) ?? [1]), 1);
    const totalVisits = data?.reduce((sum, d) => sum + d.total_visits, 0) ?? 0;
    const avgVisits = data?.length ? totalVisits / data.length : 0;
    const today = new Date().toISOString().split('T')[0];
    const bestDay = data?.reduce((best, d) => d.total_visits > (best?.total_visits ?? -1) ? d : best, null);
    const avgLineHeight = maxVisits > 0 ? (avgVisits / maxVisits) * 100 : 0;

    const rightContent = (
        <div className="text-right">
            <p className="text-xs text-gray-400">Promedio diario</p>
            <p className="text-sm font-semibold text-gray-700">
                {Math.round(avgVisits)} visitas
            </p>
        </div>
    );

    const renderBody = () => {
        if (loading) return <div className="animate-pulse h-52 bg-gray-100 rounded-lg" />;
        if (!data || data.length === 0) return (
            <div className="text-center py-8">
                <p className="text-gray-400 text-sm">No hay datos disponibles</p>
            </div>
        );

        return (
            <div className="space-y-3">
                {/* Stat pills */}
                <div className="flex gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-50 text-primary-700 text-xs font-medium rounded-full border border-primary-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-500 inline-block" />
                        Total: {totalVisits}
                    </span>
                    {bestDay && bestDay.total_visits > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 text-xs font-medium rounded-full border border-amber-100">
                            ★ Mejor: {bestDay.day_name.substring(0, 3)} ({bestDay.total_visits})
                        </span>
                    )}
                </div>

                {/* Chart */}
                <div className="relative h-44">
                    {/* Avg line */}
                    {avgVisits > 0 && (
                        <div
                            className="absolute left-0 right-0 border-t border-dashed border-gray-300 z-10 pointer-events-none"
                            style={{ bottom: `${avgLineHeight}%` }}
                        >
                            <span className="absolute right-0 -top-4 text-[10px] text-gray-400 bg-white px-1">
                                prom.
                            </span>
                        </div>
                    )}

                    {/* Bars */}
                    <div className="flex items-end justify-between h-full gap-1.5">
                        {data.map((day, index) => {
                            const totalHeight = maxVisits > 0 ? (day.total_visits / maxVisits) * 100 : 0;
                            const mHeight = day.total_visits > 0 ? (day.masculino / day.total_visits) * totalHeight : 0;
                            const fHeight = day.total_visits > 0 ? (day.femenino / day.total_visits) * totalHeight : 0;
                            const otherHeight = totalHeight - mHeight - fHeight;
                            const isToday = day.date === today;
                            const isBest = day === bestDay && day.total_visits > 0;
                            const isHovered = hoveredIndex === index;

                            return (
                                <div
                                    key={index}
                                    className="flex-1 flex flex-col items-center h-full justify-end"
                                    onMouseEnter={() => setHoveredIndex(index)}
                                    onMouseLeave={() => setHoveredIndex(null)}
                                >
                                    {/* Value label */}
                                    <div className={`text-[10px] font-bold mb-1 ${
                                        day.total_visits > 0 ? 'opacity-100' : 'opacity-0'
                                    } ${isToday ? 'text-primary-700' : isBest ? 'text-amber-600' : 'text-gray-500'}`}>
                                        {day.total_visits > 0 ? day.total_visits : ''}
                                    </div>

                                    {/* Stacked bar */}
                                    <div
                                        className="relative flex items-end justify-center"
                                        style={{ height: '85%', width: '100%' }}
                                    >
                                        {day.total_visits > 0 ? (
                                            <div
                                                className={`flex flex-col-reverse rounded-t-md overflow-hidden transition-all duration-200 ${
                                                    isHovered ? 'opacity-90' : ''
                                                }`}
                                                style={{
                                                    height: `${totalHeight}%`,
                                                    minHeight: '4px',
                                                    width: 'clamp(14px, 65%, 32px)'
                                                }}
                                            >
                                                {/* Sin dato */}
                                                {otherHeight > 0 && (
                                                    <div
                                                        className="w-full bg-gray-300"
                                                        style={{ height: `${(otherHeight / totalHeight) * 100}%` }}
                                                    />
                                                )}
                                                {/* Femenino */}
                                                {fHeight > 0 && (
                                                    <div
                                                        className="w-full bg-pink-400"
                                                        style={{ height: `${(fHeight / totalHeight) * 100}%` }}
                                                    />
                                                )}
                                                {/* Masculino */}
                                                {mHeight > 0 && (
                                                    <div
                                                        className="w-full bg-blue-500"
                                                        style={{ height: `${(mHeight / totalHeight) * 100}%` }}
                                                    />
                                                )}
                                            </div>
                                        ) : (
                                            <div style={{ height: '0%' }} />
                                        )}

                                        {/* Tooltip */}
                                        {isHovered && day.total_visits > 0 && (
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 text-white text-xs rounded-lg py-2 px-2.5 whitespace-nowrap z-20 shadow-lg">
                                                <div className="font-semibold mb-1">{day.total_visits} visitas</div>
                                                <div className="flex items-center gap-1 text-blue-300">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
                                                    Hombres: {day.masculino}
                                                </div>
                                                <div className="flex items-center gap-1 text-pink-300">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-pink-400 inline-block" />
                                                    Mujeres: {day.femenino}
                                                </div>
                                                {day.total_visits - day.masculino - day.femenino > 0 && (
                                                    <div className="flex items-center gap-1 text-gray-400">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block" />
                                                        N/D: {day.total_visits - day.masculino - day.femenino}
                                                    </div>
                                                )}
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Labels */}
                                    <div className="text-center mt-1.5">
                                        <p className={`text-[10px] font-medium leading-tight ${
                                            isToday ? 'text-primary-700' : 'text-gray-400'
                                        }`}>
                                            {day.day_name.substring(0, 3)}
                                        </p>
                                        <p className={`text-[10px] leading-tight ${
                                            isToday ? 'text-primary-600 font-bold' : 'text-gray-300'
                                        }`}>
                                            {new Date(day.date + 'T00:00:00').getDate()}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-3 pt-1 border-t border-gray-100">
                    <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" />
                        <span className="text-[10px] text-gray-500">Hombres</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-sm bg-pink-400 inline-block" />
                        <span className="text-[10px] text-gray-500">Mujeres</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-sm bg-gray-300 inline-block" />
                        <span className="text-[10px] text-gray-500">N/D</span>
                    </div>
                    <div className="flex items-center gap-1 ml-auto">
                        <span className="text-[10px] text-amber-600 font-medium">★ Mejor día</span>
                    </div>
                </div>
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