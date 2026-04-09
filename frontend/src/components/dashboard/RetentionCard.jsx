import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';

function RetentionCard({ loading }) {
    const [retention, setRetention] = useState(null);
    const [retLoading, setRetLoading] = useState(true);
    const canvasRef = useRef(null);

    useEffect(() => {
        setRetLoading(true);
        api.get('/reports/summary?period=month')
            .then(r => setRetention(r.data.retention))
            .catch(() => {})
            .finally(() => setRetLoading(false));
    }, [loading]);

    const activos   = retention?.active_members   ?? 0;
    const inactivos = retention?.inactive_members ?? 0;
    const total     = retention?.total_members    ?? 0;

    const pctA = total > 0 ? Math.round((activos   / total) * 100) : 0;
    const pctI = total > 0 ? 100 - pctA : 0;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || retLoading || total === 0) return;

        const ctx = canvas.getContext('2d');
        const cx  = canvas.width  / 2;
        const cy  = canvas.height / 2;
        const R   = Math.min(cx, cy) - 8;
        const r   = R * 0.58;

        const slices = [
            { value: activos,   color: '#4ade80' },
            { value: inactivos, color: '#f87171' },
        ].filter(s => s.value > 0);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        let startAngle = -Math.PI / 2;
        const gap = 0.03;

        slices.forEach(slice => {
            const angle = (slice.value / total) * 2 * Math.PI;

            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, R, startAngle + gap, startAngle + angle - gap);
            ctx.closePath();
            ctx.fillStyle = slice.color;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, 2 * Math.PI);
            ctx.fillStyle = '#fff';
            ctx.fill();

            startAngle += angle;
        });

        // centro
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle    = '#1e293b';
        ctx.font         = `bold ${R * 0.38}px ui-monospace, monospace`;
        ctx.fillText(total, cx, cy - R * 0.08);
        ctx.font      = `${R * 0.18}px sans-serif`;
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('TOTAL', cx, cy + R * 0.22);
    }, [activos, inactivos, total, retLoading]);

    const bars = [
        { label: 'Activos',   value: activos,   pct: pctA, color: 'bg-green-400', dot: 'bg-green-400' },
        { label: 'Inactivos', value: inactivos, pct: pctI, color: 'bg-red-400',   dot: 'bg-red-400'   },
    ];

    const isLoading = loading || retLoading;

    return (
        <div className="bg-white rounded-xl shadow h-full flex flex-col p-5 gap-4">
            {/* header */}
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase">Miembros</p>
                    <h3 className="text-base font-bold text-gray-800 leading-tight">Retención</h3>
                </div>
                <span className="text-xs bg-primary-50 text-primary-700 font-semibold px-2 py-1 rounded-full border border-primary-100">
                    Este mes
                </span>
            </div>

            {isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-pulse w-32 h-32 rounded-full bg-gray-200" />
                </div>
            ) : total === 0 ? (
                <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                    Sin datos de retención
                </div>
            ) : (
                <div className="flex-1 flex flex-col gap-4">
                    {/* donut */}
                    <div className="flex justify-center">
                        <canvas ref={canvasRef} width={140} height={140} />
                    </div>

                    {/* bars */}
                    <div className="space-y-2.5">
                        {bars.map(b => (
                            <div key={b.label}>
                                <div className="flex justify-between items-center mb-1">
                                    <div className="flex items-center gap-1.5">
                                        <span className={`w-2 h-2 rounded-full ${b.dot}`} />
                                        <span className="text-xs text-gray-600 font-medium">{b.label}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-gray-800">{b.value}</span>
                                        <span className="text-xs text-gray-400">{b.pct}%</span>
                                    </div>
                                </div>
                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${b.color} transition-all duration-700`}
                                        style={{ width: `${b.pct}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default RetentionCard;