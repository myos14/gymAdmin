import { useRef, useEffect } from 'react';
import { Activity } from 'lucide-react';

function HourlyChart({ data }) {
    const amRef = useRef(null);
    const pmRef = useRef(null);

    const drawChart = (canvas, hours) => {
        if (!canvas || !hours.length) return;
        const ctx = canvas.getContext('2d');
        const W = canvas.width, H = canvas.height;
        const padL = 28, padR = 12, padT = 24, padB = 28;
        const chartW = W - padL - padR;
        const chartH = H - padT - padB;
        const maxCount = Math.max(...hours.map(d => d.count), 1);
        const barW = chartW / hours.length;
        const peak = hours.reduce((a, b) => b.count > a.count ? b : a, hours[0]);

        ctx.clearRect(0, 0, W, H);

        hours.forEach((d, i) => {
            const x      = padL + i * barW;
            const isPeak = d.hour === peak.hour && peak.count > 0;
            const totalH = (d.count / maxCount) * chartH;

            if (d.count > 0) {
                const mH = (d.masculino / d.count) * totalH;
                const fH = (d.femenino  / d.count) * totalH;
                const oH = totalH - mH - fH;
                let yOff = padT + chartH - totalH;

                // masculino — azul
                if (mH > 0) {
                    ctx.beginPath();
                    ctx.roundRect(x + barW * 0.15, yOff, barW * 0.7, mH, i === 0 ? [3,3,0,0] : [3,3,0,0]);
                    ctx.fillStyle = isPeak ? '#1d4ed8' : '#93c5fd';
                    ctx.fill();
                    yOff += mH;
                }
                // femenino — rosa
                if (fH > 0) {
                    ctx.beginPath();
                    ctx.rect(x + barW * 0.15, yOff, barW * 0.7, fH);
                    ctx.fillStyle = isPeak ? '#ec4899' : '#f9a8d4';
                    ctx.fill();
                    yOff += fH;
                }
                // otro — gris
                if (oH > 0.5) {
                    ctx.beginPath();
                    ctx.rect(x + barW * 0.15, yOff, barW * 0.7, oH);
                    ctx.fillStyle = '#d1d5db';
                    ctx.fill();
                }
            }

            // etiqueta hora
            ctx.fillStyle = '#9ca3af';
            ctx.font = '20px sans-serif';
            ctx.textAlign = 'center';
            const label = d.hour < 12 ? `${d.hour}a` : d.hour === 12 ? '12p' : `${d.hour - 12}p`;
            ctx.fillText(label, x + barW / 2, H - padB + 16);

            // valor encima del pico
            if (isPeak && peak.count > 0) {
                ctx.fillStyle = '#1d4ed8';
                ctx.font = 'bold 20px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(d.count, x + barW / 2, padT + chartH - totalH - 6);
            }
        });

        // línea base
        ctx.beginPath();
        ctx.moveTo(padL, padT + chartH);
        ctx.lineTo(W - padR, padT + chartH);
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        ctx.stroke();
    };

    useEffect(() => {
        if (!data?.length) return;
        drawChart(amRef.current, data.filter(d => d.hour >= 6 && d.hour <= 11));
        drawChart(pmRef.current, data.filter(d => d.hour >= 12 && d.hour <= 21));
    }, [data]);

    if (!data?.length) return null;

    const visible   = data.filter(d => d.hour >= 5 && d.hour <= 23);
    const peak      = visible.reduce((a, b) => b.count > a.count ? b : a, visible[0]);
    const total     = visible.reduce((s, d) => s + d.count, 0);
    const totalM    = visible.reduce((s, d) => s + (d.masculino || 0), 0);
    const totalF    = visible.reduce((s, d) => s + (d.femenino  || 0), 0);
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

            {/* leyenda género */}
            <div className="flex items-center gap-4 px-1">
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-blue-300 flex-shrink-0" />
                    <span className="text-xs text-gray-600">Hombres <strong>{totalM}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-pink-300 flex-shrink-0" />
                    <span className="text-xs text-gray-600">Mujeres <strong>{totalF}</strong></span>
                </div>
                {total - totalM - totalF > 0 && (
                    <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-sm bg-gray-300 flex-shrink-0" />
                        <span className="text-xs text-gray-600">N/D <strong>{total - totalM - totalF}</strong></span>
                    </div>
                )}
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