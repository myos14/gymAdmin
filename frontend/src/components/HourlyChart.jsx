import { useRef, useEffect } from 'react';
import { Activity } from 'lucide-react';

function HourlyChart({ data }) {
    const amRef = useRef(null);
    const pmRef = useRef(null);

    const drawChart = (canvas, hours) => {
        if (!canvas || !hours.length) return;
        const ctx = canvas.getContext('2d');
        const W = canvas.width, H = canvas.height;
        const padL = 28, padR = 12, padT = 20, padB = 28;
        const chartW = W - padL - padR;
        const chartH = H - padT - padB;
        const maxCount = Math.max(...hours.map(d => d.count), 1);
        const barW = chartW / hours.length;
        const peak = hours.reduce((a, b) => b.count > a.count ? b : a, hours[0]);

        ctx.clearRect(0, 0, W, H);

        hours.forEach((d, i) => {
            const barH   = (d.count / maxCount) * chartH;
            const x      = padL + i * barW;
            const y      = padT + chartH - barH;
            const isPeak = d.hour === peak.hour && peak.count > 0;

            if (barH > 0) {
                ctx.beginPath();
                ctx.roundRect(x + barW * 0.1, y, barW * 0.8, barH, [3, 3, 0, 0]);
                ctx.fillStyle = isPeak ? '#1d4ed8' : '#93c5fd';
                ctx.fill();
            }

            // etiqueta cada hora
            ctx.fillStyle = '#9ca3af';
            ctx.font = '20px sans-serif';
            ctx.textAlign = 'center';
            const label = d.hour === 0 ? '12a' : d.hour < 12 ? `${d.hour}a` : d.hour === 12 ? '12p' : `${d.hour - 12}p`;
            ctx.fillText(label, x + barW / 2, H - padB + 16);

            if (isPeak && peak.count > 0) {
                ctx.fillStyle = '#1d4ed8';
                ctx.font = 'bold 20px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(d.count, x + barW / 2, y - 6);
            }
        });

        ctx.beginPath();
        ctx.moveTo(padL, padT + chartH);
        ctx.lineTo(W - padR, padT + chartH);
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        ctx.stroke();
    };

    useEffect(() => {
        if (!data?.length) return;
        const am = data.filter(d => d.hour >= 6 && d.hour <= 11);
        const pm = data.filter(d => d.hour >= 12 && d.hour <= 21);
        drawChart(amRef.current, am);
        drawChart(pmRef.current, pm);
    }, [data]);

    if (!data?.length) return null;

    const visible   = data.filter(d => d.hour >= 6 && d.hour <= 21);
    const peak      = visible.reduce((a, b) => b.count > a.count ? b : a, visible[0]);
    const total     = visible.reduce((s, d) => s + d.count, 0);
    const peakLabel = peak.hour < 12 ? `${peak.hour}am` : peak.hour === 12 ? '12pm' : `${peak.hour - 12}pm`;

    return (
        <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-100 rounded-lg">
                        <Activity className="h-4 w-4 text-blue-600" />
                    </div>
                    <h3 className="font-bold text-gray-800">Hora Pico de Asistencia</h3>
                </div>
                <span className="text-xs bg-primary-50 text-primary-700 font-semibold px-2 py-1 rounded-full border border-primary-100">
                    Este periodo
                </span>
            </div>

            {/* stats */}
            <div className="flex gap-3">
                <div className="flex-1 p-3 bg-blue-50 rounded-xl text-center">
                    <div className="text-xl font-bold text-blue-700">{peakLabel}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Hora pico</div>
                </div>
                <div className="flex-1 p-3 bg-gray-50 rounded-xl text-center">
                    <div className="text-xl font-bold text-gray-700">{peak.count}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Visitas en pico</div>
                </div>
                <div className="flex-1 p-3 bg-gray-50 rounded-xl text-center">
                    <div className="text-xl font-bold text-gray-700">{total}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Total periodo</div>
                </div>
            </div>

            {/* AM */}
            <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">AM</p>
                <canvas ref={amRef} width={600} height={120} className="w-full" />
            </div>

            {/* PM */}
            <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">PM</p>
                <canvas ref={pmRef} width={600} height={120} className="w-full" />
            </div>
        </div>
    );
}

export default HourlyChart;