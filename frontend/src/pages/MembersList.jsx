import { useState, useEffect } from 'react';
import { Search, Eye, Edit, UserCheck, Users, UserX, UserPlus, Activity } from 'lucide-react';
import { getMembers } from '../services/api';
import MemberModal from '../components/MemberModal';
import MemberDetailModal from '../components/MemberDetailModal';
import QuickCheckInModal from '../components/QuickCheckInModal';
import { dashboardService } from '../services/dashboardService';

function MembersList() {
    const [members, setMembers] = useState([]);
    const [filteredMembers, setFilteredMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);
    const [editingMember, setEditingMember] = useState(null);
    const [checkInMember, setCheckInMember] = useState(null);
    const [notification, setNotification] = useState(null);
    const [currentInGym, setCurrentInGym] = useState(0);

    useEffect(() => {
        loadMembers();
        loadCurrentInGym();
    }, []);

    useEffect(() => {
        filterMembers();
    }, [members, searchTerm, statusFilter]);

    const loadMembers = async () => {
        try {
            setLoading(true);
            const response = await getMembers();
            setMembers(response.data);
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

    const filterMembers = () => {
        let filtered = members;

        if (statusFilter !== 'all') {
            const isActive = statusFilter === 'active';
            filtered = filtered.filter(member => member.is_active === isActive);
        }

        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            filtered = filtered.filter(member =>
                `${member.first_name} ${member.last_name_paternal} ${member.last_name_maternal || ''}`
                .toLowerCase()
                .includes(search) ||
                member.email?.toLowerCase().includes(search) ||
                member.phone?.includes(search)
            );
        }

        setFilteredMembers(filtered);
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
        }
    };

    const handleEditMember = (member) => {
        setEditingMember(member);
    };

    const activeCount = members.filter(m => m.is_active).length;
    const inactiveCount = members.filter(m => !m.is_active).length;

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

            {/* Metrics - 4 cards like Subscriptions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Members */}
                <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-secondary">Total</p>
                            <p className="text-2xl font-bold text-primary">{members.length}</p>
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
                            <p className="text-2xl font-bold text-success-600">{activeCount}</p>
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
                            <p className="text-2xl font-bold text-error-600">{inactiveCount}</p>
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
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
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
                ) : filteredMembers.length === 0 ? (
                    <div className="p-8 text-center">
                        <p className="text-secondary">No se encontraron miembros</p>
                    </div>
                ) : (
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
                                {filteredMembers.map((member, index) => (
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
                                        {/* Email */}
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            {member.email ? (
                                                <div className="text-sm text-gray-600">{member.email}</div>
                                            ) : (
                                                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                                                    Sin registrar
                                                </span>
                                            )}
                                        </td>
                                        {/* Teléfono */}
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
                        if (shouldRefresh) loadMembers();
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