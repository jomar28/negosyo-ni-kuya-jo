import React, { useEffect, useState, useRef } from 'react';
import { simpleIsEqual, formatCurrency } from '../utils/helpers';
import ConfirmationModal from './ConfirmationModal';

function EditTsikotModal({
  initialData,
  onSave,
  onCancel,
  supabase,
  isBefore,
  formatDate
}) {
  const [editForm, setEditForm] = useState(initialData.editForm);
  const [isSaving, setIsSaving] = useState(false);
  const modalRef = useRef(null);
  
  const [editingMiscIndex, setEditingMiscIndex] = useState(null);
  const [newMisc, setNewMisc] = useState({ date: formatDate(new Date()), amount: '', notes: '' });
  const isDirty = !simpleIsEqual(initialData.editForm, editForm);
  
  // NEW: Discard state
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  useEffect(() => {
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        handleAttemptCancel();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDirty, onCancel, handleAttemptCancel]); // Added handleAttemptCancel to dependency array

  function handleChange(e) {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  }

  // NEW: Handle discard logic
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

  function handleAddMisc() {
    if (!newMisc.amount || Number(newMisc.amount) <= 0) {
      alert('Please enter a valid amount for the miscellaneous expense.');
      return;
    }

    const newExpense = {
      date: newMisc.date,
      amount: Number(newMisc.amount),
      notes: newMisc.notes || ''
    };

    setEditForm(prev => ({
      ...prev,
      miscellaneous: [...(Array.isArray(prev.miscellaneous) ? prev.miscellaneous : []), newExpense]
    }));

    setNewMisc({ date: formatDate(new Date()), amount: '', notes: '' });
  }

  function handleUpdateMisc() {
    if (!newMisc.amount || Number(newMisc.amount) <= 0) {
      alert('Please enter a valid amount.');
      return;
    }
    const updatedExpense = {
      date: newMisc.date,
      amount: Number(newMisc.amount),
      notes: newMisc.notes || ''
    };

    const updatedMiscList = editForm.miscellaneous.map((item, index) => {
      if (index === editingMiscIndex) {
        return updatedExpense;
      }
      return item;
    });

    setEditForm(prev => ({
      ...prev,
      miscellaneous: updatedMiscList
    }));

    setNewMisc({ date: formatDate(new Date()), amount: '', notes: '' });
    setEditingMiscIndex(null);
  }

  function handleRemoveMisc(index) {
    if (index === editingMiscIndex) {
        setNewMisc({ date: formatDate(new Date()), amount: '', notes: '' });
        setEditingMiscIndex(null);
    }
    setEditForm(prev => ({
      ...prev,
      miscellaneous: prev.miscellaneous.filter((_, i) => i !== index)
    }));
  }
  
  function handleStartEditMisc(index) {
    const itemToEdit = editForm.miscellaneous[index];
    setNewMisc({
        date: itemToEdit.date,
        amount: String(itemToEdit.amount),
        notes: itemToEdit.notes
    });
    setEditingMiscIndex(index);
  }

  async function handleSave() {
    if (!editForm.car || !editForm.date_bought || !editForm.buy_price || Number(editForm.buy_price) <= 0) {
      alert('Please fill in the required fields and enter a valid buy price');
      return;
    }

    setIsSaving(true);

    if (editForm.date_sold && isBefore(editForm.date_sold, editForm.date_bought)) {
      alert('"Date Sold" cannot be earlier than "Date Bought".');
      setIsSaving(false);
      return;
    }

    const { error } = await supabase
      .from('tsikot')
      .update({
        car: editForm.car,
        date_bought: editForm.date_bought,
        buy_price: Number(editForm.buy_price),
        date_sold: editForm.date_sold || null,
        sell_price: editForm.sell_price ? Number(editForm.sell_price) : null,
        miscellaneous: editForm.miscellaneous,
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
  const inputStyle = "bg-[#F0EFEA] border-2 border-black rounded-none p-2 h-[38px] focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-full transition-all";

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
        className='bg-[#F0EFEA] border-2 border-black w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden'
      >
        <div className='p-6 overflow-y-auto'>
          <h2 className='text-2xl font-bold mb-6 text-stone-800'>Edit Car: {editForm.car}</h2>

          {/* --- MODIFIED MAIN FORM GRID --- */}
          <div className='grid grid-cols-10 gap-y-3 gap-x-2 mb-6 border-b-2 border-black pb-4'>
            
            {/* Car Model */}
            <div className='flex flex-col col-span-10'>
              <label className='text-sm font-bold mb-1 text-stone-700'>Car Model</label>
              <input
                type='text'
                name='car'
                placeholder='Car Model'
                className={inputStyle}
                value={editForm.car}
                onChange={handleChange}
              />
            </div>
            
            {/* Date Bought */}
            <div className='flex flex-col col-span-4 md:col-span-5'>
              <label className='text-sm font-bold mb-1 text-stone-700'>Date Bought</label>
              <input
                type='date'
                name='date_bought'
                className={inputStyle}
                value={editForm.date_bought}
                onChange={handleChange}
              />
            </div>

            {/* Date Sold (MOVED UP) */}
            <div className='flex flex-col col-span-4 md:col-span-5 md:col-span-5 md:col-start-1 md:row-start-3'>
              <label className='text-sm font-bold mb-1 text-stone-700'>Date Sold (opt)</label>
              <input
                type='date'
                name='date_sold'
                className={inputStyle}
                value={editForm.date_sold}
                onChange={handleChange}
              />
            </div>
            
            {/* Buy Price (MOVED DOWN) */}
            <div className='flex flex-col col-span-5 md:col-span-5 md:col-start-6 md:row-start-2'>
              <label className='text-sm font-bold mb-1 text-stone-700'>Buy Price</label>
              <input
                type='number'
                step='0.01'
                name='buy_price'
                placeholder='Buy Price'
                className={`${inputStyle} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                value={editForm.buy_price}
                onChange={handleChange}
              />
            </div>
            
            {/* Sell Price */}
            <div className='flex flex-col col-span-5 md:col-span-5 md:col-start-6 md:row-start-3'>
              <label className='text-sm font-bold mb-1 text-stone-700'>Sell Price (opt)</label>
              <input
                type='number'
                step='0.01'
                name='sell_price'
                placeholder='Sell Price'
                className={`${inputStyle} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                value={editForm.sell_price}
                onChange={handleChange}
              />
            </div>
          </div>
          {/* --- END MODIFIED MAIN FORM --- */}


          <h3 className='font-bold mb-3 text-stone-800 uppercase'>Miscellaneous Expenses (tap to edit)</h3>

          <div className='space-y-2 mb-4 max-h-40 overflow-y-auto pr-2'>
            {!Array.isArray(editForm.miscellaneous) || editForm.miscellaneous.length === 0 ? (
              <div className='text-sm text-stone-500 p-2 border-2 border-black bg-white italic'>No miscellaneous expenses recorded.</div>
            ) : (
              editForm.miscellaneous.map((item, index) => (
                <div 
                  key={index} 
                  className={`flex items-center justify-between p-2 border-2 border-black cursor-pointer transition-colors bg-[#F0EFEA] ${
                    editingMiscIndex === index 
                      ? 'bg-indigo-200' 
                      : 'hover:bg-stone-400'
                  }`}
                  onClick={() => handleStartEditMisc(index)}
                >
                  <div className='flex-1 flex items-center text-sm overflow-hidden'>
                    <span className='w-20 text-xs font-bold text-stone-600'>{item.date ? formatDate(item.date, 'MMM D') : 'No Date'}</span>
                    <span className='px-2 text-stone-400'>|</span>
                    <span className='w-24 font-bold text-stone-800'>{formatCurrency(item.amount)}</span>
                    <span className='px-2 text-stone-400'>|</span>
                    <span className='flex-1 text-stone-600 truncate' title={item.notes || 'No Notes'}>
                      {item.notes || 'No Notes'}
                    </span>
                  </div>
                  <button
                    type='button'
                    onClick={(e) => { e.stopPropagation(); handleRemoveMisc(index); }}
                    className='text-rose-600 hover:text-rose-800 text-xs ml-2 font-bold uppercase'
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>

          {/* --- MODIFIED MISC FORM --- */}
          <div className='pt-3 mt-3 border-t-2 border-black'>
            <div className='grid grid-cols-10 gap-y-3 gap-x-2 items-end'>
              
              <div className='flex flex-col col-span-5 md:col-span-3'>
                <label className='text-xs font-bold mb-1 text-stone-700 uppercase'>Date</label>
                <input
                  type='date'
                  className={inputStyle}
                  value={newMisc.date}
                  onChange={e => setNewMisc({ ...newMisc, date: e.target.value })}
                />
              </div>

              <div className='flex flex-col col-span-10 md:col-span-2'>
                <label className='text-xs font-bold mb-1 text-stone-700 uppercase'>Amount</label>
                <input
                  type='number'
                  step='0.01'
                  placeholder='0.00'
                  className={`${inputStyle} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                  value={newMisc.amount}
                  onChange={e => setNewMisc({ ...newMisc, amount: e.target.value })}
                />
              </div>

              <div className='flex flex-col col-span-10 md:col-span-3'>
                <label className='text-xs font-bold mb-1 text-stone-700 uppercase'>Notes</label>
                <input
                  type='text'
                  placeholder='Expense details...'
                  className={inputStyle}
                  value={newMisc.notes}
                  onChange={e => setNewMisc({ ...newMisc, notes: e.target.value })}
                />
              </div>
              
              <div className='col-span-10 md:col-span-2'>
                <div className='flex gap-2 w-full md:w-auto'>
                  <button
                    type='button'
                    onClick={editingMiscIndex !== null ? handleUpdateMisc : handleAddMisc}
                    className={`flex-1 md:flex-none md:w-[38px] h-[38px] text-white flex items-center justify-center transition-colors border-2 border-black rounded-none ${
                      editingMiscIndex !== null 
                        ? 'bg-indigo-600 hover:bg-indigo-700' 
                        : 'bg-green-600 hover:bg-green-700' 
                    }`}
                    title={editingMiscIndex !== null ? "Update Expense" : "Add Expense"}
                  >
                    {editingMiscIndex !== null ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    <span className="ml-2 md:hidden font-bold uppercase text-xs">{editingMiscIndex !== null ? 'Update' : 'Add'}</span>
                  </button>

                  {editingMiscIndex !== null && (
                    <button
                      type='button'
                      onClick={() => {
                        setNewMisc({ date: formatDate(new Date()), amount: '', notes: '' });
                        setEditingMiscIndex(null);
                      }}
                      className='flex-1 md:flex-none md:w-[38px] h-[38px] bg-stone-200 text-stone-600 hover:bg-stone-300 hover:text-rose-600 flex items-center justify-center transition-colors border-2 border-black rounded-none'
                      title="Cancel Editing"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="ml-2 md:hidden font-bold uppercase text-xs">Cancel</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* --- END MODIFIED MISC FORM --- */}

        </div>

        <div className='bg-[#F0EFEA] px-6 py-4 flex justify-end gap-3 border-t-2 border-black flex-shrink-0'>
          <button
            onClick={handleAttemptCancel}
            disabled={isSaving}
            className='px-4 py-2 text-stone-900 bg-white border-2 border-black hover:bg-gray-100 disabled:opacity-50 rounded-none font-medium'
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !isDirty || !editForm.car || Number(editForm.buy_price) <= 0}
            className='px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-stone-400 disabled:cursor-not-allowed border-2 border-black font-medium rounded-none'
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditTsikotModal;