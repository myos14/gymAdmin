import { useState, useEffect } from 'react';
import { Search, UserCheck, Users, UserX, UserPlus, Activity,
         ChevronLeft, ChevronRight, LayoutGrid, LayoutList, X,
         Calendar, Phone, Mail, AlertCircle, Edit, QrCode, ScanLine } from 'lucide-react';
import { getMembers } from '../services/api';
import MemberModal from '../components/MemberModal';
import QuickCheckInModal from '../components/QuickCheckInModal';
import MemberQRModal from '../components/MemberQRModal';
import QRScannerModal from '../components/QRScannerModal';
import { attendanceService } from '../services/attendanceService';
import { dashboardService } from '../services/dashboardService';

/* ─── Avatar con iniciales ─── */
function MemberAvatar({ member, size = 'md' }) {
    const initials = `${member.first_name?.[0] ?? ''}${member.last_name_paternal?.[0] ?? ''}`.toUpperCase();
    const colors = ['bg-primary-500','bg-green-500','bg-purple-500','bg-orange-500','bg-pink-500','bg-blue-500'];
    const color  = colors[member.id % colors.length];
    const sz     = size === 'lg' ? 'w-14 h-14 text-lg' : size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
    return (
        <div className={`${sz} ${color} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}>
            {initials}
        </div>
    );
}

/* ─── Drawer de detalle ─── */
function MemberDrawer({ member, onClose, onEdit, onCheckIn }) {
    const [attendanceHistory, setAttendanceHistory] = useState([]);
    const [loadingAtt, setLoadingAtt]   = useState(true);
    const [showQR, setShowQR]           = useState(false);
    const [showScanner, setShowScanner] = useState(false);

    useEffect(() => {
        if (!member) return;
        setLoadingAtt(true);
        const today     = new Date();
        const thirtyAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        attendanceService.getAttendances({
            member_id:  member.id,
            start_date: thirtyAgo.toISOString().split('T')[0],
            end_date:   today.toISOString().split('T')[0],
        }).then(setAttendanceHistory).catch(() => {}).finally(() => setLoadingAtt(false));
    }, [member?.id]);

    const fmt  = (d) => new Date(d + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
    const fmtT = (ts) => new Date(ts).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    const age  = (dob) => {
        if (!dob) return null;
        const t = new Date(), b = new Date(dob);
        let a = t.getFullYear() - b.getFullYear();
        if ((t.getMonth() - b.getMonth() || t.getDate() - b.getDate()) < 0) a--;
        return a;
    };

    return (
        <>
            {/* Overlay */}
            <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

            {/* Panel */}
            <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col animate-slide-in-right">

                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <MemberAvatar member={member} size="lg" />
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg leading-tight">
                                {member.first_name} {member.last_name_paternal} {member.last_name_maternal ?? ''}
                            </h3>
                            <p className="text-xs text-gray-400 mt-0.5">Miembro desde {fmt(member.registration_date)}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5">

                    {/* Estado */}
                    <div className="flex gap-2 flex-wrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${member.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {member.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                        {member.active_subscription && (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                Suscripción activa
                            </span>
                        )}
                    </div>

                    {/* Info personal */}
                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Información</p>
                        {[
                            { icon: Mail,     label: 'Email',    val: member.email    || 'No registrado' },
                            { icon: Phone,    label: 'Teléfono', val: member.phone    || 'No registrado' },
                            { icon: Calendar, label: 'Edad',     val: member.date_of_birth ? `${age(member.date_of_birth)} años` : 'No registrado' },
                            { icon: AlertCircle, label: 'Género', val: member.gender ? member.gender.charAt(0).toUpperCase() + member.gender.slice(1) : 'No registrado' },
                        ].map(({ icon: Icon, label, val }) => (
                            <div key={label} className="flex items-center gap-3">
                                <Icon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                <span className="text-xs text-gray-500 w-16 flex-shrink-0">{label}</span>
                                <span className="text-sm font-medium text-gray-800 truncate">{val}</span>
                            </div>
                        ))}
                    </div>

                    {/* Contacto emergencia */}
                    {(member.emergency_contact || member.emergency_phone) && (
                        <div className="bg-red-50 border border-red-100 rounded-xl p-4 space-y-2">
                            <p className="text-xs font-semibold text-red-500 uppercase tracking-wider">Contacto de emergencia</p>
                            {member.emergency_contact && <p className="text-sm font-medium text-red-900">{member.emergency_contact}</p>}
                            {member.emergency_phone   && <p className="text-sm text-red-700">{member.emergency_phone}</p>}
                        </div>
                    )}

                    {/* Asistencias */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Asistencias — últimos 30 días</p>
                            {!loadingAtt && (
                                <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
                                    {attendanceHistory.length} visitas
                                </span>
                            )}
                        </div>
                        {loadingAtt ? (
                            <div className="space-y-2">
                                {[1,2,3].map(i => <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />)}
                            </div>
                        ) : attendanceHistory.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-6 bg-gray-50 rounded-xl">Sin asistencias recientes</p>
                        ) : (
                            <div className="space-y-2">
                                {attendanceHistory.map(a => (
                                    <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                        <div>
                                            <p className="text-sm font-medium text-gray-800">{fmt(a.date)}</p>
                                            <p className="text-xs text-gray-400">
                                                {fmtT(a.check_in_time)}
                                                {a.check_out_time && ` → ${fmtT(a.check_out_time)}`}
                                            </p>
                                        </div>
                                        {a.duration_minutes && (
                                            <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
                                                {Math.floor(a.duration_minutes/60)}h {a.duration_minutes%60}m
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 flex items-center gap-2 flex-wrap sticky bottom-0 bg-white">
                    <button onClick={() => onCheckIn(member)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-xs font-medium transition">
                        <UserCheck className="h-4 w-4" /> Check-in
                    </button>
                    <button onClick={() => onEdit(member)}
                        className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-xs font-medium transition">
                        <Edit className="h-4 w-4" /> Editar
                    </button>
                    <button onClick={() => setShowQR(true)}
                        className="flex items-center gap-1.5 px-3 py-2 border border-primary-300 text-primary-700 rounded-lg hover:bg-primary-50 text-xs font-medium transition">
                        <QrCode className="h-4 w-4" /> QR
                    </button>
                    <button onClick={() => setShowScanner(true)}
                        className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-xs font-medium transition">
                        <ScanLine className="h-4 w-4" /> Escanear
                    </button>
                </div>
            </div>

            {showQR      && <MemberQRModal    member={member} onClose={() => setShowQR(false)} />}
            {showScanner && <QRScannerModal               onClose={() => setShowScanner(false)} />}
        </>
    );
}

/* ─── Card de miembro ─── */
function MemberCard({ member, onClick }) {
    return (
        <div
            onClick={() => onClick(member)}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:border-primary-200 hover:shadow-md transition cursor-pointer"
        >
            <div className="flex items-start gap-3">
                <MemberAvatar member={member} />
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">
                        {member.first_name} {member.last_name_paternal}
                    </p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">
                        {member.email || member.phone || 'Sin contacto'}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2 mt-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${member.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {member.is_active ? 'Activo' : 'Inactivo'}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${member.active_subscription ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                    {member.active_subscription ? 'Con suscripción' : 'Sin suscripción'}
                </span>
            </div>
        </div>
    );
}

/* ─── SmartStatCard (mismo estilo Dashboard) ─── */
function StatCard({ title, value, icon, color }) {
    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border hover:shadow-md transition h-full">
            <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-500 truncate">{title}</span>
                <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
            </div>
            <div className="text-2xl font-bold text-gray-800 mt-1">{value}</div>
        </div>
    );
}

/* ─── MembersList ─── */
function MembersList() {
    const [members, setMembers]         = useState([]);
    const [loading, setLoading]         = useState(true);
    const [searchTerm, setSearchTerm]   = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [viewMode, setViewMode]       = useState('table'); // 'table' | 'cards'
    const [drawerMember, setDrawerMember] = useState(null);
    const [editingMember, setEditingMember] = useState(null);
    const [checkInMember, setCheckInMember] = useState(null);
    const [notification, setNotification]   = useState(null);
    const [currentInGym, setCurrentInGym]   = useState(0);
    const [page, setPage]   = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 50;
    const [metrics, setMetrics] = useState({ total: 0, active: 0, inactive: 0 });

    useEffect(() => { loadMembers(); },   [page, statusFilter, searchTerm]);
    useEffect(() => { loadCurrentInGym(); loadMetrics(); }, []);

    const loadMetrics = async () => {
        try {
            const r  = await getMembers({ limit: 1 });
            const ra = await getMembers({ is_active: true, limit: 1 });
            setMetrics({ total: r.data.total, active: ra.data.total, inactive: r.data.total - ra.data.total });
        } catch {}
    };

    const loadMembers = async () => {
        try {
            setLoading(true);
            const params = { skip: (page-1)*limit, limit };
            if (statusFilter !== 'all') params.is_active = statusFilter === 'active';
            if (searchTerm) params.search = searchTerm;
            const res = await getMembers(params);
            setMembers(res.data.members || []);
            setTotal(res.data.total);
        } catch { showNotification('Error al cargar miembros', 'error'); }
        finally { setLoading(false); }
    };

    const loadCurrentInGym = async () => {
        try {
            const d = await dashboardService.getDashboardSummary({ expiring_days:7, recent_limit:5, stats_days:7 });
            setCurrentInGym(d.metrics.current_in_gym);
        } catch {}
    };

    const showNotification = (msg, type='success') => {
        setNotification({ message: msg, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="p-6 space-y-6 bg-primary-50 min-h-screen">

            {notification && (
                <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                    {notification.message}
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Miembros</h1>
                    <p className="text-sm text-gray-400 mt-1">Gestión de base de miembros</p>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total"         value={metrics.total}    icon={<Users    className="h-5 w-5 text-white"/>} color="bg-primary-500" />
                <StatCard title="Activos"        value={metrics.active}   icon={<UserPlus className="h-5 w-5 text-white"/>} color="bg-green-500"   />
                <StatCard title="En el gym ahora" value={currentInGym}   icon={<Activity className="h-5 w-5 text-white"/>} color="bg-blue-500"    />
                <StatCard title="Inactivos"      value={metrics.inactive} icon={<UserX   className="h-5 w-5 text-white"/>} color="bg-red-400"     />
            </div>

            {/* Filtros + toggle vista */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, email o teléfono..."
                            value={searchTerm}
                            onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 bg-white"
                    >
                        <option value="all">Todos</option>
                        <option value="active">Activos</option>
                        <option value="inactive">Inactivos</option>
                    </select>
                    {/* Toggle tabla/cards */}
                    <div className="flex border border-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                        <button
                            onClick={() => setViewMode('table')}
                            className={`px-3 py-2 transition ${viewMode === 'table' ? 'bg-primary-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                        >
                            <LayoutList className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('cards')}
                            className={`px-3 py-2 transition ${viewMode === 'cards' ? 'bg-primary-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Contenido */}
            {loading ? (
                <div className="flex items-center justify-center h-48">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
                </div>
            ) : viewMode === 'cards' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {members.map(m => <MemberCard key={m.id} member={m} onClick={setDrawerMember} />)}
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
                                <tr>
                                    {['Miembro','Email','Teléfono','Suscripción','Vence'].map(h => (
                                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {members.map(m => (
                                    <tr
                                        key={m.id}
                                        onClick={() => setDrawerMember(m)}
                                        className="hover:bg-primary-50/40 transition cursor-pointer"
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <MemberAvatar member={m} size="sm" />
                                                <span className="text-sm font-medium text-gray-900">
                                                    {m.first_name} {m.last_name_paternal}
                                                    {m.last_name_maternal && ` ${m.last_name_maternal}`}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {m.email
                                                ? <span className="text-sm text-gray-600">{m.email}</span>
                                                : <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">Sin registro</span>}
                                        </td>
                                        <td className="px-4 py-3">
                                            {m.phone
                                                ? <span className="text-sm text-gray-600">{m.phone}</span>
                                                : <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">Sin registro</span>}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${m.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {m.is_active ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {m.active_subscription?.end_date ? (
                                                (() => {
                                                    const days = Math.ceil((new Date(m.active_subscription.end_date + 'T00:00:00') - new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())) / 86400000);
                                                    return (
                                                        <span className={`text-xs font-medium ${
                                                            days <= 0  ? 'text-red-600' :
                                                            days <= 7  ? 'text-yellow-600' :
                                                            days <= 15 ? 'text-orange-500' :
                                                                        'text-gray-500'
                                                        }`}>
                                                            {days <= 0 ? 'Vencida' : `${days} días`}
                                                        </span>
                                                    );
                                                })()
                                            ) : (
                                                <span className="text-xs text-gray-300">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50 text-sm">
                            <p className="text-gray-500">
                                {(page-1)*limit+1}–{Math.min(page*limit, total)} de {total}
                            </p>
                            <div className="flex items-center gap-1">
                                <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}
                                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-40">
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <span className="px-3 py-1 text-gray-600">Pág. {page}/{totalPages}</span>
                                <button onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page>=totalPages}
                                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-40">
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Drawer */}
            {drawerMember && (
                <MemberDrawer
                    member={drawerMember}
                    onClose={() => setDrawerMember(null)}
                    onEdit={(m) => { setDrawerMember(null); setEditingMember(m); }}
                    onCheckIn={(m) => { setDrawerMember(null); setCheckInMember(m); }}
                />
            )}

            {editingMember && (
                <MemberModal
                    member={editingMember}
                    onClose={(refresh) => { setEditingMember(null); if (refresh) { loadMembers(); loadMetrics(); } }}
                    onSuccess={showNotification}
                />
            )}
            {checkInMember && (
                <QuickCheckInModal
                    member={checkInMember}
                    onClose={() => setCheckInMember(null)}
                    onSuccess={showNotification}
                />
            )}
        </div>
    );
}

export default MembersList;