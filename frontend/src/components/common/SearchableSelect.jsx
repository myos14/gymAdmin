import { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

const SearchableSelect = ({ 
    options = [], 
    value, 
    onChange, 
    placeholder = "Buscar...",
    displayKey = "name",
    valueKey = "id",
    disabled = false,
    error = null
    }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
        if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
            setIsOpen(false);
        }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filter options based on search term
    const filteredOptions = options.filter(option => {
        const displayValue = typeof option === 'object' 
            ? option[displayKey]?.toLowerCase() 
            : option.toLowerCase();
        return displayValue?.includes(searchTerm.toLowerCase());
    });

    // Get selected option display text
    const selectedOption = options.find(opt => 
        (typeof opt === 'object' ? opt[valueKey] : opt) === value
    );
    const selectedText = selectedOption 
        ? (typeof selectedOption === 'object' ? selectedOption[displayKey] : selectedOption)
        : '';

    const handleSelect = (option) => {
        const val = typeof option === 'object' ? option[valueKey] : option;
        onChange(val);
        setIsOpen(false);
        setSearchTerm('');
    };

    return (
        <div ref={wrapperRef} className="relative">
        {/* Selected value display / Search input */}
        <div
            className={`
            relative w-full bg-white border rounded-md shadow-sm
            ${error ? 'border-error-500' : 'border-gray-300'}
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer hover:border-primary-400'}
            `}
            onClick={() => !disabled && setIsOpen(!isOpen)}
        >
            <div className="flex items-center px-3 py-2">
                <MagnifyingGlassIcon className="w-5 h-5 text-text-muted mr-2" />
                <input
                    type="text"
                    className="flex-1 outline-none bg-transparent"
                    placeholder={selectedText || placeholder}
                    value={searchTerm}
                    onChange={(e) => {
                    setSearchTerm(e.target.value);
                    if (!isOpen) setIsOpen(true);
                    }}
                    disabled={disabled}
                    onClick={(e) => e.stopPropagation()}
                />
                <ChevronDownIcon 
                    className={`w-5 h-5 text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
            </div>
        </div>

        {/* Error message */}
        {error && (
            <p className="mt-1 text-sm text-error-600">{error}</p>
        )}

        {/* Dropdown list */}
        {isOpen && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {filteredOptions.length === 0 ? (
                    <div className="px-3 py-2 text-text-muted text-sm">
                        No se encontraron resultados
                    </div>
                ) : (
                    filteredOptions.map((option, index) => {
                        const optionValue = typeof option === 'object' ? option[valueKey] : option;
                        const optionDisplay = typeof option === 'object' ? option[displayKey] : option;
                        const isSelected = optionValue === value;

                        return (
                            <div
                                key={index}
                                className={`
                                    px-3 py-2 cursor-pointer transition-colors
                                    ${isSelected 
                                    ? 'bg-primary-100 text-primary-800 font-medium' 
                                    : 'hover:bg-primary-50'
                                    }
                                `}
                                onClick={() => handleSelect(option)}
                                >
                                {optionDisplay}
                            </div>
                        );
                    })
                )}
            </div>
        )}
        </div>
    );
};

export default SearchableSelect;