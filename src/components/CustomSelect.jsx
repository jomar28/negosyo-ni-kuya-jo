import React, { useState, useRef, useEffect } from 'react';

function CustomSelect({ value, options, onChange, disabled = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    if (disabled) return;
    onChange(option);
    setIsOpen(false);
  };

  const toggleOpen = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={toggleOpen}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between
          border-2 border-black px-2 h-10 text-sm text-left
          focus:outline-none transition-colors
          ${disabled 
            ? 'bg-stone-200 text-stone-500 cursor-not-allowed opacity-70' 
            : 'bg-[#F0EFEA] text-gray-900 cursor-pointer focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
          }
        `}
      >
        <span className="truncate block">{value}</span>
        <svg 
          className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${disabled ? 'text-stone-400' : 'text-gray-700'}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border-2 border-black shadow-lg max-h-60 overflow-auto">
          {options.map((option) => (
            <div
              key={option}
              onClick={() => handleSelect(option)}
              className={`
                px-3 py-2 text-sm cursor-pointer hover:bg-indigo-50 transition-colors
                ${option === value ? 'bg-indigo-100 font-semibold text-indigo-900' : 'text-gray-900'}
              `}
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CustomSelect;