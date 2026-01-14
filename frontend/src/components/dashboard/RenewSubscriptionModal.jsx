import { useState, useEffect } from 'react';
import { X, Calendar } from 'lucide-react';
import { subscriptionService } from '../../services/subscriptionService';
import { planService } from '../../services/planService';

function RenewSubscriptionModal({ subscription, onClose, onSuccess }) {
    const [plans, setPlans] = useState([]);
    const [formData, setFormData] = useState({
        plan_id: subscription.plan.id, // Pre-selecciona el plan actual
        start_date: '',
        payment_status: 'pending',
        amount_paid: '0.00',
        notes: ''
    });
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        loadPlans();
        calculateStartDate();
    }, []);

    useEffect(() => {
        if (formData.plan_id && formData.start_date) {
        calculateEndDate();
        }
    }, [formData.plan_id, formData.start_date]);

    const loadPlans = async () => {
        try {
            const data = await planService.getAllPlans('active');
            setPlans(data);
            // pre-select the current plan
            const currentPlan = data.find(p => p.id === subscription.plan.id);
            setSelectedPlan(currentPlan);
        } catch (error) {
            console.error('Error loading plans:', error);
        }
    };

    const calculateStartDate = () => {
        // If the subscription hasn't expired yet, start from the day after the expiration
        const today = new Date();
        const subEndDate = new Date(subscription.end_date);
        
        let startDate;
        if (subEndDate >= today) {

            startDate = new Date(subEndDate);
            startDate.setDate(startDate.getDate() + 1);
        } else {
            startDate = today;
        }
        
        setFormData(prev => ({
            ...prev,
            start_date: startDate.toISOString().split('T')[0]
        }));
    };

    const calculateEndDate = () => {
        const plan = plans.find(p => p.id === parseInt(formData.plan_id));
        if (!plan) return;

        setSelectedPlan(plan);
        
        const start = new Date(formData.start_date);
        const end = new Date(start);
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

        if (!formData.plan_id) {
            newErrors.plan_id = 'Seleccione un plan';
        }

        if (!formData.start_date) {
            newErrors.start_date = 'La fecha de inicio es requerida';
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
            const renewData = {
            plan_id: parseInt(formData.plan_id),
            start_date: formData.start_date,
            payment_status: formData.payment_status,
            amount_paid: parseFloat(formData.amount_paid) || 0,
            notes: formData.notes.trim() || null
            };

            console.log('Sending renew data:', renewData);

            await subscriptionService.renewSubscription(subscription.id, renewData);
            onSuccess('Suscripción renovada exitosamente', 'success');
            onClose(true);
        } catch (error) {
            console.error('Full error:', error); // ← Ver error completo
            
            // Manejar diferentes tipos de errores
            let errorMessage = 'Error al renovar suscripción';
            
            if (error.response?.data?.detail) {
            const detail = error.response.data.detail;
            
            // Si detail es un array (errores de validación de Pydantic)
            if (Array.isArray(detail)) {
                errorMessage = detail.map(err => err.msg).join(', ');
            } 
            // Si detail es un string
            else if (typeof detail === 'string') {
                errorMessage = detail;
            }
            // Si detail es un objeto
            else {
                errorMessage = JSON.stringify(detail);
            }
            } else if (error.message) {
            errorMessage = error.message;
            }
            
            onSuccess(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-MX', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(price);
    };

    const getMemberFullName = () => {
        const { first_name, last_name_paternal, last_name_maternal } = subscription.member;
        return `${first_name} ${last_name_paternal}${last_name_maternal ? ' ' + last_name_maternal : ''}`;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <h3 className="text-xl font-semibold text-text-primary">
                            Renovar Suscripción
                        </h3>
                        <p className="text-sm text-text-secondary mt-1">
                            {getMemberFullName()}
                        </p>
                    </div>
                    <button
                        onClick={() => onClose(false)}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Current Subscription Info */}
                <div className="p-6 bg-gray-50 border-b border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Suscripción actual</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-600">Plan:</span>
                            <span className="ml-2 font-medium">{subscription.plan.name}</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Vence:</span>
                            <span className="ml-2 font-medium text-error-600">
                                {formatDate(subscription.end_date)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Plan Selection */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nuevo Plan *
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
                                        {plan.name} - {formatPrice(plan.price)} ({plan.duration_days} días)
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
                                placeholder="Comentarios adicionales sobre la renovación..."
                                rows="3"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Summary */}
                    {selectedPlan && (
                        <div className="p-4 bg-success-50 border border-success-200 rounded-lg">
                            <h4 className="text-sm font-medium text-success-900 mb-2">Resumen de renovación</h4>
                            <div className="space-y-1 text-sm text-success-800">
                                <div className="flex justify-between">
                                    <span>Plan seleccionado:</span>
                                    <span className="font-medium">{selectedPlan.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Duración:</span>
                                    <span className="font-medium">{selectedPlan.duration_days} días</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Precio:</span>
                                    <span className="font-medium">{formatPrice(selectedPlan.price)}</span>
                                </div>
                                {endDate && (
                                    <div className="flex justify-between pt-2 border-t border-success-200">
                                        <span>Nueva fecha de vencimiento:</span>
                                        <span className="font-semibold">{formatDate(endDate)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Buttons */}
                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => onClose(false)}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Renovando...' : 'Renovar Suscripción'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default RenewSubscriptionModal;