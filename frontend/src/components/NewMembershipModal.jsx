import { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, User, Phone, Cake } from 'lucide-react';
import { memberService } from '../services/memberService';
import { subscriptionService } from '../services/subscriptionService';
import { planService } from '../services/planService';
import { capitalizeWords } from '../utils/textHelpers';

function NewMembershipModal({ onClose, onSuccess }) {
    const [step, setStep] = useState(1);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        first_name: '',
        last_name_paternal: '',
        last_name_maternal: '',
        phone: '',
        date_of_birth: '',
        emergency_contact: '',
        emergency_phone: '',
        plan_id: '',
        start_date: new Date().toISOString().split('T')[0],
        payment_method: 'cash',
        amount_paid: '',
        payment_notes: ''
    });

    const [errors, setErrors] = useState({});
    const [selectedPlan, setSelectedPlan] = useState(null);

    useEffect(() => {
        loadPlans();
    }, []);

    const loadPlans = async () => {
        try {
            const data = await planService.getAllPlans('active');
            // Ordenar por duración - FIX: usar slice() para no mutar el array original
            const sortedPlans = [...data].sort((a, b) => {
                const durationA = a.duration_days || 0;
                const durationB = b.duration_days || 0;
                return durationA - durationB;
            });
            setPlans(sortedPlans);
        } catch (error) {
            console.error('Error loading plans:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        const fieldsToCapitalize = [
            'first_name',
            'last_name_paternal',
            'last_name_maternal',
            'emergency_contact',
        ];
        let processedValue = value;
        
        if(fieldsToCapitalize.includes(name)) {
            processedValue = capitalizeWords(value);
        }

        setFormData(prev => ({ ...prev, [name]: processedValue }));
        
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handlePlanSelect = (plan) => {
        setFormData(prev => ({
            ...prev,
            plan_id: plan.id,
            amount_paid: plan.price.toString()
        }));
        setSelectedPlan(plan);
        
        if (errors.plan_id) {
            setErrors(prev => ({ ...prev, plan_id: '' }));
        }
    };

    const validateStep1 = () => {
        const newErrors = {};

        if (!formData.first_name.trim()) {
            newErrors.first_name = 'Nombre requerido';
        }
        if (!formData.last_name_paternal.trim()) {
            newErrors.last_name_paternal = 'Apellido requerido';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateStep2 = () => {
        const newErrors = {};

        if (!formData.plan_id) {
            newErrors.plan_id = 'Seleccione un plan';
        }
        if (!formData.amount_paid || parseFloat(formData.amount_paid) <= 0) {
            newErrors.amount_paid = 'Ingrese el monto pagado';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (step === 1 && validateStep1()) {
            setStep(2);
        }
    };

    const handleBack = () => {
        setStep(1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateStep2()) {
            return;
        }

        setLoading(true);
        
        try {
            console.log('Creating member...'); // Debug
            
            const memberData = {
                first_name: formData.first_name.trim(),
                last_name_paternal: formData.last_name_paternal.trim(),
                last_name_maternal: formData.last_name_maternal.trim() || null,
                phone: formData.phone.trim() || null,
                email: null,
                date_of_birth: formData.date_of_birth || null,
                emergency_contact: formData.emergency_contact.trim() || null,
                emergency_phone: formData.emergency_phone.trim() || null
            };

            const newMember = await memberService.createMember(memberData);
            console.log('Member created:', newMember); // Debug

            const subscriptionData = {
                member_id: newMember.id,
                plan_id: parseInt(formData.plan_id),
                start_date: formData.start_date,
                payment_status: 'paid',
                payment_method: formData.payment_method,
                amount_paid: parseFloat(formData.amount_paid),
                notes: formData.payment_notes.trim() || null
            };

            console.log('Creating subscription...', subscriptionData); // Debug
            await subscriptionService.createSubscription(subscriptionData);
            console.log('Subscription created'); // Debug

            // Llamar onSuccess ANTES de cerrar
            if (onSuccess) {
                onSuccess(
                    `Membresía registrada exitosamente para ${newMember.first_name} ${newMember.last_name_paternal}`,
                    'success'
                );
            }
            
            // Pequeño delay para que se vea el mensaje antes de cerrar
            setTimeout(() => {
                if (onClose) {
                    onClose(true);
                }
            }, 500);
            
        } catch (error) {
            console.error('Error creating membership:', error);
            console.error('Error details:', error.response?.data); // Debug
            
            let errorMessage = 'Error al registrar membresía';
            
            if (error.response?.data?.detail) {
                const detail = error.response.data.detail;
                if (typeof detail === 'string') {
                    errorMessage = detail;
                } else if (Array.isArray(detail)) {
                    errorMessage = detail.map(err => err.msg || err.message || JSON.stringify(err)).join(', ');
                }
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            if (onSuccess) {
                onSuccess(errorMessage, 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(price);
    };

    const calculateEndDate = () => {
        if (!selectedPlan) return null;
        
        const start = new Date(formData.start_date);
        const end = new Date(start);
        
        // Fix: manejar planes permanentes
        if (selectedPlan.duration_days === 0 || selectedPlan.duration_days > 36500) {
            return 'Permanente';
        }
        
        end.setDate(end.getDate() + selectedPlan.duration_days);
        
        return end.toLocaleDateString('es-MX', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <h3 className="text-xl font-semibold text-text-primary">
                            Registro Nuevo
                        </h3>
                        <p className="text-sm text-text-secondary mt-1">
                            Paso {step} de 2: {step === 1 ? 'Datos del Miembro' : 'Plan y Pago'}
                        </p>
                    </div>
                    <button 
                        onClick={() => onClose(false)} 
                        className="text-gray-400 hover:text-gray-600"
                        disabled={loading}
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            type="text"
                                            name="first_name"
                                            value={formData.first_name}
                                            onChange={handleChange}
                                            placeholder="Juan"
                                            className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                                                errors.first_name ? 'border-error-500' : 'border-gray-300'
                                            }`}
                                        />
                                    </div>
                                    {errors.first_name && <p className="text-error-500 text-sm mt-1">{errors.first_name}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Apellido Paterno *</label>
                                    <input
                                        type="text"
                                        name="last_name_paternal"
                                        value={formData.last_name_paternal}
                                        onChange={handleChange}
                                        placeholder="Pérez"
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                                            errors.last_name_paternal ? 'border-error-500' : 'border-gray-300'
                                        }`}
                                    />
                                    {errors.last_name_paternal && <p className="text-error-500 text-sm mt-1">{errors.last_name_paternal}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Apellido Materno</label>
                                    <input
                                        type="text"
                                        name="last_name_maternal"
                                        value={formData.last_name_maternal}
                                        onChange={handleChange}
                                        placeholder="García"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            placeholder="2221234567"
                                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento</label>
                                    <div className="relative">
                                        <Cake className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            type="date"
                                            name="date_of_birth"
                                            value={formData.date_of_birth}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Opcional - Para felicitaciones y ofertas especiales</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Contacto de Emergencia</label>
                                    <input
                                        type="text"
                                        name="emergency_contact"
                                        value={formData.emergency_contact}
                                        onChange={handleChange}
                                        placeholder="Nombre del contacto"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono de Emergencia</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            type="tel"
                                            name="emergency_phone"
                                            value={formData.emergency_phone}
                                            onChange={handleChange}
                                            placeholder="2221234567"
                                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 mt-6 border-t">
                                <button 
                                    type="button" 
                                    onClick={() => onClose(false)} 
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="button" 
                                    onClick={handleNext} 
                                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                                >
                                    Siguiente
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">Seleccionar Plan *</label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {plans.map((plan) => (
                                        <button
                                            key={plan.id}
                                            type="button"
                                            onClick={() => handlePlanSelect(plan)}
                                            className={`p-4 border-2 rounded-lg text-left transition-all ${
                                                formData.plan_id === plan.id ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-primary-300'
                                            }`}
                                        >
                                            <div className="font-semibold text-gray-900">{plan.name}</div>
                                            <div className="text-xl font-bold text-primary-600 mt-1">{formatPrice(plan.price)}</div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {plan.duration_days === 0 || plan.duration_days > 36500 ? 'Permanente' : `${plan.duration_days} días`}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                                {errors.plan_id && <p className="text-error-500 text-sm mt-2">{errors.plan_id}</p>}
                            </div>

                            {selectedPlan && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Inicio</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                            <input
                                                type="date"
                                                name="start_date"
                                                value={formData.start_date}
                                                onChange={handleChange}
                                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Vencimiento</label>
                                        <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700">
                                            {calculateEndDate()}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
                                    <select
                                        name="payment_method"
                                        value={formData.payment_method}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    >
                                        <option value="cash">Efectivo</option>
                                        <option value="card">Tarjeta</option>
                                        <option value="transfer">Transferencia</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Monto Pagado *</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            type="number"
                                            name="amount_paid"
                                            value={formData.amount_paid}
                                            onChange={handleChange}
                                            placeholder="0.00"
                                            step="0.01"
                                            min="0"
                                            className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                                                errors.amount_paid ? 'border-error-500' : 'border-gray-300'
                                            }`}
                                        />
                                    </div>
                                    {errors.amount_paid && <p className="text-error-500 text-sm mt-1">{errors.amount_paid}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notas de Pago</label>
                                <textarea
                                    name="payment_notes"
                                    value={formData.payment_notes}
                                    onChange={handleChange}
                                    placeholder="Comentarios adicionales..."
                                    rows="2"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </div>

                            {selectedPlan && (
                                <div className="p-4 bg-success-50 border border-success-200 rounded-lg">
                                    <h4 className="text-sm font-medium text-success-900 mb-2">Resumen de Venta</h4>
                                    <div className="space-y-1 text-sm text-success-800">
                                        <div className="flex justify-between">
                                            <span>Miembro:</span>
                                            <span className="font-medium">{formData.first_name} {formData.last_name_paternal}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Plan:</span>
                                            <span className="font-medium">{selectedPlan.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Precio:</span>
                                            <span className="font-medium">{formatPrice(selectedPlan.price)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Vence:</span>
                                            <span className="font-medium">{calculateEndDate()}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-between pt-4 border-t">
                                <button 
                                    type="button" 
                                    onClick={handleBack} 
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                    disabled={loading}
                                >
                                    Atrás
                                </button>
                                <div className="flex gap-3">
                                    <button 
                                        type="button" 
                                        onClick={() => onClose(false)} 
                                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                        disabled={loading}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-6 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                    >
                                        {loading ? 'Registrando...' : 'Registrar'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}

export default NewMembershipModal;