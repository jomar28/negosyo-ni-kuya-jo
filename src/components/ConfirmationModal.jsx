import React from 'react';
import { createPortal } from 'react-dom'; // 1. Import createPortal

function ConfirmationModal({ isOpen, title, message, onConfirm, onCancel, isDangerous = false }) {
  if (!isOpen) return null;

  // 2. Wrap the JSX in createPortal(..., document.body)
  return createPortal(
    <div className='fixed inset-0 z-[150] bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in'>
      <div className='bg-[#F0EFEA] w-full max-w-sm border-2 border-black transform transition-all scale-100'>
        <div className='p-6'>
          <h3 className={`text-lg font-bold mb-2 uppercase tracking-tight ${isDangerous ? 'text-rose-600' : 'text-stone-900'}`}>
            {title}
          </h3>
          <p className='text-stone-800 text-sm leading-relaxed font-medium'>
            {message}
          </p>
        </div>
        
        <div className='bg-[#F0EFEA] px-6 py-4 flex justify-end gap-3 border-t-2 border-black'>
          <button
            onClick={onCancel}
            className='px-4 py-2 text-stone-900 bg-white border-2 border-black hover:bg-gray-100 font-bold uppercase text-xs tracking-wider transition-colors rounded-none'
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-white font-bold uppercase text-xs tracking-wider border-2 border-black transition-all rounded-none ${
              isDangerous 
                ? 'bg-rose-600 hover:bg-rose-700' 
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>,
    document.body // Target destination
  );
}

export default ConfirmationModal;