import { useState, useEffect } from 'react';
import { X, QrCode, Send, RefreshCw, Phone } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { qrService } from '../services/qrService';

export default function MemberQRModal({ member, onClose }) {
    const [qrData, setQrData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [whatsappSent, setWhatsappSent] = useState(false);

    const memberFullName = `${member.first_name} ${member.last_name_paternal}${
        member.last_name_maternal ? ' ' + member.last_name_maternal : ''
    }`;

    useEffect(() => { loadQRToken(); }, []);

    const loadQRToken = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await qrService.getMemberQRToken(member.id);
            setQrData(data);
        } catch (e) {
            setError(e.response?.data?.detail || 'Error al generar QR');
        } finally {
            setLoading(false);
        }
    };

    const handleSendWhatsApp = () => {
        if (!member.phone || !qrData) return;
        const phone = member.phone.replace(/\D/g, '');
        const fullPhone = phone.startsWith('52') ? phone : `52${phone}`;
        const message = `Hola ${member.first_name}\n\n`
            + `Tu código de acceso a *Fuerza Fit* está listo.\n\n`
            + `Muestra este enlace al staff cuando llegues:\n`
            + `${qrData.qr_url}\n\n`
            + `_Guarda este mensaje para tenerlo siempre a la mano._`;
        window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`, '_blank');
        setWhatsappSent(true);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
                <div className="flex items-center justify-between p-5 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <QrCode className="h-5 w-5 text-primary-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Código QR de Acceso</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="p-6">
                    <p className="text-center text-sm text-gray-600 mb-4">{memberFullName}</p>

                    {loading && (
                        <div className="flex flex-col items-center py-10">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
                            <p className="mt-3 text-sm text-gray-500">Generando QR...</p>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                            <p className="text-red-700 text-sm">{error}</p>
                            <button onClick={loadQRToken} className="mt-2 text-sm text-red-600 underline">
                                Reintentar
                            </button>
                        </div>
                    )}

                    {!loading && !error && qrData && (
                        <>
                            <div className="flex justify-center mb-4">
                                <div className="p-3 border-2 border-gray-200 rounded-xl">
                                    <QRCodeSVG value={qrData.qr_url} size={200} level="H" />
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-3 mb-4">
                                <p className="text-xs text-gray-500 mb-1">Enlace del miembro:</p>
                                <p className="text-xs text-gray-700 break-all font-mono">{qrData.qr_url}</p>
                            </div>

                            {member.phone ? (
                                <button
                                    onClick={handleSendWhatsApp}
                                    className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium transition-colors ${
                                        whatsappSent
                                            ? 'bg-green-100 text-green-700 border border-green-300'
                                            : 'bg-green-500 hover:bg-green-600 text-white'
                                    }`}
                                >
                                    <Send className="h-4 w-4" />
                                    {whatsappSent ? '✓ Enviado — Enviar de nuevo' : 'Enviar por WhatsApp'}
                                </button>
                            ) : (
                                <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <Phone className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                                    <p className="text-sm text-yellow-700">
                                        Sin teléfono registrado. Muestra el QR en pantalla o imprímelo.
                                    </p>
                                </div>
                            )}

                            <button
                                onClick={loadQRToken}
                                className="w-full mt-3 flex items-center justify-center gap-2 py-2 px-4 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 text-sm"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Regenerar QR
                            </button>
                        </>
                    )}
                </div>

                <div className="flex justify-end px-6 pb-5">
                    <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}