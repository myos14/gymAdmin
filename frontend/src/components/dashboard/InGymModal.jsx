import { useState, useEffect } from 'react';
import { X, UserCheck, Clock, LogOut } from 'lucide-react';
import api from '../../services/api';

function InGymModal({ onClose }) {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [checkingOut, setCheckingOut] = useState(null);

    useEffect(() => {
        loadSessions();
    }, []);

    const loadSessions = async () => {
        try {
            setLoading(true);
            const res = await api.get('/attendance/current/in-gym');
            setSessions(res.data);
        } catch (err) {
            console.error('Error loading sessions:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckOut = async (attendanceId) => {
        setCheckingOut(attendanceId);
        try {
            await api.put(`/attendance/${attendanceId}/check-out`, { notes: '' });
            await loadSessions();
        } catch (err) {
            console.error('Error checking out:', err);
        } finally {
            setCheckingOut(null);
        }
    };

    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'America/Mexico_City'
        });
    };

    const getElapsedTime = (checkInTime) => {
        const now = new Date();
        const checkIn = new Date(checkInTime);
        const diffMs = now - checkIn;
        const diffMins = Math.floor(diffMs / 60000);
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        if (hours > 0) return `${hours}h ${mins}min`;
        return `${mins}min`;
    };

    const getElapsedColor = (checkInTime) => {
        const now = new Date();
        const checkIn = new Date(checkInTime);
        const diffMins = Math.floor((now - checkIn) / 60000);
        if (diffMins >= 180) return 'text-red-600 bg-red-50';
        if (diffMins >= 90) return 'text-orange-600 bg-orange-50';
        return 'text-emerald-700 bg-emerald-50';
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] flex flex-col shadow-xl">

                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary-700 flex items-center justify-center">
                            <UserCheck className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-gray-900">En el Gym ahora</h3>
                            <p className="text-xs text-gray-400">
                                {loading ? '...' : `${sessions.length} persona${sessions.length !== 1 ? 's' : ''} dentro`}
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
                            {[1, 2, 3].map(i => (
                                <div key={i} className="animate-pulse h-16 bg-gray-100 rounded-lg" />
                            ))}
                        </div>
                    ) : sessions.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <UserCheck className="h-8 w-8 text-gray-300" />
                            </div>
                            <p className="text-gray-500 text-sm font-medium">Nadie en el gym por ahora</p>
                            <p className="text-gray-400 text-xs mt-1">Los check-ins aparecerán aquí</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {sessions.map((session) => (
                                <div
                                    key={session.id}
                                    className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl hover:bg-primary-50 transition-colors"
                                >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        {/* Avatar */}
                                        <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                                            <span className="text-primary-700 font-bold text-sm">
                                                {session.member?.first_name?.[0]}{session.member?.last_name_paternal?.[0]}
                                            </span>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 truncate">
                                                {session.member?.first_name} {session.member?.last_name_paternal}
                                            </p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <Clock className="h-3 w-3 text-gray-400" />
                                                <span className="text-xs text-gray-400">
                                                    Entró {formatTime(session.check_in_time)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {/* Elapsed badge */}
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getElapsedColor(session.check_in_time)}`}>
                                            {getElapsedTime(session.check_in_time)}
                                        </span>

                                        {/* Checkout button */}
                                        <button
                                            onClick={() => handleCheckOut(session.id)}
                                            disabled={checkingOut === session.id}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                            title="Registrar salida"
                                        >
                                            {checkingOut === session.id
                                                ? <div className="w-4 h-4 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin" />
                                                : <LogOut className="h-4 w-4" />
                                            }
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 flex justify-between items-center">
                    <button
                        onClick={loadSessions}
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                    >
                        Actualizar
                    </button>
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

export default InGymModal;