import { useState, useEffect } from 'react';
import { X, Calendar, Phone, Mail, AlertCircle, Activity, Edit } from 'lucide-react';
import { attendanceService } from '../services/attendanceService';

function MemberDetailModal({ member, onClose }) {
    const [attendanceHistory, setAttendanceHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAttendanceHistory();
    }, []);

    const loadAttendanceHistory = async () => {
        try {
            setLoading(true);
            const today = new Date();
            const thirtyDaysAgo = new Date(today.getTime() -30 * 24 * 60 * 60 * 1000);

            const data = await attendanceService.getAttendances({
                member_id: member.id,
                start_date: thirtyDaysAgo.toISOString().split('T')[0],
                end_date: today.toISOString().split('T')[0]
            });

            setAttendanceHistory(data);
        } catch (error) {
            console.error('Error loading attendance history:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const calculateAge = (birthDate) => {
        if (!birthDate) return null;
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 ||  (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                    <div>
                        <h3 className="text-2xl font-bold text-text-primary">
                            {member.first_name} {member.last_name_paternal} {member.last_name_maternal}
                        </h3>
                        <p className="text-sm text-text-secondary mt-1">
                            Miembro desde {formatDate(member.registration_date)}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Status Badge */}
                    <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            member.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                        }`}>
                            {member.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                    </div>

                    {/* Member Info */}
                    <div>
                        <h4 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            Información Personal
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                            <div>
                                <p className="text-sm text-text-secondary">Email</p>
                                <p className="font-medium text-text-primary flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    {member.email || 'No registrado'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-text-secondary">Teléfono</p>
                                <p className="font-medium text-text-primary flex items-center gap-2">
                                    <Phone className="h-4 w-4" />
                                    {member.phone || 'No registrado'}
                                </p>
                            </div>
                            {member.date_of_birth && (
                                <div>
                                    <p className="text-sm text-text-secondary">Fecha de Nacimiento</p>
                                    <p className="font-medium text-text-primary flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        {formatDate(member.date_of_birth)} ({calculateAge(member.date_of_birth)} años)
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Emergency contact */}
                    {(member.emergency_contact || member.emergency_phone) && (
                        <div>
                            <h4 className="text-lg font-semibold text-text-primary mb-4">
                                Contacto de Emergencia
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-red-50 p-4 rounded-lg border border-red-200">
                                {member.emergency_contact && (
                                    <div>
                                        <p className="text-sm text-red-700">Nombre</p>
                                        <p className="font-medium text-red-900">{member.emergency_contact}</p>
                                    </div>
                                )}
                                {member.emergency_phone && (
                                    <div>
                                        <p className="text-sm text-red-700">Teléfono</p>
                                        <p className="font-medium text-red-900">{member.emergency_phone}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Attendance history */}
                    <div>
                        <h4 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                            <Activity className="h-5 w-5" />
                            Asistencias (Últimos 30 días)
                        </h4>

                        {loading ? (
                            <div className="text-center py-8 text-text-secondary">
                                Cargando historial...
                            </div>
                        ) : attendanceHistory.length === 0 ? (
                            <div className="text-center py-8 text-text-secondary bg-gray-50 rounded-lg">
                                No se encontraron asistencias en los últimos 30 días
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {attendanceHistory.map((attendance) => (
                                    <div
                                        key={attendance.id}
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                    >
                                        <div>
                                            <p className="font-medium text-text-primary">
                                                {formatDate(attendance.date)}
                                            </p>
                                            <p className="text-sm text-text-secondary">
                                                Entrada: {formatTime(attendance.check_in_time)}
                                                {attendance.check_out_time && (
                                                    <> • Salida: {formatTime(attendance.check_out_time)}</>
                                                )}
                                            </p>
                                        </div>
                                        {attendance.duration_minutes && (
                                            <div className="text-right">
                                                <p className="text-sm font-medium text-primary-700">
                                                    {Math.floor(attendance.duration_minutes / 60)}h {attendance.duration_minutes % 60}min
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {attendanceHistory.length > 0 && (
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <p className="text-sm text-blue-900">
                                    <strong>Total de visitas:</strong> {attendanceHistory.length} en los últimos 30 días
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t border-gray-200 sticky bottom-0 bg-white">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}

export default MemberDetailModal;