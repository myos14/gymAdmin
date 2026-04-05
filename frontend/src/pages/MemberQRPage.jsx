import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';

export default function MemberQRPage() {
    const { token } = useParams();
    const qrValue = `${window.location.origin}/member-qr/${token}`;

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-600 to-blue-800 flex flex-col items-center justify-center p-6">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-black text-white tracking-tight">FUERZA FIT</h1>
                <p className="text-blue-200 mt-1 text-sm">Código de acceso</p>
            </div>
            <div className="bg-white rounded-2xl shadow-2xl p-6 flex flex-col items-center w-full max-w-xs">
                <p className="text-xs text-gray-500 mb-4 text-center">
                    Muestra este código al staff cuando llegues
                </p>
                <div className="p-2 border-2 border-gray-100 rounded-xl">
                    <QRCodeSVG value={qrValue} size={220} level="H" />
                </div>
                <p className="mt-4 text-xs text-gray-400 text-center">
                    Tu código es único y permanente
                </p>
            </div>
            <p className="mt-8 text-blue-200 text-xs text-center">
                Guarda este enlace en tus favoritos
            </p>
        </div>
    );
}