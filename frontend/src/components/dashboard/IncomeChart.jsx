import { useState } from 'react';
import InfoCard from '../../components/common/InfoCard';

const IncomeChart = ({ data, loading }) => {
    const [hoveredIndex, setHoveredIndex] = useState(null);

    const maxIncome = Math.max(...(data?.map(d => d.total_income) ?? [1]), 1);
    const totalIncome = data?.reduce((sum, d) => sum + d.total_income, 0) ?? 0;
    const avgIncome = data?.length ? totalIncome / data.length : 0;
    const today = new Date().toISOString().split('T')[0];
    const bestDay = data?.reduce((best, d) => d.total_income > (best?.total_income ?? -1) ? d : best, null);
    const daysWithIncome = data?.filter(d => d.total_income > 0).length ?? 0;

    const avgLineHeight = maxIncome > 0 ? (avgIncome / maxIncome) * 100 : 0;

    const formatPrice = (price) => new Intl.NumberFormat('es-MX', {
        style: 'currency', currency: 'MXN', minimumFractionDigits: 0
    }).format(price);

    const formatPriceShort = (price) => {
        if (price >= 1000) return `$${(price / 1000).toFixed(1)}k`;
        return `$${Math.round(price)}`;
    };

    const rightContent = (
        <div className="text-right">
            <p className="text-xs text-gray-400">Total semana</p>
            <p className="text-sm font-semibold text-emerald-700">
                {formatPrice(totalIncome)}
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
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full border border-emerald-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                        Prom: {formatPriceShort(avgIncome)}/día
                    </span>
                    {daysWithIncome > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-50 text-gray-600 text-xs font-medium rounded-full border border-gray-200">
                            {daysWithIncome} días con ingresos
                        </span>
                    )}
                    {bestDay && bestDay.total_income > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 text-xs font-medium rounded-full border border-amber-100">
                            <span>★</span>
                            Mejor: {bestDay.day_name.substring(0, 3)} ({formatPriceShort(bestDay.total_income)})
                        </span>
                    )}
                </div>

                {/* Chart */}
                <div className="relative h-44">
                    {/* Avg line */}
                    {avgIncome > 0 && (
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
                            const height = maxIncome > 0 ? (day.total_income / maxIncome) * 100 : 0;
                            const isToday = day.date === today;
                            const isBest = day === bestDay && day.total_income > 0;
                            const isHovered = hoveredIndex === index;

                            return (
                                <div
                                    key={index}
                                    className="flex-1 flex flex-col items-center h-full justify-end"
                                    onMouseEnter={() => setHoveredIndex(index)}
                                    onMouseLeave={() => setHoveredIndex(null)}
                                >
                                    {/* Value label */}
                                    <div className={`text-[10px] font-bold mb-1 transition-opacity ${
                                        day.total_income > 0 ? 'opacity-100' : 'opacity-0'
                                    } ${isToday ? 'text-emerald-700' : isBest ? 'text-amber-600' : 'text-gray-500'}`}>
                                        {day.total_income > 0 ? formatPriceShort(day.total_income) : ''}
                                    </div>

                                    {/* Bar */}
                                    <div className="relative w-full flex items-end" style={{ height: '85%' }}>
                                        <div
                                            className={`w-full rounded-t-md transition-all duration-200 ${
                                                isToday
                                                    ? 'bg-emerald-500'
                                                    : isBest
                                                    ? 'bg-amber-400'
                                                    : isHovered
                                                    ? 'bg-emerald-400'
                                                    : 'bg-emerald-200'
                                            }`}
                                            style={{
                                                height: `${height}%`,
                                                minHeight: height > 0 ? '4px' : '0',
                                                transform: isHovered ? 'scaleX(1.05)' : 'scaleX(1)',
                                            }}
                                        />

                                        {/* Tooltip */}
                                        {isHovered && (
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 text-white text-xs rounded-lg py-1.5 px-2.5 whitespace-nowrap z-20 shadow-lg">
                                                <div className="font-semibold">{formatPrice(day.total_income)}</div>
                                                <div className="text-gray-400 text-[10px]">{day.day_name}</div>
                                                {day.total_income === 0 && (
                                                    <div className="text-gray-500 text-[10px]">Sin ingresos</div>
                                                )}
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Labels */}
                                    <div className="text-center mt-1.5">
                                        <p className={`text-[10px] font-medium leading-tight ${
                                            isToday ? 'text-emerald-700' : 'text-gray-400'
                                        }`}>
                                            {day.day_name.substring(0, 3)}
                                        </p>
                                        <p className={`text-[10px] leading-tight ${
                                            isToday ? 'text-emerald-600 font-bold' : 'text-gray-300'
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
                        <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
                        <span className="text-[10px] text-gray-500">Hoy</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" />
                        <span className="text-[10px] text-gray-500">Mejor día</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-sm bg-emerald-200 inline-block" />
                        <span className="text-[10px] text-gray-500">Otros días</span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <InfoCard
            title="Ingresos últimos 7 días"
            rightContent={!loading && data?.length ? rightContent : null}
        >
            {renderBody()}
        </InfoCard>
    );
};

export default IncomeChart;