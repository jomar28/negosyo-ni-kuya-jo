import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { formatDate } from '../utils/interest';
import ConfirmationModal from './ConfirmationModal';

function RateScheduleView({ rateSchedule = [], onRatesChange }) {
    const [form, setForm] = useState({ 
    effective_date: formatDate(new Date()), 
    annual_rate: '' 
    });
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null); 
  
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, id: null });

  const rates = [...rateSchedule].sort((a, b) => 
    new Date(b.effective_date) - new Date(a.effective_date)
  );

  function startEdit(rate) {
    setEditingId(rate.id);
    setForm({
      effective_date: rate.effective_date,
      annual_rate: String(rate.annual_rate * 100) 
    });
  }

    function cancelEdit() {
    setEditingId(null);
    // FIX: Reset date to TODAY on cancel (instead of '')
    setForm({ effective_date: formatDate(new Date()), annual_rate: '' }); 
    }

  async function handleSave() {
    if (!form.effective_date || !form.annual_rate) return;
    setLoading(true);
    
    const decimalRate = Number(form.annual_rate) / 100;
    let error = null;

    if (editingId) {
      const res = await supabase
        .from('rate_changes')
        .update({ effective_date: form.effective_date, annual_rate: decimalRate })
        .eq('id', editingId);
      error = res.error;
    } else {
      const res = await supabase
        .from('rate_changes')
        .insert({ effective_date: form.effective_date, annual_rate: decimalRate });
      error = res.error;
    }

    if (!error) {
      cancelEdit();
      if (onRatesChange) onRatesChange();
    } else {
      alert('Error saving rate rule');
      console.error(error);
    }
    setLoading(false);
  }

  function confirmDelete(id) {
    setConfirmConfig({ isOpen: true, id });
  }

  async function handleDelete() {
    setConfirmConfig({ ...confirmConfig, isOpen: false });
    const { error } = await supabase.from('rate_changes').delete().eq('id', confirmConfig.id);
    
    if (!error) {
        if (onRatesChange) onRatesChange();
        if (editingId === confirmConfig.id) cancelEdit();
    } else {
        alert('Failed to delete rate rule.');
    }
  }

  // Unified Disabled Button Style
  const disabledBtnStyle = "disabled:bg-stone-300 disabled:text-stone-500 disabled:border-stone-300 disabled:cursor-not-allowed";

  return (
    <div className='max-w-4xl mx-auto'>
      <h3 className='text-3xl font-bold mb-6 text-gray-900'>Interest Rate Schedule</h3>
      
      <ConfirmationModal 
        isOpen={confirmConfig.isOpen}
        title="Delete Rate Rule?"
        message="Are you sure? This will affect interest calculations for that period."
        isDangerous={true}
        onConfirm={handleDelete}
        onCancel={() => setConfirmConfig({ isOpen: false, id: null })}
      />

      <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
        
        {/* FORM */}
        <div className='p-6 bg-[#F0EFEA] border-2 border-black h-fit'>
          <h4 className='font-bold mb-4 uppercase tracking-wider'>
            {editingId ? 'Edit Rate Rule' : 'Add New Rate'}
          </h4>

          <div className='grid grid-cols-10 gap-y-3 gap-x-2'>
          <div className='flex flex-col col-span-4 md:col-span-10'>
            <label className='block text-xs font-bold uppercase text-gray-500 mb-1'>Effective Date</label>
            <input 
              type="date" 
              className="w-full bg-[#F0EFEA] border-2 border-black p-2 rounded-none outline-none focus:ring-2 focus:ring-indigo-600"
              value={form.effective_date}
              onChange={e => setForm({...form, effective_date: e.target.value})}
            />
          </div>

          <div className='flex flex-col col-span-10 mb-6'>
            <label className='block text-xs font-bold uppercase text-gray-500 mb-1'>New Rate (%)</label>
            <input 
              type="number" 
              placeholder="e.g. 16"
              className="w-full bg-[#F0EFEA] border-2 border-black p-2 rounded-none outline-none focus:ring-2 focus:ring-indigo-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              value={form.annual_rate}
              onChange={e => setForm({...form, annual_rate: e.target.value})}
            />
          </div>
          </div>

          <div className="flex gap-2">
            <button 
                onClick={handleSave}
                disabled={loading || !form.effective_date || !form.annual_rate}
                className={`flex-1 bg-indigo-600 text-white font-bold uppercase py-3 border-2 border-black hover:bg-indigo-700 transition-colors ${disabledBtnStyle}`}
            >
                {loading ? 'Saving...' : (editingId ? 'Update Rate' : 'Add Rate Rule')}
            </button>
            
            {editingId && (
                <button 
                    onClick={cancelEdit}
                    disabled={loading}
                    className='px-4 bg-stone-200 text-stone-700 font-bold uppercase py-3 border-2 border-black hover:bg-stone-300 transition-colors'
                >
                    Cancel
                </button>
            )}
          </div>
        </div>

        {/* LIST */}
        <div className='bg-[#F0EFEA] border-2 border-black p-6'>
          <h4 className='font-bold mb-4 uppercase tracking-wider'>Active Schedule</h4>
          
          <div className='space-y-0 divide-y-2 divide-stone-100'>
            {rates.map((r) => (
              <div key={r.id} className={`flex justify-between items-center py-3 ${editingId === r.id ? 'bg-indigo-200 -mx-2 px-2' : ''}`}>
                <div>
                  <div className='font-bold text-gray-900'>{(r.annual_rate * 100).toFixed(2)}%</div>
                  <div className='text-xs text-gray-500'>Effective: {formatDate(r.effective_date, 'MMM D, YYYY')}</div>
                </div>
                
                <div className="flex items-center gap-3">
                    <span className='text-xs font-bold bg-green-100 text-green-800 px-2 py-1 rounded-full border border-green-200'>
                        Active
                    </span>
                    
                    {/* Action Buttons - Always Visible */}
                    <div className="flex gap-2">
                        <button 
                            onClick={() => startEdit(r)}
                            className="text-indigo-600 hover:text-indigo-800 text-xs font-bold uppercase"
                        >
                            Edit
                        </button>
                        <button 
                            onClick={() => confirmDelete(r.id)}
                            className="text-rose-500 hover:text-rose-700 text-xs font-bold uppercase"
                        >
                            Delete
                        </button>
                    </div>
                </div>
              </div>
            ))}

            <div className='flex justify-between items-center py-3 opacity-75'>
              <div>
                <div className='font-bold text-gray-500'>14.00%</div>
                <div className='text-xs text-gray-400'>Default</div>
              </div>
              <span className='text-xs font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded-full border border-gray-200'>
                Fallback
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RateScheduleView;