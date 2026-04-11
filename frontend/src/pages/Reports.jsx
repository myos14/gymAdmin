import { useState, useEffect, useRef } from 'react';
import {
    TrendingUp, Users, DollarSign, Calendar, Activity,
    Award, Database, Target, CreditCard
} from 'lucide-react';
import { reportsService } from '../services/reportsService';
import { memberService } from '../services/memberService';
import PaymentsDetailModal from '../components/PaymentsDetailModal';
import MemberDetailModal from '../components/MemberDetailModal';
import HourlyChart from '../components/HourlyChart';
import api from '../services/api';

/* ─── Donut canvas ─── */
function RetentionDonut({ activos, inactivos, total }) {
    const canvasRef = useRef(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || total === 0) return;
        const ctx = canvas.getContext('2d');
        const cx = canvas.width / 2, cy = canvas.height / 2;
        const R = Math.min(cx, cy) - 4, r = R * 0.62;
        const slices = [
            { value: activos,   color: '#22c55e' },
            { value: inactivos, color: '#f87171' },
        ].filter(s => s.value > 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let start = -Math.PI / 2;
        slices.forEach(s => {
            const angle = (s.value / total) * 2 * Math.PI;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, R, start + 0.04, start + angle - 0.04);
            ctx.closePath();
            ctx.fillStyle = s.color;
            ctx.fill();
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, 2 * Math.PI);
            ctx.fillStyle = '#fff';
            ctx.fill();
            start += angle;
        });
        const pct = total > 0 ? Math.round((activos / total) * 100) : 0;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = '#1e293b';
        ctx.font = `bold ${R * 0.42}px ui-monospace, monospace`;
        ctx.fillText(`${pct}%`, cx, cy - R * 0.08);
        ctx.font = `${R * 0.2}px sans-serif`;
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('activos', cx, cy + R * 0.28);
    }, [activos, inactivos, total]);
    return <canvas ref={canvasRef} width={100} height={100} />;
}

/* ─── KPI Card ─── */
function KpiCard({ title, value, sub, icon, color, clickable, onClick, loading }) {
    return (
        <div
            onClick={onClick}
            className={`bg-white p-5 rounded-xl shadow-sm border transition group h-full ${
                clickable ? 'cursor-pointer hover:shadow-md hover:border-primary-200' : 'hover:shadow-md'
            }`}
        >
            <div className="flex justify-between items-start mb-3">
                <div className={`p-2.5 rounded-xl ${color}`}>{icon}</div>
                {clickable && (
                    <span className="text-[10px] text-gray-300 group-hover:text-primary-400 transition font-medium mt-1">
                        Ver →
                    </span>
                )}
            </div>
            {loading ? (
                <div className="animate-pulse space-y-2">
                    <div className="h-8 w-24 bg-gray-200 rounded" />
                    <div className="h-3 w-16 bg-gray-100 rounded" />
                </div>
            ) : (
                <>
                    <div className="text-2xl font-bold text-gray-800">{value}</div>
                    {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
                </>
            )}
        </div>
    );
}

/* ─── Reports ─── */
function Reports() {
    const [period, setPeriod]   = useState('month');
    const [data, setData]       = useState(null);
    const [loading, setLoading] = useState(true);
    const [backupLoading, setBackupLoading] = useState(false);
    const [showPaymentsModal, setShowPaymentsModal] = useState(false);
    const [selectedMember, setSelectedMember]       = useState(null);

    useEffect(() => { loadReports(); }, [period]);

    const loadReports = async () => {
        setLoading(true);
        try { setData(await reportsService.getReports(period)); }
        catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleBackup = async () => {
        try {
            setBackupLoading(true);
            const res = await api.get('/backup/database', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement('a');
            a.href = url;
            a.setAttribute('download', `fuerzafit_backup_${new Date().toISOString().split('T')[0]}.sql`);
            document.body.appendChild(a); a.click(); a.remove();
            window.URL.revokeObjectURL(url);
            alert('Respaldo generado exitosamente');
        } catch { alert('Error al generar respaldo'); }
        finally { setBackupLoading(false); }
    };

    const handleViewMember = async (id) => {
        try { setSelectedMember(await memberService.getMember(id)); }
        catch (e) { console.error(e); }
    };

    const fmt  = (n) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(n);
    const fmtD = (s) => new Date(s).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
    const formatTime = (ts) => new Date(ts).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Mexico_City' });

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto" />
                <p className="mt-4 text-gray-400 text-sm">Cargando reportes...</p>
            </div>
        </div>
    );

    if (!data) return <div className="text-center py-8 text-gray-400">Sin datos disponibles</div>;

    const ret = data.retention;
    const pctA = ret.total_members > 0 ? Math.round((ret.active_members / ret.total_members) * 100) : 0;
    const maxPlan = Math.max(...(data.income.by_plan.map(p => p.total)), 1);
    const planColors = ['bg-primary-600', 'bg-primary-400', 'bg-green-500', 'bg-primary-800', 'bg-green-400'];

    const statusConfig = {
        active:        { label: 'Activo',     cls: 'bg-green-100 text-green-700'  },
        expiring_soon: { label: 'Por vencer', cls: 'bg-yellow-100 text-yellow-700' },
        expired:       { label: 'Vencido',    cls: 'bg-red-100 text-red-700'      },
    };

    return (
        <div className="p-6 md:p-8 space-y-6 bg-primary-50 min-h-screen">

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Reportes y Análisis</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        {fmtD(data.start_date)} — {fmtD(data.end_date)}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={period}
                        onChange={e => setPeriod(e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 bg-white shadow-sm"
                    >
                        <option value="week">Última semana</option>
                        <option value="month">Último mes</option>
                        <option value="year">Último año</option>
                    </select>
                    <button
                        onClick={handleBackup} disabled={backupLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-700 text-white rounded-lg hover:bg-primary-800 transition text-sm font-medium disabled:opacity-50"
                    >
                        <Database className="h-4 w-4" />
                        {backupLoading ? 'Generando...' : 'Respaldar BD'}
                    </button>
                </div>
            </div>

            {/* ── Fila 1: KPIs ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                    title="Ingresos Totales"
                    value={fmt(data.income.total)}
                    sub={`${data.income.payment_count} pagos`}
                    icon={<DollarSign className="h-5 w-5 text-white" />}
                    color="bg-green-600" loading={loading} clickable
                    onClick={() => setShowPaymentsModal(true)}
                />
                <KpiCard
                    title="Nuevos Miembros"
                    value={data.members.new_count}
                    sub="registrados en el periodo"
                    icon={<Users className="h-5 w-5 text-white" />}
                    color="bg-primary-500" loading={loading}
                />
                <KpiCard
                    title="Total Asistencias"
                    value={data.attendance.total}
                    sub="check-ins en el periodo"
                    icon={<Activity className="h-5 w-5 text-white" />}
                    color="bg-primary-700" loading={loading}
                />
                <KpiCard
                    title="Promedio Diario"
                    value={`${data.attendance.daily_avg}`}
                    sub="personas por día"
                    icon={<Calendar className="h-5 w-5 text-white" />}
                    color="bg-primary-800" loading={loading}
                />
            </div>

            {/* ── Fila 2: Ingresos por plan + Retención ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Ingresos por plan */}
                <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="p-1.5 bg-green-100 rounded-lg">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                        </div>
                        <h3 className="font-bold text-gray-800">Ingresos por Plan</h3>
                    </div>
                    {data.income.by_plan.length === 0 ? (
                        <p className="text-center text-gray-400 py-8 text-sm">Sin datos en este periodo</p>
                    ) : (
                        <div className="space-y-4">
                            {data.income.by_plan.map((item, i) => {
                                const pct = Math.round((item.total / maxPlan) * 100);
                                return (
                                    <div key={i} className="space-y-1.5">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${planColors[i % planColors.length]} inline-block`} />
                                                <span className="text-sm font-semibold text-gray-700">{item.plan_name}</span>
                                                <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                                                    {item.count} ventas
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-sm font-bold text-gray-800">{fmt(item.total)}</span>
                                                <span className="text-xs text-gray-400 ml-1.5">· {fmt(item.average)} avg</span>
                                            </div>
                                        </div>
                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${planColors[i % planColors.length]} transition-all duration-700`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <HourlyChart data={data.attendance.hourly_distribution} />

                {/* Retención */}
                <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="p-1.5 bg-primary-100 rounded-lg">
                            <Target className="h-4 w-4 text-primary-600" />
                        </div>
                        <h3 className="font-bold text-gray-800">Retención de Miembros</h3>
                    </div>

                    {/* Donut centrado y más grande */}
                    <div className="flex justify-center">
                        <RetentionDonut
                            activos={ret.active_members}
                            inactivos={ret.inactive_members}
                            total={ret.total_members}
                        />
                    </div>

                    {/* Leyenda compacta */}
                    <div className="flex justify-center gap-6">
                        <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-green-400 flex-shrink-0" />
                            <span className="text-xs text-gray-600">Activos <strong>{ret.active_members}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-400 flex-shrink-0" />
                            <span className="text-xs text-gray-600">Inactivos <strong>{ret.inactive_members}</strong></span>
                        </div>
                    </div>

                    {/* Tasas + stats */}
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                        <div className="p-3 bg-green-50 rounded-xl text-center">
                            <div className="text-2xl font-bold text-green-600">{ret.retention_rate}%</div>
                            <div className="text-xs text-gray-500 mt-0.5">Tasa de Retención</div>
                        </div>
                        <div className="p-3 bg-primary-50 rounded-xl text-center">
                            <div className="text-2xl font-bold text-primary-600">{ret.renewal_rate}%</div>
                            <div className="text-xs text-gray-500 mt-0.5">Tasa de Renovación</div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-xl text-center">
                            <div className="text-xl font-bold text-gray-600">{ret.expired_in_period}</div>
                            <div className="text-xs text-gray-400 mt-0.5">Vencidas en periodo</div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-xl text-center">
                            <div className="text-xl font-bold text-green-600">{ret.renewed_count}</div>
                            <div className="text-xs text-gray-400 mt-0.5">Renovaron</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Fila 3: Top 10 + Actividad reciente + Planes populares ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Top 10 miembros */}
                <div className="bg-white rounded-xl shadow-sm p-6 lg:col-span-1">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-1.5 bg-yellow-100 rounded-lg">
                            <Award className="h-4 w-4 text-yellow-600" />
                        </div>
                        <h3 className="font-bold text-gray-800">Top Miembros</h3>
                    </div>
                    {data.attendance.top_members.length === 0 ? (
                        <p className="text-center text-gray-400 py-8 text-sm">Sin datos</p>
                    ) : (
                        <div className="space-y-2">
                            {data.attendance.top_members.slice(0, 7).map((member, i) => (
                                <div
                                    key={member.id}
                                    onClick={() => handleViewMember(member.id)}
                                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-primary-50 transition cursor-pointer group"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                            i === 0 ? 'bg-yellow-100 text-yellow-700' :
                                            i === 1 ? 'bg-gray-100 text-gray-600' :
                                            i === 2 ? 'bg-orange-100 text-orange-600' :
                                            'bg-primary-50 text-primary-600'
                                        }`}>
                                            {i + 1}
                                        </div>
                                        <span className="text-sm font-medium text-gray-700 group-hover:text-primary-700 truncate max-w-[120px]">
                                            {member.full_name}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        <span className="text-lg font-bold text-primary-600">{member.visit_count}</span>
                                        <span className="text-xs text-gray-400">vis.</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Actividad reciente */}
                <div className="bg-white rounded-xl shadow-sm p-6 lg:col-span-1">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-1.5 bg-primary-100 rounded-lg">
                            <Activity className="h-4 w-4 text-primary-600" />
                        </div>
                        <h3 className="font-bold text-gray-800">Actividad Reciente</h3>
                    </div>
                    {data.recent_checkins.length === 0 ? (
                        <p className="text-center text-gray-400 py-8 text-sm">Sin asistencias</p>
                    ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {data.recent_checkins.map((c) => {
                                const s = statusConfig[c.subscription_status] || statusConfig.active;
                                return (
                                    <div key={c.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-gray-800 truncate">
                                                {c.member.first_name} {c.member.last_name_paternal}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                {formatTime(c.check_in_time)}
                                            </p>
                                        </div>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ml-2 ${s.cls}`}>
                                            {s.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Planes populares */}
                <div className="bg-white rounded-xl shadow-sm p-6 lg:col-span-1">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-1.5 bg-primary-100 rounded-lg">
                            <CreditCard className="h-4 w-4 text-primary-600" />
                        </div>
                        <h3 className="font-bold text-gray-800">Planes Populares</h3>
                    </div>
                    {data.plan_metrics.length === 0 ? (
                        <p className="text-center text-gray-400 py-8 text-sm">Sin datos</p>
                    ) : (
                        <div className="space-y-3">
                            {data.plan_metrics.slice(0, 6).map((plan, i) => {
                                const maxSubs = Math.max(...data.plan_metrics.map(p => p.active_subscriptions), 1);
                                const pct = Math.round((plan.active_subscriptions / maxSubs) * 100);
                                return (
                                    <div key={plan.plan_id} className="space-y-1">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${planColors[i % planColors.length]} flex-shrink-0`} />
                                                <span className="text-sm font-medium text-gray-700 truncate max-w-[130px]">
                                                    {plan.plan_name}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                <span className="text-sm font-bold text-gray-800">{plan.active_subscriptions}</span>
                                                <span className="text-xs text-gray-400">activas</span>
                                            </div>
                                        </div>
                                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${planColors[i % planColors.length]} transition-all duration-700`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Modales ── */}
            {selectedMember && (
                <MemberDetailModal member={selectedMember} onClose={() => setSelectedMember(null)} />
            )}
            {showPaymentsModal && (
                <PaymentsDetailModal
                    startDate={data.start_date} endDate={data.end_date}
                    onClose={() => setShowPaymentsModal(false)}
                />
            )}
        </div>
    );
}

export default Reports;