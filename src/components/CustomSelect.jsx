import React, { useState, useEffect, useRef } from 'react';

function CustomSelect({ value, onChange, options }) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Close dropdown if clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      {/* Main Button (Looks like the input) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-[#F0EFEA] border-2 border-black px-2 h-10 flex items-center justify-between text-left focus:ring-2 focus:ring-indigo-500 outline-none"
      >
        <span className="text-gray-900 text-sm">{value}</span>
        {/* Custom Arrow Icon */}
        <svg className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 top-full left-0 w-full bg-[#F0EFEA] border-2 border-black border-t-0 shadow-lg max-h-60 overflow-auto">
          {options.map((option) => (
            <div
              key={option}
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
              className={`px-3 py-2 cursor-pointer hover:bg-indigo-50 hover:text-indigo-700 text-sm border-b border-gray-200 last:border-0 font-medium ${
                value === option ? 'bg-indigo-100 text-indigo-800' : 'text-gray-900'
              }`}
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