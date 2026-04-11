import { Gift, Phone } from 'lucide-react';
import InfoCard from '../../components/common/InfoCard';

function UpcomingBirthdays({ birthdays = [], loading }) {

    const handleWhatsApp = (phone, name) => {
        if (!phone) return;
        const cleaned = phone.replace(/\D/g, '');
        const full = cleaned.startsWith('52') ? cleaned : `52${cleaned}`;
        const msg = `¡Hola ${name}!
En *Fuerza Fit* te deseamos un feliz cumpleaños. ¡Que disfrutes mucho tu día! 💪

Como regalo, hoy tienes *10% de descuento* en cualquier suscripción.`;
        window.open(`https://wa.me/${full}?text=${encodeURIComponent(msg)}`, '_blank');
    };

    const getBadge = (days) => {
        if (days === 0) return { label: '¡Hoy!', cls: 'bg-blue-600/10 text-blue-700 border border-blue-600/20' };
        if (days === 1) return { label: 'Mañana', cls: 'bg-blue-500/5 text-blue-600 border border-blue-600/10' };
        return { label: `En ${days} días`, cls: 'bg-blue-400/5 text-blue-500 border border-blue-600/10' };
    };

    if (loading) {
        return (
            <InfoCard 
                title="Próximos cumpleaños"
                subtitle="Siguientes 5 días"
            >
                <div className="animate-pulse space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-12 bg-gray-200 rounded"></div>
                    ))}
                </div>
            </InfoCard>
        );
    }
    return (
        <InfoCard 
            title="Próximos cumpleaños"
            subtitle="Sigueintes 5 días"
        >
            {birthdays.length === 0 ? (
                <p className="text-center text-gray-500 text-sm py-6">
                    No hay cumpleaños en los próximos 5 días
                </p>
            ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {birthdays.map((b) => {
                        const badge = getBadge(b.days_until);
                        return (
                            <div 
                                key={b.id} 
                                className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors"
                            >
                                <div>
                                    <p className="text-sm font-medium text-gray-900">
                                        {b.full_name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Cumple {b.age_turning} años
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {b.days_until === 0 && (
                                        b.phone ? (
                                            <button
                                                onClick={() => handleWhatsApp(b.phone, b.full_name)}
                                                title="Enviar felicitación por WhatsApp"
                                                className="p-1.5 text-green-500 hover:bg-green-50 rounded-md transition-colors"
                                            >
                                                <Phone className="h-4 w-4" />
                                            </button>
                                        ) : (
                                            <span className="text-xs text-gray-400 italic">Sin tel. </span>
                                        )
                                    )}
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.cls}`}>
                                        {badge.label}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </InfoCard>
    );
}

export default UpcomingBirthdays;