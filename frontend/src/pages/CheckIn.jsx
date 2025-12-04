import { useState, useEffect } from 'react';
import { Search, UserCheck, Clock, Users, AlertCircle, CheckCircle } from 'lucide-react';
import { attendanceService } from '../services/attendanceService';
import { memberService } from '../services/memberService';

function CheckIn() {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [currentInGym, setCurrentInGym] = useState([]);
    const [dailyStats, setDailyStats] = useState(null);
    const [notification, setNotification] = useState(null);
    const [loading, setLoading] = useState(false);

    // Load initial data
    useEffect(() => {
        loadCurrentInGym();
        loadDailyStats();
    }, []);

    const loadCurrentInGym = async () => {
        try {
            const data = await attendanceService.getCurrentInGym();
            setCurrentInGym(data);
        } catch (error) {
            console.error('Error loading current members: ', error);
        }
    };

    const loadDailyStats = async () => {
        try {
            const data = await attendanceService.getDailyStats();
            setDailyStats(data);
        } catch (error) {
            console.error('Error loading stats: ', error);
        }
    };

    const handleSearch = async (query) => {
        setSearchQuery(query);

        if(query.length < 2) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const results = await memberService.searchMembers(query);
            setSearchResults(results);
        } catch (error) {
            console.error('Error searching members:', error);
            showNotification('Error al buscar miembros', 'error');
        } finally {
            setIsSearching(false);
        }
    };

    const handleCheckIn = async (memberId) => {
        setLoading(true);
        try {
            await attendanceService.checkIn(memberId);
            showNotification('Check-in registrado exitosamente', 'success');
            setSearchQuery('');
            setSearchResults([]);
            loadCurrentInGym();
            loadDailyStats();
        } catch (error) {
            const errorMsg = error.response?.data?.detail || 'Error al registrar check-in';
            showNotification(errorMsg, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCheckOut = async (attendanceId) => {
        setLoading(true);
        try {
            await attendanceService.checkOut(attendanceId);
            showNotification('Check-out registrado exitosamente', 'success');
            loadCurrentInGym();
            loadDailyStats();
        } catch (error) { 
            const errorMsg = error.response?.data?.detail || 'Error al registrar el check-out';
            showNotification(errorMsg, 'error');
        } finally {
            setLoading(false);
        }
    };
    
    const showNotification = (message, type) => {
        setNotification({ message, type});
        setTimeout(() => setNotification(null), 3000);
    };

    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Notification */}
            {notification && (
                <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${
                    notification.type === 'success'
                        ? 'bg-green-500 text-white'
                        : 'bg-red-500 text-white'
                }`}>
                    {notification.type === 'success' ? (
                        <CheckCircle className="h-5 w-5" />
                        ) : (
                        <AlertCircle className="h-5 w-5" />
                    )}
                    <span>{notification.message}</span>
                </div>
            )}

            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-text-primary mb-2">Check-in</h1>
                <p className="text-text-secondary">Registra la entrada y salida de los miembros</p>
            </div>

            {/* Stats cards */}
            {dailyStats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-text-secondary uppercase tracking-wide">En el gym ahora</p>
                                <p className="text-3xl font-bold text-primary-700 mt-2">
                                    {dailyStats.current_members_in_gym}
                                </p>
                            </div>
                            <UserCheck className="h-10 w-10 text-primary-600 opacity-80" />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-text-secondary uppercase tracking-wide">Miembros únicos</p>
                                <p className="text-3xl font-bold text-primary-700 mt-2">
                                    {dailyStats.unique_members}
                                </p>
                            </div>
                            <Clock className="h-10 w-10 text-primary-600 opacity-80" />
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Search Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-semibold text-text-primary mb-4">Buscar Miembros</h2>

                    {/* Search input */}
                    <div className="relative mb-4">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Buscar por nombre, email o teléfono"
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                    </div>

                    {/* Search results */}
                    {searchResults.length > 0 && (
                        <div className="space-y-2">
                            {searchResults.map((member) => (
                                <div
                                key={member.id}
                                className="flex items-center justify-between p-3 bg-background hover:bg-background-hover rounded-lg border border-gray-200 transition-colors"
                                >
                                    <div className="flex-1">
                                        <p className="font-medium text-text-primary">
                                            {member.first_name} {member.last_name_paternal}
                                        </p>
                                        <p className="text-sm text-text-secondary">{member.email}</p>
                                        {member.phone && (
                                            <p className="text-xs text-text-muted mt-1">{member.phone}</p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleCheckIn(member.id)}
                                        disabled={loading}
                                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Check-in
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {isSearching && (
                        <div className="text-center py-8 text-text-secondary">
                            Buscando...
                        </div>
                    )}

                    {searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
                        <div className="text-center py-8 text-text-secondary">
                            No se encontraron resultados
                        </div>
                    )}
                </div>

                {/* Current in gym section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-semibold text-text-primary mb-4">
                        En el Gym Ahora ({currentInGym.length})
                    </h2>

                    <div className="space-y-3 max-h-[500px] overflow-y-auto">
                        {currentInGym.length === 0 ? (
                            <div className="text-center py-8 text-text-secondary">
                                No hay miembros en el gym
                            </div>
                        ) : (
                            currentInGym.map((attendance) => (
                                <div
                                    key={attendance.id}
                                    className="flex items-center justify-between p-3 bg-background rounded-lg border border-gray-200"
                                >
                                    <div className="flex-1">
                                        <p className="font-medium text-text-primary">
                                            {attendance.member.first_name} {attendance.member.last_name_paternal}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Clock className="h-4 w-4 text-text-muted" />
                                            <p className="text-sm text-text-secondary">
                                                Entrada: {formatTime(attendance.check_in_time)}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleCheckOut(attendance.id)}
                                        disabled={loading}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Check-out
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CheckIn;