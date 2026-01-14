const StatsCard = ({ title, value, subtitle, icon: Icon, color = 'bg-primary-600' }) => {
    return (
        <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-sm text-secondary mb-1">{title}</p>
                    <p className="text-2xl font-bold text-primary">{value}</p>
                    {subtitle && (
                        <p className="text-xs text-muted mt-1">{subtitle}</p>
                    )}
                </div>
                {Icon && (
                <div className={`${color} rounded-full p-3`}>
                    <Icon className="h-6 w-6 text-white" />
                </div>
                )}
            </div>
        </div>
    );
};

export default StatsCard;