import { useState } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
import { checkIn } from '../services/api';

function QuickCheckInModal({ member, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleCheckIn = async () => {
        setLoading(true);
        setError('');

        try {
            await checkIn({ member_id: member.id });
            onSuccess(`Check-in exitoso para ${member.first_name} ${member.last_name_paternal}`);
            onClose();
        } catch (err) {
            console.error('Error en check-in:', err);
            if (err.response?.data?.detail) {
                setError(err.response.data.detail);
            } else {
                setError('Error al registrar check-in');
            }
        } finally {
            setLoading(false);
        }
    };

    const getMemberFullName = () => {
        return `${member.first_name} ${member.last_name_paternal}${member.last_name_maternal ? ' ' + member.last_name_maternal : ''}`;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="h-6 w-6 text-primary-600" />
                        <h3 className="text-xl font-semibold text-text-primary">
                            Registrar Check-in
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="text-center mb-6">
                        <p className="text-lg font-medium text-gray-900 mb-2">
                        {getMemberFullName()}
                        </p>
                        <p className="text-sm text-gray-600">
                        ¿Confirmar entrada al gimnasio?
                        </p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-error-50 border border-error-200 rounded-lg flex items-start gap-2">
                            <AlertCircle className="h-5 w-5 text-error-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-error-700">{error}</p>
                        </div>
                    )}

                    {/* Buttons */}
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleCheckIn}
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Registrando...' : 'Confirmar Check-in'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default QuickCheckInModal;