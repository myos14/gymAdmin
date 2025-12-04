import { Link, useLocation } from 'react-router-dom';

function Navbar() {
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    return (
        <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <Link to="/" className="text-2xl font-bold text-text-primary">
                        FUERZA FIT
                    </Link>
                    <nav className="flex gap-8">
                        <Link to="/" className={`${isActive('/')
                                ? 'text-text-primary font-medium'
                                : 'text-text-secondary'
                            } hover:text-primary-600 transition-colors`}
                        >
                            Dashboard
                        </Link>
                        <Link to="/checkin" className={`${isActive('/checkin')
                                ? 'text-text-primary font-medium'
                                : 'text-text-secondary'
                            } hover:text-primary-600 transition-colors`}
                        >
                            Check-in
                        </Link>
                        <Link to="/members" className={`${isActive('/members')
                                ? 'text-text-primary font-medium'
                                : 'text-text-secondary'
                            } hover:text-primary-600 transition-colors`}
                        >
                            Clientes
                        </Link>
                    </nav>
                </div>
            </div>
        </header>
    );
}

export default Navbar;