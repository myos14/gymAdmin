import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import {memberService } from '../services/memberService';
import { capitalizeWords } from '../utils/textHelpers';

function MemberModal({member, onClose, onSuccess}) {
    const [formData, setFormData] = useState({
        first_name: '',
        last_name_paternal: '',
        last_name_maternal: '',
        email: '',
        phone: '',
        date_of_birth: '',
        emergency_contact: '',
        emergency_phone: '',
    })
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (member) {
            setFormData({
                first_name: member.first_name || '',
                last_name_paternal: member.last_name_paternal || '',
                last_name_maternal: member.last_name_maternal || '',
                email: member.email || '',
                phone: member.phone || '',
                date_of_birth: member.date_of_birth || '',
                emergency_contact: member.emergency_contact || '',
                emergency_phone: member.emergency_phone || '',
            })
        }
    }, [member]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        
        const fieldsToCapitalize = [
            'first_name',
            'last_name_paternal',
            'last_name_maternal',
            'emergency_contact'
        ];
        
        if (fieldsToCapitalize.includes(name) && value) {
            setFormData(prev => ({ 
                ...prev, 
                [name]: capitalizeWords(value) 
            }));
        }
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.first_name.trim()) {
            newErrors.first_name = 'Campo obligatorio';
        }

        if (!formData.last_name_paternal.trim()) {
            newErrors.last_name_paternal = 'Campo obligatorio';
        }

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Email invalido';
        }

        if (formData.phone && !/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
            newErrors.phone = '10 dígitos obligatorios';
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
            // Clean data: convert empty strings to null for optional fields
            const cleanedData = {
            ...formData,
            date_of_birth: formData.date_of_birth || null,
            email: formData.email || null,
            phone: formData.phone || null,
            emergency_contact: formData.emergency_contact || null,
            emergency_phone: formData.emergency_phone || null
            };

            if (member) {
            await memberService.updateMember(member.id, cleanedData);
            onSuccess('Miembro actualizado exitosamente', 'success');
            } else {
            await memberService.createMember(cleanedData);
            onSuccess('Miembro creado exitosamente', 'success');
            }
            onClose(true);
        } catch (error) {
            console.error('Error saving member:', error);
            
            // Handle validation errors
            if (error.response?.data?.detail) {
            const detail = error.response.data.detail;
            if (Array.isArray(detail)) {
                // Pydantic validation error
                const errorMsg = detail.map(err => err.msg).join(', ');
                onSuccess(errorMsg, 'error');
            } else {
                onSuccess(detail, 'error');
            }
            } else {
            onSuccess('Error al guardar miembro', 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h3 className="text-xl font-semibold text-text-primary">
                        {member ? 'Editar Miembro' : 'Nuevo Miembro'}
                    </h3>
                    <button
                        onClick={() => onClose(false)}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* First name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nombre *
                            </label>
                            <input
                                type="text"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                                    errors.first_name ? 'border-red-500' : 'border-gray-300'
                                }`}
                            />
                            {errors.first_name && (
                                <p className="text-red-500 text-sm mt-1">{errors.first_name}</p>
                            )}
                        </div>

                        {/* Last name paternal */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Apellido Paterno *
                            </label>
                            <input
                                type="text"
                                name="last_name_paternal"
                                value={formData.last_name_paternal}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                                    errors.last_name_paternal ? 'border-red-500' : 'border-gray-300'
                                }`}
                            />
                            {errors.last_name_paternal && (
                                <p className="text-red-500 text-sm mt-1">{errors.last_name_paternal}</p>
                            )}
                        </div>

                        {/* Last name matermal */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Apellido Materno
                            </label>
                            <input
                                type="text"
                                name="last_name_maternal"
                                value={formData.last_name_maternal}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                                    errors.email ? 'border-red-500' : 'border-gray-300'
                                }`}
                            />
                            {errors.email && (
                                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                            )}
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Teléfono
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                                    errors.phone ? 'border-red-500' : 'border-gray-300'
                                }`}
                            />
                            {errors.phone && (
                                <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                            )}
                        </div>

                        {/* Date of birth */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Fecha de Nacimiento
                            </label>
                            <input
                                type="date"
                                name="date_of_birth"
                                value={formData.date_of_birth}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>

                        {/* Emergency contact */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Contacto de Emergencia
                            </label>
                            <input
                                type="text"
                                name="emergency_contact"
                                value={formData.emergency_contact}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>

                        {/* Emergency phone */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Teléfono de Emergencia
                            </label>
                            <input
                                type="tel"
                                name="emergency_phone"
                                value={formData.emergency_phone}
                                onChange={handleChange}
                                placeholder="1234567890"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>
                    </div>

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
                            {loading ? 'Guardando...' : (member ? 'Actualizar' : 'Crear')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default MemberModal;