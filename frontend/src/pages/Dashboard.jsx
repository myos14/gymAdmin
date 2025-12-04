import { useState, useEffect } from 'react';
import { Users, Activity, CreditCard, UserCheck } from 'lucide-react';
import { attendanceService } from '../services/attendanceService';
import {memberService } from '../services/memberService';

function Dashboard() {
    const [stats, setStats] = useState({
        currentInGym: 0,
        totalToday: 0,
        uniqueToday: 0,
        totalMembers: 0,
        activeSubscriptions: 0
    });

    useEffect(() => {
        loadStats();
        // Refresh every 30 sec
        const interval = setInterval(loadStats, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadStats = async () => {
        try {
            const [dailyStats, currentInGym, members] = await Promise.all([
                attendanceService.getDailyStats(),
                attendanceService.getCurrentInGym(),
                memberService.getAllMembers()
            ]);

            setStats({
                currentInGym: currentInGym.length,
                totalToday: dailyStats.total_visits,
                uniqueToday: dailyStats.unique_members,
                totalMembers: members.length,
                activeSubscriptions: members.filter(m => m.membership_status === 'active').length
            });
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    const statsCards = [
        {
            title: 'EN EL GYM AHORA',
            value: stats.currentInGym,
            subtitle: null,
            icon: Activity,
            bgColor: 'bg-primary-600',
        },
        {
            title:'ASISTENCIAS HOY',
            value: stats.totalToday,
            subtitle: `${stats.uniqueToday} clientes únicos`,
            icon: UserCheck,
            bgColor: 'bg-primary-700'
        },
        {
            title:'CLIENTES TOTALES',
            value: stats.totalMembers,
            subtitle: null,
            icon: Users,
            bgColor: 'bg-primary-800'
        },
        {
            title:'SUSCRIPCIONES ACTIVAS',
            value: stats.activeSubscriptions,
            subtitle: null,
            icon: CreditCard,
            bgColor: 'bg-primary-900'
        },
    ];

    return (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h2 className="text-3xl font-bold text-text-primary mb-8">Dashboard</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statsCards.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={index}
                            className={`${stat.bgColor} rounded-lg shadow-md p-6 text-white hover:shadow-lg transition-shadow`}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-medium uppercase tracking-wide opacity-90">
                                        {stat.title}
                                    </h3>
                                    <Icon className="h-6 w-6 opacity-80" />
                                </div>
                                <p className="text-4xl font-bold mb-1">{stat.value}</p>
                                {stat.subtitle && (
                                    <p className="text-sm opacity-75">{stat.subtitle}</p>
                                )}
                            </div>
                    );
                })}
            </div>
        </main>
    );
}

export default Dashboard;