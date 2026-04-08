import { useEffect, useRef } from 'react';

function GenderChart({ data, loading }) {
    const canvasRef = useRef(null);

    const masculino = data?.masculino ?? 0;
    const femenino  = data?.femenino  ?? 0;
    const sinDato   = data?.sin_dato  ?? 0;
    const total     = data?.total     ?? 0;

    const pctM = total > 0 ? Math.round((masculino / total) * 100) : 0;
    const pctF = total > 0 ? Math.round((femenino  / total) * 100) : 0;
    const pctS = total > 0 ? 100 - pctM - pctF : 0;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || loading || total === 0) return;

        const ctx = canvas.getContext('2d');
        const cx  = canvas.width  / 2;
        const cy  = canvas.height / 2;
        const R   = Math.min(cx, cy) - 8;
        const r   = R * 0.58;

        const slices = [
            { value: masculino, color: '#1d4ed8', label: 'Hombres' },
            { value: femenino,  color: '#db2777', label: 'Mujeres' },
            { value: sinDato,   color: '#d1d5db', label: 'N/D'     },
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

            // inner hole
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, 2 * Math.PI);
            ctx.fillStyle = '#fff';
            ctx.fill();

            startAngle += angle;
        });

        // center text
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle    = '#1e293b';
        ctx.font         = `bold ${R * 0.38}px ui-monospace, monospace`;
        ctx.fillText(total, cx, cy - R * 0.08);
        ctx.font      = `${R * 0.18}px sans-serif`;
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('TOTAL', cx, cy + R * 0.22);
    }, [masculino, femenino, sinDato, total, loading]);

    const bars = [
        { label: 'Hombres', value: masculino, pct: pctM, color: 'bg-blue-700',  dot: 'bg-blue-700'  },
        { label: 'Mujeres', value: femenino,  pct: pctF, color: 'bg-pink-600',  dot: 'bg-pink-600'  },
        { label: 'Sin dato',value: sinDato,   pct: pctS, color: 'bg-gray-300',  dot: 'bg-gray-400'  },
    ];

    return (
        <div className="bg-white rounded-xl shadow h-full flex flex-col p-5 gap-4">
            {/* header */}
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase">Distribución</p>
                    <h3 className="text-base font-bold text-gray-800 leading-tight">Género de Miembros</h3>
                </div>
                <span className="text-xs bg-primary-50 text-primary-700 font-semibold px-2 py-1 rounded-full border border-primary-100">
                    Activos
                </span>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-pulse w-32 h-32 rounded-full bg-gray-200" />
                </div>
            ) : total === 0 ? (
                <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                    Sin datos de género registrados
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
                            b.value > 0 && (
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
                            )
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default GenderChart;