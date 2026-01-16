import { useState, useEffect } from 'react';
import { X, Calendar, AlertTriangle } from 'lucide-react';
import { subscriptionService } from '../services/subscriptionService';
import { memberService } from '../services/memberService';
import { planService } from '../services/planService';
import SearchableSelect from './common/SearchableSelect';

function SubscriptionModal({ onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        member_id: '',
        plan_id: '',
        start_date: new Date().toISOString().split('T')[0],
        payment_status: 'pending',
        amount_paid: '0.00',
        notes: ''
    });
    
    const [members, setMembers] = useState([]);
    const [plans, setPlans] = useState([]);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [existingSubscription, setExistingSubscription] = useState(null);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadMembers();
        loadPlans();
    }, []);

    useEffect(() => {
        if (formData.plan_id && formData.start_date) {
            calculateEndDate();
        }
    }, [formData.plan_id, formData.start_date]);

    useEffect(() => {
        if (formData.member_id) {
            checkExistingSubscription();
        }
    }, [formData.member_id]);

    const loadMembers = async () => {
        try {
            const data = await memberService.getAllMembers({ active_only: true });
            setMembers(data);
        } catch (error) {
            console.error('Error loading members:', error);
        }
    };

    const loadPlans = async () => {
        try {
            const data = await planService.getAllPlans('active');
            setPlans(data);
        } catch (error) {
            console.error('Error loading plans:', error);
        }
    };

    const checkExistingSubscription = async () => {
        try {
            const subscription = await subscriptionService.getMemberActiveSubscription(formData.member_id);
            setExistingSubscription(subscription);
        } catch (error) {
            setExistingSubscription(null);
        }
    };

    const calculateEndDate = () => {
        const plan = plans.find(p => p.id === parseInt(formData.plan_id));
        if (!plan) return;

        setSelectedPlan(plan);
        
        const start = new Date(formData.start_date);
        const end = new Date(start);
        
        // Si es plan permanente (0 días), mostrar mensaje especial
        if (plan.duration_days === 0) {
            setEndDate('permanent');
            return;
        }
        
        end.setDate(end.getDate() + plan.duration_days);
        setEndDate(end.toISOString().split('T')[0]);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.member_id) {
            newErrors.member_id = 'Seleccione un miembro';
        }

        if (!formData.plan_id) {
            newErrors.plan_id = 'Seleccione un plan';
        }

        if (!formData.start_date) {
            newErrors.start_date = 'La fecha de inicio es requerida';
        }

        if (existingSubscription) {
            newErrors.member_id = 'El miembro ya tiene una suscripción activa';
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
                member_id: parseInt(formData.member_id),
                plan_id: parseInt(formData.plan_id),
                start_date: formData.start_date,
                payment_status: formData.payment_status,
                amount_paid: parseFloat(formData.amount_paid) || 0,
                notes: formData.notes.trim() || null
            };

            await subscriptionService.createSubscription(cleanedData);
            onSuccess('Suscripción creada exitosamente', 'success');
            onClose(true);
        } catch (error) {
            console.error('Error creating subscription:', error);
        
            if (error.response?.data?.detail) {
                const detail = error.response.data.detail;
                if (typeof detail === 'string') {
                    onSuccess(detail, 'error');
                } else if (Array.isArray(detail)) {
                    const errorMsg = detail.map(err => err.msg).join(', ');
                    onSuccess(errorMsg, 'error');
                }
            } else {
                onSuccess('Error al crear suscripción', 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (dateString === 'permanent') {
            return 'Sin vencimiento';
        }
        const date = new Date(dateString);
        return date.toLocaleDateString('es-MX', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    const formatPrice = (price) => {
        if (price === 0) return 'Gratis';
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(price);
    };

    const formatDuration = (days) => {
        if (days === 0) return 'Permanente';
        if (days === 1) return '1 día';
        if (days === 7) return '1 semana';
        if (days === 30) return '1 mes';
        return `${days} días`;
    };

    const getMemberDisplayName = (member) => {
        return `${member.first_name} ${member.last_name_paternal} ${member.last_name_maternal || ''}`.trim();
    };

    const membersForSelect = members.map(m => ({
        id: m.id,
        name: getMemberDisplayName(m)
    }));

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                    <h3 className="text-xl font-semibold text-text-primary">
                        Nueva Suscripción
                    </h3>
                    <button
                        onClick={() => onClose(false)}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Warning if member has active subscription */}
                    {existingSubscription && (
                        <div className="flex items-start gap-3 p-4 bg-warning-50 border border-warning-200 rounded-lg">
                            <AlertTriangle className="h-5 w-5 text-warning-600 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-warning-800">
                                    Este miembro ya tiene una suscripción activa
                                </p>
                                <p className="text-sm text-warning-700 mt-1">
                                    Vence el {formatDate(existingSubscription.end_date)}
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Member */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Miembro *
                            </label>
                            <SearchableSelect
                                options={membersForSelect}
                                value={formData.member_id}
                                onChange={(value) => handleChange({ target: { name: 'member_id', value } })}
                                placeholder="Buscar miembro por nombre..."
                                displayKey="name"
                                valueKey="id"
                                error={errors.member_id}
                            />
                        </div>

                        {/* Plan */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Plan *
                            </label>
                            <select
                                name="plan_id"
                                value={formData.plan_id}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                                    errors.plan_id ? 'border-error-500' : 'border-gray-300'
                                }`}
                            >
                                <option value="">Seleccionar plan</option>
                                {plans.map(plan => (
                                    <option key={plan.id} value={plan.id}>
                                        {plan.name} - {formatPrice(plan.price)} ({formatDuration(plan.duration_days)})
                                    </option>
                                ))}
                            </select>
                            {errors.plan_id && (
                                <p className="text-error-500 text-sm mt-1">{errors.plan_id}</p>
                            )}
                        </div>

                        {/* Start Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Fecha de Inicio *
                            </label>
                            <input
                                type="date"
                                name="start_date"
                                value={formData.start_date}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                                    errors.start_date ? 'border-error-500' : 'border-gray-300'
                                }`}
                            />
                            {errors.start_date && (
                                <p className="text-error-500 text-sm mt-1">{errors.start_date}</p>
                            )}
                        </div>

                        {/* End Date (Read-only) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Fecha de Vencimiento
                            </label>
                            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                                <Calendar className="h-5 w-5 text-gray-400" />
                                <span className="text-gray-700">
                                    {endDate ? formatDate(endDate) : 'Seleccione un plan'}
                                </span>
                            </div>
                        </div>

                        {/* Payment Status */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Estado de Pago
                            </label>
                            <select
                                name="payment_status"
                                value={formData.payment_status}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                                <option value="pending">Pendiente</option>
                                <option value="partial">Parcial</option>
                                <option value="paid">Pagado</option>
                            </select>
                        </div>

                        {/* Amount Paid */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Monto Pagado
                            </label>
                            <input
                                type="number"
                                name="amount_paid"
                                value={formData.amount_paid}
                                onChange={handleChange}
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>

                        {/* Notes */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Notas
                            </label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                placeholder="Comentarios adicionales..."
                                rows="3"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Summary */}
                    {selectedPlan && (
                        <div className="p-4 bg-info-50 border border-info-200 rounded-lg">
                            <h4 className="text-sm font-medium text-info-900 mb-2">Resumen</h4>
                            <div className="space-y-1 text-sm text-info-800">
                                <div className="flex justify-between">
                                    <span>Plan:</span>
                                    <span className="font-medium">{selectedPlan.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Duración:</span>
                                    <span className="font-medium">{formatDuration(selectedPlan.duration_days)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Precio:</span>
                                    <span className="font-medium">{formatPrice(selectedPlan.price)}</span>
                                </div>
                                {endDate && (
                                    <div className="flex justify-between pt-2 border-t border-info-200">
                                        <span>Vence:</span>
                                        <span className="font-semibold">{formatDate(endDate)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={() => onClose(false)}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !!existingSubscription}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creando...' : 'Crear Suscripción'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default SubscriptionModal;