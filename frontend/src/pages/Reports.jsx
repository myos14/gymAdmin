import { useState, useEffect } from 'react';
import { TrendingUp, Users, DollarSign, Calendar, Activity, Award } from 'lucide-react';
import { reportsService } from '../services/reportsService';

function Reports() {
    const [period, setPeriod] = useState('month');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadReports();
    }, [period]);

    const loadReports = async () => {
        setLoading(true);
        try {
            const reports = await reportsService.getReports(period);
            setData(reports);
        } catch (error) {
            console.error('Error loading reports:', error);
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
        return new Date(dateString).toLocaleDateString('es-MX', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-4 text-text-secondary">Cargando reportes...</p>
                </div>
            </div>
        );
    }

    if (!data) {
        return <div className="text-center py-8">No hay datos disponibles</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Reportes y Análisis</h1>
                    <p className="text-text-secondary mt-1">
                        Del {formatDate(data.start_date)} al {formatDate(data.end_date)}
                    </p>
                </div>
                <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                    <option value="week">Última Semana</option>
                    <option value="month">Último Mes</option>
                    <option value="year">Último Año</option>
                </select>
            </div>

            {/* Métricas principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Ingresos Totales"
                    value={formatCurrency(data.income.total)}
                    subtitle={`${data.income.payment_count} pagos`}
                    icon={<DollarSign className="h-6 w-6" />}
                    color="green"
                />
                <MetricCard
                    title="Nuevos Miembros"
                    value={data.members.new_count}
                    subtitle="registrados"
                    icon={<Users className="h-6 w-6" />}
                    color="blue"
                />
                <MetricCard
                    title="Total Asistencias"
                    value={data.attendance.total}
                    subtitle="check-ins"
                    icon={<Activity className="h-6 w-6" />}
                    color="purple"
                />
                <MetricCard
                    title="Promedio Diario"
                    value={data.attendance.daily_avg}
                    subtitle="personas/día"
                    icon={<Calendar className="h-6 w-6" />}
                    color="orange"
                />
            </div>

            {/* Contenido principal - 2 columnas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Ingresos por plan */}
                <div className="bg-white rounded-lg shadow">
                    <div className="p-6 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-success-600" />
                            Ingresos por Plan
                        </h3>
                    </div>
                    <div className="p-6">
                        {data.income.by_plan.length > 0 ? (
                            <div className="space-y-3">
                                {data.income.by_plan.map((item, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <div className="font-medium text-text-primary">{item.plan_name}</div>
                                            <div className="text-sm text-text-secondary">{item.count} ventas</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-success-600">{formatCurrency(item.total)}</div>
                                            <div className="text-xs text-text-secondary">
                                                {formatCurrency(item.average)} promedio
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-text-secondary py-8">No hay datos de ingresos</p>
                        )}
                    </div>
                </div>

                {/* Métodos de pago */}
                <div className="bg-white rounded-lg shadow">
                    <div className="p-6 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-primary-600" />
                            Métodos de Pago
                        </h3>
                    </div>
                    <div className="p-6">
                        {Object.keys(data.income.by_payment_method).length > 0 ? (
                            <div className="space-y-3">
                                {Object.entries(data.income.by_payment_method).map(([method, amount]) => {
                                    // Map names to display in frontend
                                    const methodNames = {
                                        'efectivo': 'Efectivo',
                                        'tarjeta': 'Tarjeta',
                                        'transferencia': 'Transferencia',
                                        'otro': 'Otro',
                                        // Legacy support for old names
                                        'cash': 'Efectivo',
                                        'card': 'Tarjeta',
                                        'transfer': 'Transferencia',
                                        'other': 'Otro'
                                    };
                                    
                                    const displayName = methodNames[method] || method;
                                    const percentage = ((amount / data.income.total) * 100).toFixed(1);
                                    
                                    return (
                                        <div key={method}>
                                            <div className="flex justify-between mb-1">
                                                <span className="text-sm font-medium text-text-primary">
                                                    {displayName}
                                                </span>
                                                <span className="text-sm font-semibold text-primary-600">
                                                    {formatCurrency(amount)}
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-primary-600 h-2 rounded-full"
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                            <div className="text-xs text-text-secondary mt-1">{percentage}%</div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-center text-text-secondary py-8">No hay datos de pagos</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Miembros más activos */}
            <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                        <Award className="h-5 w-5 text-warning-600" />
                        Top 10 Miembros Más Activos
                    </h3>
                </div>
                <div className="p-6">
                    {data.attendance.top_members.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {data.attendance.top_members.map((member, index) => (
                                <div
                                    key={member.id}
                                    className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200 hover:border-primary-300 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                                            index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                            index === 1 ? 'bg-gray-100 text-gray-700' :
                                            index === 2 ? 'bg-orange-100 text-orange-700' :
                                            'bg-primary-50 text-primary-700'
                                        }`}>
                                            #{index + 1}
                                        </div>
                                        <div>
                                            <div className="font-medium text-text-primary">{member.full_name}</div>
                                            <div className="text-xs text-text-secondary">
                                                ID: {member.id}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-primary-600">
                                            {member.visit_count}
                                        </div>
                                        <div className="text-xs text-text-secondary">visitas</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-text-secondary py-8">No hay datos de asistencias</p>
                    )}
                </div>
            </div>
        </div>
    );
}

function MetricCard({ title, value, subtitle, icon, color }) {
    const colors = {
        green: {
            bg: 'bg-success-50',
            text: 'text-success-600',
            value: 'text-success-700'
        },
        blue: {
            bg: 'bg-primary-50',
            text: 'text-primary-600',
            value: 'text-primary-700'
        },
        purple: {
            bg: 'bg-purple-50',
            text: 'text-purple-600',
            value: 'text-purple-700'
        },
        orange: {
            bg: 'bg-warning-50',
            text: 'text-warning-600',
            value: 'text-warning-700'
        }
    };

    const colorScheme = colors[color] || colors.blue;

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-text-secondary">{title}</span>
                <div className={`p-2 rounded-lg ${colorScheme.bg} ${colorScheme.text}`}>
                    {icon}
                </div>
            </div>
            <div className={`text-3xl font-bold ${colorScheme.value} mb-1`}>
                {value}
            </div>
            <div className="text-sm text-text-secondary">{subtitle}</div>
        </div>
    );
}

export default Reports;