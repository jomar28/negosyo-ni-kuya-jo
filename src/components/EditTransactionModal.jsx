import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { simpleIsEqual } from '../utils/helpers';
import ConfirmationModal from './ConfirmationModal';
import CustomSelect from './CustomSelect'; // Import the new component

function EditTransactionModal({
  initialData,
  onSave,
  onCancel,
}) {
  const [editForm, setEditForm] = useState(initialData.editForm);
  const [isSaving, setIsSaving] = useState(false);
  const modalRef = useRef(null);
  const isDirty = !simpleIsEqual(initialData.editForm, editForm);
  
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  useEffect(() => {
    function handleClickOutside(event) {
      // Check if the click is outside the modal AND not part of a dropdown (dropdowns might portal or render on top)
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        handleAttemptCancel();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDirty, onCancel, handleAttemptCancel]); // Added handleAttemptCancel to dependency array

  // Handle standard inputs (text, date, number)
  function handleChange(e) {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  }

  // Helper for CustomSelect which passes value directly
  function handleSelectChange(name, value) {
    setEditForm(prev => ({ ...prev, [name]: value }));
  }

  function handleAttemptCancel() {
    if (isDirty && !isSaving) {
      setShowDiscardConfirm(true);
    } else {
      onCancel();
    }
  }

  function handleConfirmDiscard() {
    setShowDiscardConfirm(false);
    onCancel();
  }

  async function handleSave() {
    if (!editForm.amount || Number(editForm.amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setIsSaving(true);
    let amountToSave = Number(editForm.amount);

    const { error } = await supabase
      .from('transactions')
      .update({
        date: editForm.date,
        type: editForm.type,
        amount: amountToSave,
        group_name: editForm.group_name,
        notes: editForm.notes
      })
      .eq('id', initialData.editingId);

    setIsSaving(false);

    if (error) {
      console.error('Error updating:', error);
      alert('Failed to save changes. Check console for details.');
      return;
    }

    onSave();
  }

  // Common Input Style
  const inputStyle = "bg-[#F0EFEA] border-2 border-black rounded-none px-2 h-10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-full transition-all";
  
  // Textarea specific style
  const textareaStyle = "bg-[#F0EFEA] border-2 border-black rounded-none p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-full transition-all resize-none";

  return (
    <div className='fixed inset-0 z-[100] bg-stone-900/75 backdrop-blur-sm flex items-center justify-center p-4'>
      
      <ConfirmationModal 
        isOpen={showDiscardConfirm}
        title="Discard Changes?"
        message="You have unsaved changes. Are you sure you want to discard them?"
        isDangerous={true}
        onConfirm={handleConfirmDiscard}
        onCancel={() => setShowDiscardConfirm(false)}
      />

      <div
        ref={modalRef}
        // Added overflow-visible here so the Dropdown can visually "pop out" if needed, 
        // though the inner container handles scrolling.
        className='bg-[#F0EFEA] border-2 border-black w-full max-w-lg max-h-[90vh] flex flex-col transform transition-all scale-100'
      >
        {/* overflow-y-auto handles the scrolling content */}
        <div className='p-6 overflow-y-auto overflow-x-visible'>
          <h2 className='text-2xl font-bold mb-6 text-stone-800 border-b-2 border-black pb-2'>Edit Transaction</h2>
          
          {/* --- MODIFIED GRID --- */}
          <div className='grid grid-cols-10 gap-4'>
            
            {/* Date */}
            <div className='flex flex-col col-span-4 md:col-span-5'>
              <label className='text-xs font-semibold mb-1.5 text-stone-500 uppercase tracking-wider'>Date</label>
              <input
                type='date'
                name='date'
                className={inputStyle}
                value={editForm.date}
                onChange={handleChange}
              />
            </div>

            {/* Type - Using CustomSelect */}
            <div className='flex flex-col col-span-10 md:col-span-5'>
              <label className='text-xs font-semibold mb-1.5 text-stone-500 uppercase tracking-wider'>Type</label>
              <CustomSelect 
                value={editForm.type}
                options={['Withdrawal', 'Payment']}
                onChange={(val) => handleSelectChange('type', val)}
              />
            </div>

            {/* Amount */}
            <div className='flex flex-col col-span-10 md:col-span-5'>
              <label className='text-xs font-semibold mb-1.5 text-stone-500 uppercase tracking-wider'>Amount</label>
              <input
                type='number'
                step='0.01'
                name='amount'
                placeholder='0.00'
                className={`${inputStyle} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                value={editForm.amount}
                onChange={handleChange}
              />
            </div>

            {/* Group - Using CustomSelect */}
            <div className='flex flex-col col-span-10 md:col-span-5'>
              <label className='text-xs font-semibold mb-1.5 text-stone-500 uppercase tracking-wider'>Group</label>
              <CustomSelect 
                value={editForm.group_name}
                options={['Jomar', 'Jeff']}
                onChange={(val) => handleSelectChange('group_name', val)}
              />
            </div>

            {/* Notes */}
            <div className='flex flex-col col-span-10'>
              <label className='text-xs font-semibold mb-1.5 text-stone-500 uppercase tracking-wider'>Notes</label>
              <textarea
                name='notes'
                placeholder='Add notes here...'
                rows='3'
                className={textareaStyle}
                value={editForm.notes}
                onChange={handleChange}
              />
            </div>
          </div>
          {/* --- END MODIFIED GRID --- */}
        </div>
        
        {/* Footer Actions */}
        <div className='bg-[#F0EFEA] px-6 py-4 flex justify-end gap-3 border-t-2 border-black flex-shrink-0'>
          <button
            onClick={handleAttemptCancel}
            disabled={isSaving}
            className='px-5 py-2.5 text-stone-900 bg-white border-2 border-black hover:bg-gray-100 font-medium transition-colors disabled:opacity-50 rounded-none'
          >
            Cancel
          </button>
            <button
            onClick={handleSave}
            disabled={isSaving || !isDirty || !editForm.amount || Number(editForm.amount) <= 0}
            className='px-5 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 border-2 border-black hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] disabled:bg-stone-300 disabled:text-stone-500 disabled:border-stone-300 disabled:shadow-none disabled:cursor-not-allowed font-medium transition-all rounded-none'
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditTransactionModal;