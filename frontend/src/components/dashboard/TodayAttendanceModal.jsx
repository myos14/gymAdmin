import { useState, useEffect } from 'react';
import { X, ClipboardCheck, Clock, LogIn, LogOut } from 'lucide-react';
import api from '../../services/api';

function TodayAttendanceModal({ onClose }) {
    const [attendances, setAttendances] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAttendances();
    }, []);

    const loadAttendances = async () => {
        try {
            setLoading(true);
            const res = await api.get('/attendance/today/list');
            setAttendances(res.data);
        } catch (err) {
            console.error('Error loading attendances:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '—';
        return new Date(timestamp).toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'America/Mexico_City'
        });
    };

    const formatDuration = (minutes) => {
        if (!minutes) return null;
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        if (h > 0) return `${h}h ${m}min`;
        return `${m}min`;
    };

    const stillInside = attendances.filter(a => !a.check_out_time).length;
    const completed = attendances.filter(a => a.check_out_time).length;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] flex flex-col shadow-xl">

                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary-600 flex items-center justify-center">
                            <ClipboardCheck className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-gray-900">Asistencias de Hoy</h3>
                            <p className="text-xs text-gray-400">
                                {loading ? '...' : `${attendances.length} total · ${stillInside} dentro · ${completed} salieron`}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="animate-pulse h-16 bg-gray-100 rounded-lg" />
                            ))}
                        </div>
                    ) : attendances.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <ClipboardCheck className="h-8 w-8 text-gray-300" />
                            </div>
                            <p className="text-gray-500 text-sm font-medium">Sin asistencias hoy</p>
                            <p className="text-gray-400 text-xs mt-1">Los check-ins del día aparecerán aquí</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {attendances.map((a) => {
                                const inside = !a.check_out_time;
                                return (
                                    <div
                                        key={a.id}
                                        className={`flex items-center justify-between p-3.5 rounded-xl transition-colors ${
                                            inside ? 'bg-primary-50 border border-primary-100' : 'bg-gray-50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            {/* Avatar */}
                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                                                inside ? 'bg-primary-200' : 'bg-gray-200'
                                            }`}>
                                                <span className={`font-bold text-sm ${
                                                    inside ? 'text-primary-700' : 'text-gray-600'
                                                }`}>
                                                    {a.member?.first_name?.[0]}{a.member?.last_name_paternal?.[0]}
                                                </span>
                                            </div>

                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-gray-900 truncate">
                                                    {a.member?.first_name} {a.member?.last_name_paternal}
                                                </p>
                                                {/* Times */}
                                                <div className="flex items-center gap-3 mt-0.5">
                                                    <div className="flex items-center gap-1">
                                                        <LogIn className="h-3 w-3 text-emerald-500" />
                                                        <span className="text-xs text-gray-500">
                                                            {formatTime(a.check_in_time)}
                                                        </span>
                                                    </div>
                                                    {a.check_out_time && (
                                                        <div className="flex items-center gap-1">
                                                            <LogOut className="h-3 w-3 text-gray-400" />
                                                            <span className="text-xs text-gray-500">
                                                                {formatTime(a.check_out_time)}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right side */}
                                        <div className="flex-shrink-0 text-right ml-2">
                                            {inside ? (
                                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary-600 text-white">
                                                    Dentro
                                                </span>
                                            ) : (
                                                <div className="flex items-center gap-1 text-gray-400">
                                                    <Clock className="h-3 w-3" />
                                                    <span className="text-xs font-medium">
                                                        {formatDuration(a.duration_minutes) ?? '—'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 flex justify-between items-center">
                    <div className="flex gap-3 text-xs text-gray-400">
                        <div className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-primary-600 inline-block" />
                            Dentro ahora
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-gray-300 inline-block" />
                            Ya salieron
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}

export default TodayAttendanceModal;