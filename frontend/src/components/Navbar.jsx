import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NewMembershipModal from '../components/NewMembershipModal';

function Navbar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout, isAdmin } = useAuth();
    const [isNewMembershipModalOpen, setIsNewMembershipModalOpen] = useState(false);
    const [notification, setNotification] = useState(null);

    const isActive = (path) => location.pathname === path;

    const showNotification = (message, type) => {
        setNotification({message, type});
        setTimeout(() => setNotification(null), 3000);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <>
            {/* Notification */}
            {notification && (
                <div className={`fixed top-20 right-4 z-[60] px-6 py-4 rounded-lg shadow-2xl border-2 ${
                    notification.type === 'success' 
                        ? 'bg-green-500 border-green-600' 
                        : 'bg-red-500 border-red-600'
                } text-white font-medium min-w-[300px] transform transition-all duration-300 ease-out`}>
                    <div className="flex items-center gap-2">
                        {notification.type === 'success' ? '✓' : '✕'}
                        <span>{notification.message}</span>
                    </div>
                </div>
            )}

            <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-10">
                    <div className="flex items-center justify-between h-16">
                        
                        {/* Left: Solo Logo */}
                        <Link to="/dashboard" className="text-2xl font-bold text-text-primary">
                            FUERZA FIT
                        </Link>

                        {/* Center: Registro + Navigation */}
                        <div className="flex items-center gap-6">
                            <button
                                onClick={() => setIsNewMembershipModalOpen(true)}
                                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium text-sm"
                            >
                                Registro
                            </button>

                            <nav className="flex gap-8">
                                <Link 
                                    to="/dashboard" 
                                    className={`${
                                        isActive('/dashboard')
                                            ? 'text-text-primary font-medium'
                                            : 'text-text-secondary'
                                    } hover:text-primary-600 transition-colors`}
                                >
                                    Dashboard
                                </Link>
                                {isAdmin() && (
                                    <Link 
                                        to="/reportes"
                                        className={`${
                                            isActive('/reportes')
                                                ? 'text-text-primary font-medium'
                                                : 'text-text-secondary'
                                        } hover:text-primary-600 transition-colors`}
                                    >
                                        Reportes
                                    </Link>
                                )}
                                <Link 
                                    to="/miembros" 
                                    className={`${
                                        isActive('/miembros')
                                            ? 'text-text-primary font-medium'
                                            : 'text-text-secondary'
                                    } hover:text-primary-600 transition-colors`}
                                >
                                    Miembros
                                </Link>
                                
                                {isAdmin() && (
                                    <Link 
                                        to="/planes" 
                                        className={`${
                                            isActive('/planes')
                                                ? 'text-text-primary font-medium'
                                                : 'text-text-secondary'
                                        } hover:text-primary-600 transition-colors`}
                                    >
                                        Planes
                                    </Link>
                                )}
                                
                                <Link 
                                    to="/suscripciones"
                                    className={`${
                                        isActive('/suscripciones')
                                            ? 'text-text-primary font-medium'
                                            : 'text-text-secondary'
                                    } hover:text-primary-600 transition-colors`}
                                >
                                    Suscripciones
                                </Link>
                            </nav>
                        </div>

                        {/* Right: User Info & Logout */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
                                <User className="h-4 w-4 text-gray-600" />
                                <span className="text-sm font-medium text-gray-700">
                                    {user?.full_name}
                                </span>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-3 py-1.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Cerrar sesión"
                            >
                                <LogOut className="h-4 w-4" />
                                <span className="text-sm">Salir</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Modal */}
            {isNewMembershipModalOpen && (
                <NewMembershipModal
                    onClose={() => setIsNewMembershipModalOpen(false)}
                    onSuccess={showNotification}
                />
            )}
        </>
    );
}

export default Navbar;