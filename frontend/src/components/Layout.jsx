import Navbar from './Navbar';

function Layout({ children }) {
    return (
        <div className="min-h-screen bg-primary-50">
            <Navbar />
            <main className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-10 py-8">
                {children}
            </main>
        </div>
    );
}

export default Layout;