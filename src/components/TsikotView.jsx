import React, { useState } from 'react';
import { calculateMiscTotal, formatCurrency } from '../utils/helpers';
import EditTsikotModal from './EditTsikotModal';
import ConfirmationModal from './ConfirmationModal';
import { useAuth } from '../contexts/AuthContext';

function TsikotView({ tsikots, reload, supabase, formatDate, isBefore }) {
  const { isAdmin } = useAuth();
  const [form, setForm] = useState({
    car: '',
    date_bought: formatDate(new Date()),
    buy_price: '',
    date_sold: '',
    sell_price: '',
    initialMisc: [],
    newMisc: { date: formatDate(new Date()), amount: '', notes: '' },
    isAddingMisc: false
  });
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [initialEditData, setInitialEditData] = useState(null);

  // Confirmation State
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, type: null, id: null });

  async function handleSave() {
    if (!form.car || !form.date_bought || !form.buy_price || Number(form.buy_price) <= 0) {
      alert('Please fill in the required fields and enter a valid price');
      return;
    }

    setSaving(true);

    if (form.date_sold && isBefore(form.date_sold, form.date_bought)) {
      alert('"Date Sold" cannot be earlier than "Date Bought".');
      setSaving(false);
      return;
    }

    const { error } = await supabase.from('tsikot').insert({
      car: form.car,
      date_bought: form.date_bought,
      buy_price: Number(form.buy_price),
      date_sold: form.date_sold || null,
      sell_price: form.sell_price ? Number(form.sell_price) : null,
      miscellaneous: form.initialMisc
    });

    if (error) {
      console.error('Error saving:', error);
      setSaving(false);
      return;
    }

    setForm({
      car: '',
      date_bought: formatDate(new Date()),
      buy_price: '',
      date_sold: '',
      sell_price: '',
      initialMisc: [],
      newMisc: { date: formatDate(new Date()), amount: '', notes: '' },
      isAddingMisc: false
    });
    setSaving(false);
    reload();
  }

  function confirmDelete(id) {
    setConfirmConfig({ isOpen: true, type: 'single', id });
  }

  function confirmBulkDelete() {
    if (selectedIds.length === 0) return alert('No cars selected.');
    setConfirmConfig({ isOpen: true, type: 'bulk', id: null });
  }

  async function handleConfirmAction() {
    setConfirmConfig({ ...confirmConfig, isOpen: false });

    if (confirmConfig.type === 'single') {
      const { error } = await supabase.from('tsikot').delete().eq('id', confirmConfig.id);
      if (!error) {
        setSelectedIds(prev => prev.filter(x => x !== confirmConfig.id));
        reload();
      }
    } else if (confirmConfig.type === 'bulk') {
      const { error } = await supabase.from('tsikot').delete().in('id', selectedIds);
      if (!error) {
        setSelectedIds([]);
        reload();
      }
    }
  }

  function toggleSelect(id) {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  }

  function handleNewMiscAdd() {
    if (!form.newMisc.amount || Number(form.newMisc.amount) <= 0) {
      alert('Please enter a valid amount for the miscellaneous expense.');
      return;
    }
    const newExpense = {
      date: form.newMisc.date,
      amount: Number(form.newMisc.amount),
      notes: form.newMisc.notes || ''
    };
    setForm(prev => ({
      ...prev,
      initialMisc: [...prev.initialMisc, newExpense],
      newMisc: { date: formatDate(new Date()), amount: '', notes: '' }
    }));
  }

  function handleRemoveNewMisc(index) {
    setForm(prev => ({
      ...prev,
      initialMisc: prev.initialMisc.filter((_, i) => i !== index)
    }));
  }

  function startEdit(t) {
    if (!isAdmin) return;
    const editForm = {
      car: t.car,
      date_bought: t.date_bought ? formatDate(t.date_bought) : '',
      buy_price: String(t.buy_price),
      date_sold: t.date_sold ? formatDate(t.date_sold) : '',
      sell_price: t.sell_price ? String(t.sell_price) : '',
      miscellaneous: Array.isArray(t.miscellaneous)
        ? t.miscellaneous.map(m => ({ ...m, date: m.date || t.date_bought }))
        : []
    };

    setInitialEditData({
      editingId: t.id,
      editForm: editForm
    });
    setIsModalOpen(true);
  }

  function handleModalSave() {
    setIsModalOpen(false);
    setInitialEditData(null);
    reload();
  }

  function handleModalCancel() {
    setIsModalOpen(false);
    setInitialEditData(null);
  }

  const sortedTsikots = [...tsikots].sort((a, b) => new Date(b.date_bought) - new Date(a.date_bought));

  // Common Input Style
  const inputStyle = "bg-[#F0EFEA] border-2 border-black rounded-none px-2 h-10  text-sm placeholder:text-stone-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-full";

  return (
    <div className='max-w-7xl mx-auto'>
      <h3 className='text-2xl md:text-3xl font-bold mb-6 text-stone-800'>My Tsikots</h3>

      <ConfirmationModal 
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.type === 'bulk' ? 'Delete Multiple Cars?' : 'Delete Car?'}
        message={confirmConfig.type === 'bulk' ? `Are you sure you want to delete ${selectedIds.length} cars? This action cannot be undone.` : "Are you sure you want to delete this car? This action cannot be undone."}
        isDangerous={true}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
      />

      {isAdmin && selectedIds.length > 0 && (
        <div className='mb-4 flex items-center gap-3 bg-rose-50 p-3 border-2 border-rose-200'>
          <div className='text-sm text-rose-700'>{selectedIds.length} selected</div>
          <button
            onClick={confirmBulkDelete}
            className='px-3 py-1 bg-rose-600 text-white text-sm hover:bg-rose-700 transition-colors rounded-none'
          >
            Delete Selected
          </button>
        </div>
      )}

      {isAdmin && (
        <div className='mb-6 p-5 bg-[#F0EFEA] shadow-sm border-2 border-black'>
            <h4 className='font-semibold mb-4 text-stone-700'>Add New Car</h4>
            
           {/* --- MODIFIED GRID STARTS HERE --- */}
            <div className='grid grid-cols-10 gap-y-3 gap-x-2'>
            
            {/* Car Model (Unchanged) */}
            <div className='flex flex-col col-span-10'>
                <label className='text-xs font-medium mb-1 text-stone-500'>Car Model</label>
                <input
                type='text'
                placeholder='Car Model'
                className={inputStyle}
                value={form.car}
                onChange={e => setForm({ ...form, car: e.target.value })}
                />
            </div>

            {/* Date Bought */}
            {/* Mobile: Row 2, Col 1-5 | Desktop: Row 2, Col 1-5 */}
            <div className='flex flex-col col-span-4 md:col-span-5'>
                <label className='text-xs font-medium mb-1 text-stone-500'>Date Bought</label>
                <input
                type='date'
                className={inputStyle}
                value={form.date_bought}
                onChange={e => setForm({ ...form, date_bought: e.target.value })}
                />
            </div>

            {/* Date Sold (MOVED UP) */}
            {/* Mobile: Row 2, Col 6-10 | Desktop: Row 3, Col 1-5 */}
            <div className='flex flex-col col-span-4 md:col-span-5 md:col-start-1 md:row-start-3'>
                <label className='text-xs font-medium mb-1 text-stone-500'>Date Sold (opt)</label>
                <input
                type='date'
                className={inputStyle}
                value={form.date_sold}
                onChange={e => setForm({ ...form, date_sold: e.target.value })}
                />
            </div>

            {/* Buy Price (MOVED DOWN) */}
            {/* Mobile: Row 3, Col 1-5 | Desktop: Row 2, Col 6-10 */}
            <div className='flex flex-col col-span-5 md:col-start-6 md:row-start-2'>
                <label className='text-xs font-medium mb-1 text-stone-500'>Buy Price</label>
                <input
                type='number'
                step='0.01'
                placeholder='Buy Price'
                className={`${inputStyle} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                value={form.buy_price}
                onChange={e => setForm({ ...form, buy_price: e.target.value })}
                />
            </div>

            {/* Sell Price */}
            {/* Mobile: Row 3, Col 6-10 | Desktop: Row 3, Col 6-10 */}
            <div className='flex flex-col col-span-5 md:col-start-6 md:row-start-3'>
                <label className='text-xs font-medium mb-1 text-stone-500'>Sell Price (opt)</label>
                <input
                type='number'
                step='0.01'
                placeholder='Sell Price'
                className={`${inputStyle} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                value={form.sell_price}
                onChange={e => setForm({ ...form, sell_price: e.target.value })}
                />
            </div>
            </div>
            {/* --- MODIFIED GRID ENDS HERE --- */}

            <div className='mt-4'>
            {form.initialMisc.length > 0 && (
                <h5 className='font-medium text-sm mb-2 text-stone-600'>Initial Miscellaneous Expenses:</h5>
            )}
            <div className='space-y-2 mb-4 max-h-40 overflow-y-auto pr-2'>
                {form.initialMisc.map((item, index) => (
                <div key={index} className='flex items-center justify-between bg-[#F0EFEA] p-2 border-2 border-black'>
                    <div className='text-sm text-stone-600'>
                    <span className='text-xs text-stone-500 mr-2'>{formatDate(item.date, 'MMM D')}</span>
                    <span className='font-medium text-stone-800 mr-2'>{formatCurrency(item.amount)}</span>
                    <span>({item.notes || 'No Notes'})</span>
                    </div>
                    <button
                    type='button'
                    onClick={() => handleRemoveNewMisc(index)}
                    className='text-rose-500 hover:text-rose-700 text-xs font-bold uppercase'
                    >
                    Remove
                    </button>
                </div>
                ))}
            </div>

            {!form.isAddingMisc && form.initialMisc.length === 0 && (
                <button
                onClick={() => setForm(prev => ({ ...prev, isAddingMisc: true }))}
                className='px-3 py-2 bg-stone-200 text-stone-700 hover:bg-stone-300 text-sm border-2 border-black rounded-none font-medium'
                >
                Add Initial Miscellaneous Expense
                </button>
            )}

            {(form.isAddingMisc || form.initialMisc.length > 0) && (
                // 1. Replaced the "box" div with this border-top div
                <div className='pt-3 mt-3 border-t-2 border-black'>
                    {/* 2. Added a 10-column grid, aligning items to the end (bottom) */}
                    <div className='grid grid-cols-10 gap-y-3 gap-x-2 items-end'>
                        {/* 3. Date field: 50% on mobile, 30% on desktop */}
                        <div className='flex flex-col col-span-4 md:col-span-3'>
                            <label className='text-xs font-medium mb-1 text-stone-500'>Date</label>
                            <input
                            type='date'
                            className={inputStyle}
                            value={form.newMisc.date}
                            onChange={e => setForm(prev => ({ ...prev, newMisc: { ...prev.newMisc, date: e.target.value } }))}
                            />
                        </div>
                        {/* 4. Amount field: 50% on mobile, 20% on desktop */}
                        <div className='flex flex-col col-span-6 md:col-span-3'>
                            <label className='text-xs font-medium mb-1 text-stone-500'>Amount</label>
                            <input
                            type='number'
                            step='0.01'
                            placeholder='0.00'
                            className={`${inputStyle} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                            value={form.newMisc.amount}
                            onChange={e => setForm(prev => ({ ...prev, newMisc: { ...prev.newMisc, amount: e.target.value } }))}
                            />
                        </div>
                        {/* 5. Notes field: 100% on mobile, 30% on desktop */}
                        <div className='flex flex-col col-span-10 md:col-span-4'>
                            <label className='text-xs font-medium mb-1 text-stone-500'>Notes</label>
                            <input
                            type='text'
                            placeholder='Expense details...'
                            className={inputStyle}
                            value={form.newMisc.notes}
                            onChange={e => setForm(prev => ({ ...prev, newMisc: { ...prev.newMisc, notes: e.target.value } }))}
                            />
                        </div>
                        
                        {/* 6. Buttons: 100% on mobile, 20% on desktop */}
                        <div className='col-span-10 md:col-span-2'>
                            <div className='flex gap-2 w-full md:w-auto'>
                                <button
                                type='button'
                                onClick={handleNewMiscAdd}
                                className='flex-1 md:flex-none md:w-10 h-10 bg-green-500 text-white hover:bg-green-600 flex items-center justify-center transition-colors border-2 border-black rounded-none'
                                title="Add"
                                >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                </button>
                                {form.isAddingMisc && form.initialMisc.length === 0 && (
                                <button
                                    type='button'
                                    onClick={() => setForm(prev => ({ ...prev, isAddingMisc: false, newMisc: { date: formatDate(new Date()), amount: '', notes: '' } }))}
                                    className='flex-1 md:flex-none md:w-10 h-10 bg-stone-200 text-stone-600 hover:bg-stone-300 hover:text-rose-600 flex items-center justify-center transition-colors border-2 border-black rounded-none'
                                    title="Cancel"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            </div>

            <button
            onClick={handleSave}
            disabled={saving || !form.car || !form.buy_price}
            className='mt-4 px-6 py-2 bg-indigo-600 text-white hover:bg-indigo-700 font-medium shadow-sm transition-all rounded-none'
            >
            {saving ? 'Saving...' : 'Save Car'}
            </button>
        </div>
      )}

      <div className='bg-[#F0EFEA] shadow-sm border-2 border-black overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='min-w-full border-collapse whitespace-nowrap'>
            <thead>
              <tr className='bg-[#F0EFEA] border-b-2 border-black'>
                {isAdmin && (
                    <th className='p-3 text-center'>
                    <input
                        type='checkbox'
                        checked={selectedIds.length === sortedTsikots.length && sortedTsikots.length > 0}
                        onChange={e =>
                        setSelectedIds(e.target.checked ? sortedTsikots.map(t => t.id) : [])
                        }
                        aria-label='select all'
                        className="accent-indigo-600 h-4 w-4"
                    />
                    </th>
                )}
                <th className='p-3 text-left text-xs md:text-sm font-semibold text-stone-600 uppercase tracking-wider'>Car</th>
                <th className='p-3 text-left text-xs md:text-sm font-semibold text-stone-600 uppercase tracking-wider'>Date Bought</th>
                <th className='p-3 text-right text-xs md:text-sm font-semibold text-stone-600 uppercase tracking-wider'>Buy Price</th>
                <th className='p-3 text-left text-xs md:text-sm font-semibold text-stone-600 uppercase tracking-wider'>Date Sold</th>
                <th className='p-3 text-right text-xs md:text-sm font-semibold text-stone-600 uppercase tracking-wider'>Sell Price</th>
                <th className='p-3 text-right text-xs md:text-sm font-semibold text-stone-600 uppercase tracking-wider'>Misc. Cost</th>
                {isAdmin && <th className='p-3 text-center text-xs md:text-sm font-semibold text-stone-600 uppercase tracking-wider'>Action</th>}
              </tr>
            </thead>
            <tbody className='divide-y-0'>
              {sortedTsikots.map(t => {
                const totalMisc = calculateMiscTotal(t.miscellaneous || []);
                return (
                  <tr key={t.id} className='hover:bg-gray-100 transition-colors cursor-pointer' onDoubleClick={() => startEdit(t)}>
                    {isAdmin && (
                        <td className='p-3 text-center'>
                        <input
                            type='checkbox'
                            checked={selectedIds.includes(t.id)}
                            onChange={() => toggleSelect(t.id)}
                            aria-label={`select ${t.id}`}
                            className="accent-indigo-600 h-4 w-4"
                        />
                        </td>
                    )}
                    <td className='p-3 text-xs md:text-sm text-stone-800'>{t.car}</td>
                    <td className='p-3 text-xs md:text-sm text-stone-600'>{t.date_bought ? formatDate(t.date_bought, 'MMM D, YYYY') : '-'}</td>
                    <td className='p-3 text-xs md:text-sm text-right text-stone-800 font-medium'>{formatCurrency(t.buy_price)}</td>
                    <td className='p-3 text-xs md:text-sm text-stone-600'>{t.date_sold ? formatDate(t.date_sold, 'MMM D, YYYY') : '-'}</td>
                    <td className='p-3 text-xs md:text-sm text-right text-stone-800 font-medium'>{t.sell_price ? formatCurrency(t.sell_price) : '-'}</td>

                    <td className='p-3 text-xs md:text-sm text-right relative group'>
                      <span className={totalMisc > 0 ? 'font-bold text-rose-600' : 'text-stone-400'}>
                        {totalMisc > 0 ? formatCurrency(totalMisc) : '-'}
                      </span>
                      {totalMisc > 0 && (
                        <div className='absolute right-0 top-full mt-1 w-64 bg-[#F0EFEA] border-2 border-black text-stone-800 text-xs p-3 shadow-lg z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity'>
                          <div className='font-bold mb-1 border-b-2 border-black pb-1'>Miscellaneous Expenses:</div>
                          {(Array.isArray(t.miscellaneous) ? t.miscellaneous : []).map((item, index) => (
                            <div key={index} className='flex justify-between py-1'>
                              <span>{item.date ? formatDate(item.date, 'MMM D') : '...'}</span>
                              <span className='truncate max-w-[80px]'>{item.notes || 'N/A'}</span>
                              <span>{formatCurrency(item.amount)}</span>
                            </div>
                          ))}
                          <div className='mt-1 pt-1 border-t-2 border-black font-bold flex justify-between'>
                            <span>Total:</span>
                            <span>{formatCurrency(totalMisc)}</span>
                          </div>
                        </div>
                      )}
                    </td>

                    {isAdmin && (
                        <td className='p-3 text-center text-xs md:text-sm'>
                        <div className='flex justify-center gap-2'>
                            <button onClick={() => startEdit(t)} className='text-indigo-600 hover:text-indigo-800 font-medium'>
                            Edit
                            </button>
                            <button
                            onClick={() => confirmDelete(t.id)}
                            className='text-rose-600 hover:text-rose-800 disabled:text-stone-400 font-medium'
                            >
                            Delete
                            </button>
                        </div>
                        </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && initialEditData && (
        <EditTsikotModal
          initialData={initialEditData}
          onSave={handleModalSave}
          onCancel={handleModalCancel}
          supabase={supabase}
          formatDate={formatDate}
          isBefore={isBefore}
        />
      )}
    </div>
  );
}

export default TsikotView;