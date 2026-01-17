import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { planService } from '../services/planService';

function PlanModal({ plan, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        duration_days: '',
        description: ''
    });
    const [isCustomDuration, setIsCustomDuration] = useState(false);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (plan) {
            setFormData({
                name: plan.name || '',
                price: plan.price || '',
                duration_days: plan.duration_days || '',
                description: plan.description || '',
            });
            
            const predefinedDurations = [0, 1, 7, 30, 60, 90, 180, 365];
            if (plan.duration_days && !predefinedDurations.includes(plan.duration_days)) {
                setIsCustomDuration(true);
            }
        }
    }, [plan]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleDurationChange = (e) => {
        const value = e.target.value;
        
        if (value === 'custom') {
            setIsCustomDuration(true);
            setFormData(prev => ({ ...prev, duration_days: '' }));
        } else {
            setIsCustomDuration(false);
            setFormData(prev => ({ ...prev, duration_days: value }));
        }
        
        if (errors.duration_days) {
            setErrors(prev => ({ ...prev, duration_days: '' }));
        }
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Campo obligatorio';
        }

        const price = parseFloat(formData.price);
        if (isNaN(price) || price < 0) {
            newErrors.price = 'El precio debe ser mayor o igual a 0';
        }
        if (price > 100000) {
            newErrors.price = 'El precio no puede exceder $100,000';
        }

        const duration = parseInt(formData.duration_days);
        if (isNaN(duration) || duration < 0) {
            newErrors.duration_days = 'La duración debe ser 0 o mayor';
        }
        if (duration > 3650) {
            newErrors.duration_days = 'Máximo 3650 días (10 años). Usa 0 para permanente';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validate()) {
            return;
        }

        setLoading(true);
        try {
            const cleanedData = {
                name: formData.name.trim(),
                price: parseFloat(formData.price),
                duration_days: parseInt(formData.duration_days),
                description: formData.description.trim() || null
            };

            if (plan) {
                await planService.updatePlan(plan.id, cleanedData);
                onSuccess('Plan actualizado exitosamente', 'success');
            } else {
                await planService.createPlan(cleanedData);
                onSuccess('Plan creado exitosamente', 'success');
            }
            onClose(true);
        } catch (error) {
            console.error('Error saving plan:', error);

            if (error.response?.data?.detail) {
                const detail = error.response.data.detail;
                if (Array.isArray(detail)) {
                    const errorMsg = detail.map(err => err.msg).join(', ');
                    onSuccess(errorMsg, 'error');
                } else {
                    onSuccess(detail, 'error');
                }
            } else {
                onSuccess('Error al guardar plan', 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    const durationOptions = [
        { value: 0, label: 'Permanente (sin vencimiento)' },
        { value: 1, label: '1 día (Pase diario)' },
        { value: 7, label: '1 semana' },
        { value: 30, label: '1 mes' },
        { value: 60, label: '2 meses' },
        { value: 90, label: '3 meses' },
        { value: 180, label: '6 meses' },
        { value: 365, label: '1 año' },
        { value: 'custom', label: 'Personalizado...' }
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h3 className="text-xl font-semibold text-text-primary">
                        {plan ? 'Editar Plan' : 'Nuevo Plan'}
                    </h3>
                    <button onClick={() => onClose(false)} className="text-gray-400 hover:text-gray-600">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre del Plan *
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Ej: Plan Mensual"
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                                errors.name ? 'border-red-500' : 'border-gray-300'
                            }`}
                        />
                        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Precio (MXN) *
                        </label>
                        <input
                            type="number"
                            name="price"
                            value={formData.price}
                            onChange={handleChange}
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                                errors.price ? 'border-red-500' : 'border-gray-300'
                            }`}
                        />
                        {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Duración *
                        </label>
                        {!isCustomDuration ? (
                            <select
                                name="duration_days"
                                value={formData.duration_days}
                                onChange={handleDurationChange}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                                    errors.duration_days ? 'border-red-500' : 'border-gray-300'
                                }`}
                            >
                                <option value="">Seleccionar duración</option>
                                {durationOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <div className="space-y-2">
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        name="duration_days"
                                        value={formData.duration_days}
                                        onChange={handleChange}
                                        placeholder="Ingresa número de días"
                                        min="0"
                                        max="3650"
                                        className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                                            errors.duration_days ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsCustomDuration(false);
                                            setFormData(prev => ({ ...prev, duration_days: '' }));
                                        }}
                                        className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
                                    >
                                        Volver
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500">
                                    💡 <strong>0 días</strong> = Permanente | <strong>1-3650</strong> = Días específicos (máx 10 años)
                                </p>
                            </div>
                        )}
                        {errors.duration_days && <p className="text-red-500 text-sm mt-1">{errors.duration_days}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Descripción
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Beneficios del plan, restricciones, etc."
                            rows="3"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => onClose(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Guardando...' : (plan ? 'Actualizar' : 'Crear')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default PlanModal;