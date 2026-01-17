import { useState, useEffect } from 'react';
import { Search, Eye, Edit, UserCheck, Users, UserX, UserPlus, Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import { getMembers } from '../services/api';
import MemberModal from '../components/MemberModal';
import MemberDetailModal from '../components/MemberDetailModal';
import QuickCheckInModal from '../components/QuickCheckInModal';
import { dashboardService } from '../services/dashboardService';

function MembersList() {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);
    const [editingMember, setEditingMember] = useState(null);
    const [checkInMember, setCheckInMember] = useState(null);
    const [notification, setNotification] = useState(null);
    const [currentInGym, setCurrentInGym] = useState(0);
    
    // Pagination
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 50;

    // Métricas totales (sin filtrar)
    const [metrics, setMetrics] = useState({
        total: 0,
        active: 0,
        inactive: 0
    });

    useEffect(() => {
        loadMembers();
    }, [page, statusFilter, searchTerm]);

    useEffect(() => {
        loadCurrentInGym();
        loadMetrics();
    }, []);

    const loadMetrics = async () => {
        try {
            // Obtener totales sin filtros
            const response = await getMembers({ limit: 1 });
            const totalMembers = response.data.total;
            
            // Obtener activos
            const activeResponse = await getMembers({ is_active: true, limit: 1 });
            const activeCount = activeResponse.data.total;
            
            setMetrics({
                total: totalMembers,
                active: activeCount,
                inactive: totalMembers - activeCount
            });
        } catch (error) {
            console.error('Error loading metrics:', error);
        }
    };

    const loadMembers = async () => {
        try {
            setLoading(true);
            const skip = (page - 1) * limit;
            
            const params = {
                skip,
                limit
            };
            
            if (statusFilter !== 'all') {
                params.is_active = statusFilter === 'active';
            }
            
            if (searchTerm) {
                params.search = searchTerm;
            }
            
            const response = await getMembers(params);
            setMembers(response.data.members);
            setTotal(response.data.total);
        } catch (error) {
            console.error('Error loading members:', error);
            showNotification('Error al cargar miembros', 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadCurrentInGym = async () => {
        try {
            const data = await dashboardService.getDashboardSummary({
                expiring_days: 7,
                recent_limit: 5,
                stats_days: 7
            });
            setCurrentInGym(data.metrics.current_in_gym);
        } catch (error) {
            console.error('Error loading gym status:', error);
        }
    };

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleViewMember = (member) => {
        setSelectedMember(member);
    };

    const handleCheckIn = (member) => {
        setCheckInMember(member);
    };

    const handleModalClose = (shouldRefresh) => {
        setIsModalOpen(false);
        if (shouldRefresh) {
            loadMembers();
            loadMetrics();
        }
    };

    const handleEditMember = (member) => {
        setEditingMember(member);
    };

    const handleSearchChange = (value) => {
        setSearchTerm(value);
        setPage(1);
    };

    const handleFilterChange = (value) => {
        setStatusFilter(value);
        setPage(1);
    };

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="p-6 space-y-6 bg-primary-50 min-h-screen">
            {/* Notification */}
            {notification && (
                <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
                notification.type === 'success' ? 'bg-success-500' : 'bg-error-500'
                } text-white`}>
                    {notification.message}
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-primary">Miembros</h1>
                    <p className="text-secondary mt-1">Gestión de base de miembros</p>
                </div>
            </div>

            {/* Metrics - 4 cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Members */}
                <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-secondary">Total</p>
                            <p className="text-2xl font-bold text-primary">{metrics.total}</p>
                        </div>
                        <div className="bg-primary-100 rounded-full p-3">
                            <Users className="h-6 w-6 text-primary-600" />
                        </div>
                    </div>
                </div>

                {/* Active Members */}
                <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-secondary">Activos</p>
                            <p className="text-2xl font-bold text-success-600">{metrics.active}</p>
                        </div>
                        <div className="bg-success-100 rounded-full p-3">
                            <UserPlus className="h-6 w-6 text-success-600" />
                        </div>
                    </div>
                </div>

                {/* Current In Gym */}
                <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-secondary">En el gym ahora</p>
                            <p className="text-2xl font-bold text-info-600">{currentInGym}</p>
                        </div>
                        <div className="bg-info-100 rounded-full p-3">
                            <Activity className="h-6 w-6 text-info-600" />
                        </div>
                    </div>
                </div>

                {/* Inactive Members */}
                <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-secondary">Inactivos</p>
                            <p className="text-2xl font-bold text-error-600">{metrics.inactive}</p>
                        </div>
                        <div className="bg-error-100 rounded-full p-3">
                            <UserX className="h-6 w-6 text-error-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, email o teléfono..."
                            value={searchTerm}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => handleFilterChange(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                        <option value="all">Todos los estados</option>
                        <option value="active">Activos</option>
                        <option value="inactive">Inactivos</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                        <p className="mt-4 text-secondary">Cargando miembros...</p>
                    </div>
                ) : members.length === 0 ? (
                    <div className="p-8 text-center">
                        <p className="text-secondary">No se encontraron miembros</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                            Nombre
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                            Email
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                            Teléfono
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                            Estado
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {members.map((member, index) => (
                                        <tr 
                                            key={member.id} 
                                            className={`${
                                                index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                            } hover:bg-primary-50 transition-colors`}
                                        >
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {member.first_name} {member.last_name_paternal}
                                                    {member.last_name_maternal && ` ${member.last_name_maternal}`}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                {member.email ? (
                                                    <div className="text-sm text-gray-600">{member.email}</div>
                                                ) : (
                                                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                                                        Sin registrar
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                {member.phone ? (
                                                    <div className="text-sm text-gray-600">{member.phone}</div>
                                                ) : (
                                                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                                                        Sin registrar
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs rounded-full ${
                                                    member.is_active
                                                        ? 'bg-success-100 text-success-800'
                                                        : 'bg-error-100 text-error-800'
                                                }`}>
                                                    {member.is_active ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleCheckIn(member)}
                                                        className="p-1.5 text-primary-600 hover:bg-primary-50 rounded"
                                                        title="Check-in"
                                                    >
                                                        <UserCheck className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleViewMember(member)}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                                        title="Ver detalles"
                                                    >
                                                        <Eye className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditMember(member)}
                                                        className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                                                        title="Editar"
                                                    >
                                                        <Edit className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
                                <div className="flex-1 flex justify-between sm:hidden">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Anterior
                                    </button>
                                    <button
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page >= totalPages}
                                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Siguiente
                                    </button>
                                </div>
                                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm text-gray-700">
                                            Mostrando <span className="font-medium">{(page - 1) * limit + 1}</span> a{' '}
                                            <span className="font-medium">{Math.min(page * limit, total)}</span> de{' '}
                                            <span className="font-medium">{total}</span> resultados
                                        </p>
                                    </div>
                                    <div>
                                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                            <button
                                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                                disabled={page === 1}
                                                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <ChevronLeft className="h-5 w-5" />
                                            </button>
                                            <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                                Página {page} de {totalPages}
                                            </span>
                                            <button
                                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                                disabled={page >= totalPages}
                                                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <ChevronRight className="h-5 w-5" />
                                            </button>
                                        </nav>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modals */}
            {selectedMember && (
                <MemberDetailModal
                    member={selectedMember}
                    onClose={() => setSelectedMember(null)}
                />
            )}

            {editingMember && (
                <MemberModal
                    member={editingMember}
                    onClose={(shouldRefresh) => {
                        setEditingMember(null);
                        if (shouldRefresh) {
                            loadMembers();
                            loadMetrics();
                        }
                    }}
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