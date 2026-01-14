import Navbar from './Navbar';

function Layout({ children }) {
    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main>
                {children}
            </main>
        </div>
    );
}

export default Layout;