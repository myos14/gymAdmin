import { useEffect, useRef, useState } from 'react';
import { X, ScanLine, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { qrService } from '../services/qrService';

export default function QRScannerModal({ onClose }) {
    const [scanning, setScanning] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const html5QrRef = useRef(null);
    const scannedRef = useRef(false);

    useEffect(() => {
        startScanner();
        return () => stopScanner();
    }, []);

    const startScanner = async () => {
        setResult(null);
        setError(null);
        scannedRef.current = false;
        setScanning(true);
        html5QrRef.current = new Html5Qrcode('qr-reader-staff');
        try {
            await html5QrRef.current.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 260, height: 260 } },
                async (decodedText) => {
                    if (scannedRef.current) return;
                    scannedRef.current = true;
                    await stopScanner();
                    await processCheckIn(decodedText);
                },
                () => {}
            );
        } catch {
            setScanning(false);
            setError('No se pudo acceder a la cámara. Verifica los permisos del navegador.');
        }
    };

    const stopScanner = async () => {
        if (html5QrRef.current) {
            try { await html5QrRef.current.stop(); } catch {}
        }
        setScanning(false);
    };

    const processCheckIn = async (qrUrl) => {
        setProcessing(true);
        try {
            const url = new URL(qrUrl);
            const pathParts = url.pathname.split('/');
            const token = pathParts[pathParts.length - 1];
            const data = await qrService.processQRCheckIn(token);
            setResult({ success: true, data });
        } catch (e) {
            setResult({ success: false, message: e.response?.data?.detail || 'Error al procesar check-in' });
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-sm w-full">
                <div className="flex items-center justify-between p-5 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <ScanLine className="h-5 w-5 text-primary-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Escanear QR</h3>
                    </div>
                    <button onClick={() => { stopScanner(); onClose(); }} className="text-gray-400 hover:text-gray-600">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="p-5">
                    {!result && !processing && (
                        <>
                            <div id="qr-reader-staff" className="w-full rounded-lg overflow-hidden" />
                            {error && (
                                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            )}
                            {scanning && (
                                <p className="text-center text-sm text-gray-500 mt-3">
                                    Apunta la cámara al QR del miembro
                                </p>
                            )}
                        </>
                    )}

                    {processing && (
                        <div className="flex flex-col items-center py-10">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
                            <p className="mt-3 text-sm text-gray-600">Registrando entrada...</p>
                        </div>
                    )}

                    {result?.success && (
                        <div className="space-y-4">
                            <div className="flex flex-col items-center pt-2">
                                <CheckCircle className="h-14 w-14 text-green-500" />
                                <h4 className="mt-2 text-xl font-bold text-gray-900">{result.data.member_name}</h4>
                                <p className="text-gray-500 text-sm">Entrada a las {result.data.check_in_time}</p>
                            </div>
                            <div className={`p-4 rounded-lg border ${
                                result.data.subscription.alert === 'warning'
                                    ? 'bg-yellow-50 border-yellow-300'
                                    : 'bg-green-50 border-green-200'
                            }`}>
                                <p className="text-sm font-semibold text-gray-700">{result.data.subscription.plan_name}</p>
                                <p className="text-sm text-gray-600">Vence: {result.data.subscription.end_date}</p>
                                <p className={`text-sm font-bold mt-1 ${
                                    result.data.subscription.days_remaining <= 3 ? 'text-red-600' :
                                    result.data.subscription.days_remaining <= 7 ? 'text-yellow-600' : 'text-green-600'
                                }`}>
                                    {result.data.subscription.days_remaining === 0
                                        ? '⚠️ Vence hoy'
                                        : `${result.data.subscription.days_remaining} días restantes`}
                                </p>
                                {result.data.subscription.alert === 'warning' && (
                                    <div className="flex items-center gap-1 mt-2">
                                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                        <p className="text-xs text-yellow-700 font-medium">Avisar al miembro que su plan vence pronto</p>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => { setResult(null); startScanner(); }}
                                className="w-full py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
                            >
                                Escanear otro miembro
                            </button>
                        </div>
                    )}

                    {result && !result.success && (
                        <div className="space-y-4">
                            <div className="flex flex-col items-center pt-2">
                                <XCircle className="h-14 w-14 text-red-500" />
                                <p className="mt-2 text-center text-red-700 font-medium">{result.message}</p>
                            </div>
                            <button
                                onClick={() => { setResult(null); startScanner(); }}
                                className="w-full py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
                            >
                                Intentar de nuevo
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}