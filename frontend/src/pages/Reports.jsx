import { useState, useEffect } from 'react';
import { TrendingUp, Users, DollarSign, Calendar, Activity, Award, Database } from 'lucide-react';
import { reportsService } from '../services/reportsService';
import { memberService } from '../services/memberService';
import PaymentsDetailModal from '../components/PaymentsDetailModal';
import MemberDetailModal from '../components/MemberDetailModal';
import PlanMetrics from '../components/dashboard/PlanMetrics';
import RecentActivity from '../components/dashboard/RecentActivity';
import api from '../services/api';

function Reports() {
    const [period, setPeriod] = useState('month');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [backupLoading, setBackupLoading] = useState(false);
    const [showPaymentsModal, setShowPaymentsModal] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);
    const [loadingMember, setLoadingMember] = useState(false);

    useEffect(() => { loadReports(); }, [period]);

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

    const handleBackup = async () => {
        try {
            setBackupLoading(true);
            const response = await api.get('/backup/database', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `fuerzafit_backup_${new Date().toISOString().split('T')[0]}.sql`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            alert('Respaldo generado exitosamente');
        } catch (error) {
            alert('Error al generar respaldo de base de datos');
        } finally {
            setBackupLoading(false);
        }
    };

    const handleViewMember = async (memberId) => {
        setLoadingMember(true);
        try {
            const member = await memberService.getMember(memberId);
            setSelectedMember(member);
        } catch (error) {
            console.error('Error loading member:', error);
        } finally {
            setLoadingMember(false);
        }
    };

    const formatCurrency = (amount) => new Intl.NumberFormat('es-MX', {
        style: 'currency', currency: 'MXN'
    }).format(amount);

    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('es-MX', {
        day: 'numeric', month: 'long', year: 'numeric'
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto" />
                    <p className="mt-4 text-text-secondary">Cargando reportes...</p>
                </div>
            </div>
        );
    }

    if (!data) return <div className="text-center py-8">No hay datos disponibles</div>;

    return (
        <div className="space-y-6 bg-primary-50 min-h-screen">

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Reportes y Análisis</h1>
                    <p className="text-text-secondary mt-1">
                        Del {formatDate(data.start_date)} al {formatDate(data.end_date)}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                        <option value="week">Última Semana</option>
                        <option value="month">Último Mes</option>
                        <option value="year">Último Año</option>
                    </select>
                    <button
                        onClick={handleBackup}
                        disabled={backupLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Database className="h-5 w-5" />
                        {backupLoading ? 'Generando...' : 'Respaldar BD'}
                    </button>
                </div>
            </div>

            {/* Fila 1 — Métricas principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div onClick={() => setShowPaymentsModal(true)} className="cursor-pointer">
                    <MetricCard
                        title="Ingresos Totales ↗"
                        value={formatCurrency(data.income.total)}
                        subtitle={`${data.income.payment_count} pagos · Ver detalle`}
                        icon={<DollarSign className="h-6 w-6" />}
                        color="green"
                    />
                </div>
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

            {/* Fila 2 — Ingresos por plan + Retención */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                                            <div className="text-xs text-text-secondary">{formatCurrency(item.average)} promedio</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-text-secondary py-8">No hay datos de ingresos</p>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow">
                    <div className="p-6 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary-600" />
                            Retención de Miembros
                        </h3>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-4 bg-success-50 rounded-lg">
                                <div className="text-3xl font-bold text-success-600">{data.retention.retention_rate}%</div>
                                <div className="text-sm text-text-secondary mt-1">Tasa de Retención</div>
                            </div>
                            <div className="text-center p-4 bg-primary-50 rounded-lg">
                                <div className="text-3xl font-bold text-primary-600">{data.retention.renewal_rate}%</div>
                                <div className="text-sm text-text-secondary mt-1">Tasa de Renovación</div>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm font-medium text-text-primary">Total de Miembros</span>
                                <span className="text-lg font-bold text-text-primary">{data.retention.total_members}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-success-50 rounded-lg">
                                <div>
                                    <div className="text-sm font-medium text-success-700">Miembros Activos</div>
                                    <div className="text-xs text-success-600">Con suscripción vigente</div>
                                </div>
                                <span className="text-lg font-bold text-success-700">{data.retention.active_members}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <div className="text-sm font-medium text-text-secondary">Miembros Inactivos</div>
                                    <div className="text-xs text-text-secondary">Sin suscripción activa</div>
                                </div>
                                <span className="text-lg font-bold text-text-secondary">{data.retention.inactive_members}</span>
                            </div>
                        </div>
                        <div className="pt-4 border-t border-gray-200">
                            <div className="text-sm text-text-secondary mb-2">En el periodo seleccionado:</div>
                            <div className="flex justify-between text-sm">
                                <span className="text-text-primary">Suscripciones vencidas:</span>
                                <span className="font-semibold">{data.retention.expired_in_period}</span>
                            </div>
                            <div className="flex justify-between text-sm mt-1">
                                <span className="text-text-primary">Miembros que renovaron:</span>
                                <span className="font-semibold text-success-600">{data.retention.renewed_count}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Fila 3 — Planes populares + Actividad reciente */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PlanMetrics planMetrics={data.plan_metrics} loading={false} />
                <RecentActivity checkins={data.recent_checkins} loading={false} />
            </div>

            {/* Fila 4 — Top 10 miembros */}
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
                                    onClick={() => handleViewMember(member.id)}
                                    className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors cursor-pointer"
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
                                            <div className="text-xs text-text-secondary">ID: {member.id}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-primary-600">{member.visit_count}</div>
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

            {/* Modales */}
            {selectedMember && (
                <MemberDetailModal member={selectedMember} onClose={() => setSelectedMember(null)} />
            )}
            {showPaymentsModal && (
                <PaymentsDetailModal
                    startDate={data.start_date}
                    endDate={data.end_date}
                    onClose={() => setShowPaymentsModal(false)}
                />
            )}
        </div>
    );
}

// MetricCard sin cambios
function MetricCard({ title, value, subtitle, icon, color }) {
    const colors = {
        green:  { bg: 'bg-success-50',  text: 'text-success-600',  value: 'text-success-700'  },
        blue:   { bg: 'bg-primary-50',  text: 'text-primary-600',  value: 'text-primary-700'  },
        purple: { bg: 'bg-purple-50',   text: 'text-purple-600',   value: 'text-purple-700'   },
        orange: { bg: 'bg-warning-50',  text: 'text-warning-600',  value: 'text-warning-700'  }
    };
    const c = colors[color] || colors.blue;
    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-text-secondary">{title}</span>
                <div className={`p-2 rounded-lg ${c.bg} ${c.text}`}>{icon}</div>
            </div>
            <div className={`text-3xl font-bold ${c.value} mb-1`}>{value}</div>
            <div className="text-sm text-text-secondary">{subtitle}</div>
        </div>
    );
}

export default Reports;