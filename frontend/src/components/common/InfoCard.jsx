const InfoCard = ({ title, subtitle, children, rightContent }) => {
    return (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 flex flex-col h-full">
            
            {/* HEADER */}
            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
                
                <h2 className="text-lg font-semibold text-gray-900">
                    {title}
                </h2>

                {rightContent ? (
                    rightContent
                ) : (
                    subtitle && (
                        <span className="text-sm text-gray-400">
                            {subtitle}
                        </span>
                    )
                )}

            </div>

            {/* CONTENT */}
            <div className="p-5 flex-1 overflow-hidden">
                {children}
            </div>

        </div>
    );
};

export default InfoCard;