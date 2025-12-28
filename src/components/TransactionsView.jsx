import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
    formatDate, 
    generateMasterLedger, 
    calculateCurrentBalances, 
    getEarliestTransactionDate 
} from '../utils/interest';
import EditTransactionModal from './EditTransactionModal';
import ConfirmationModal from './ConfirmationModal';
import { useAuth } from '../contexts/AuthContext';
import CustomSelect from './CustomSelect';

function TransactionsView({ transactions, rateSchedule = [], groups = [], reload }) {
  const { isAdmin } = useAuth();
  const [viewMode, setViewMode] = useState('all');

  const groupOptions = groups.length > 0 
    ? groups.map(g => g.name).sort() 
    : ['Jomar', 'Jeff'];

  const [form, setForm] = useState({
    date: formatDate(new Date()),
    type: 'Withdrawal',
    amount: '',
    group_name: 'Jomar', 
    is_credit_line: false,
    notes: ''
  });
  
  const [sourceOption, setSourceOption] = useState('Credit Line');
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [initialEditData, setInitialEditData] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, type: null, id: null });

  // 1. Sync is_credit_line
  useEffect(() => {
    let newIsCreditLine = sourceOption === 'Credit Line';
    if (form.type === 'Bank' || form.type === 'Payment') {
        newIsCreditLine = true;
    }
    setForm(f => ({
      ...f,
      is_credit_line: newIsCreditLine
    }));
  }, [sourceOption, form.type]);

  // 2. Handle Auto-selections
  useEffect(() => {
      if (form.type === 'Bank') {
          setSourceOption('Credit Line');
          setForm(f => ({ ...f, group_name: 'Bank' }));
      } else if (form.type === 'Payment') {
          setSourceOption('Credit Line');
      }
  }, [form.type]);

  function checkOverpayment(targetGroup, payAmount) {
      if (form.type === 'Bank' || targetGroup === 'Bank') return true;

      const groupTxs = transactions.filter(t => t.group_name === targetGroup);
      const earliest = getEarliestTransactionDate(groupTxs, targetGroup);
      const today = formatDate(new Date());
      
      const ledger = generateMasterLedger(transactions, targetGroup, earliest, today, rateSchedule);
      const current = calculateCurrentBalances(ledger, earliest);
      
      const totalOwed = current.principal + current.accruedInterest;

      if (payAmount > (totalOwed + 1)) {
          return false;
      }
      return true;
  }

  async function handleSave() {
    if (!form.amount || Number(form.amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    const actualAmount = Number(form.amount);

    if (form.type === 'Payment') {
        const isSafe = checkOverpayment(form.group_name, actualAmount);
        if (!isSafe) {
            alert(`Overpayment detected! "${form.group_name}" balance is lower than this amount. Use "Bank" type if this is a generic repayment.`);
            return;
        }
    }

    setSaving(true);

    const { error } = await supabase.from('transactions').insert({
      ...form,
      amount: actualAmount,
    });

    if (error) {
      console.error('Error saving:', error);
      setSaving(false);
      return;
    }

    setForm({
      date: formatDate(new Date()),
      type: 'Withdrawal',
      amount: '',
      group_name: form.type === 'Bank' ? 'Jomar' : form.group_name,
      is_credit_line: form.is_credit_line, 
      notes: ''
    });
    
    setSaving(false);
    reload();
  }

  function confirmDelete(id) {
    setConfirmConfig({ isOpen: true, type: 'single', id });
  }

  function confirmBulkDelete() {
    if (selectedIds.length === 0) return alert('No transactions selected.');
    setConfirmConfig({ isOpen: true, type: 'bulk', id: null });
  }

  async function handleConfirmAction() {
    setConfirmConfig({ ...confirmConfig, isOpen: false });

    if (confirmConfig.type === 'single') {
      const { error } = await supabase.from('transactions').delete().eq('id', confirmConfig.id);
      if (!error) {
        setSelectedIds(prev => prev.filter(x => x !== confirmConfig.id));
        reload();
      }
    } else if (confirmConfig.type === 'bulk') {
      const { error } = await supabase.from('transactions').delete().in('id', selectedIds);
      if (!error) {
        setSelectedIds([]);
        reload();
      }
    }
  }

  function startEdit(t) {
    if (!isAdmin) return;
    const editForm = {
      date: formatDate(t.date),
      type: t.type,
      amount: String(t.amount),
      group_name: t.group_name,
      is_credit_line: t.is_credit_line || false,
      notes: t.notes || ''
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

  function toggleSelect(id) {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  }

  const filteredTxs = transactions.filter(t => {
    if (viewMode === 'bank') {
      return t.is_credit_line === true;
    }
    return true;
  });

  const sortedTxs = [...filteredTxs].sort((a, b) => {
      const dateDiff = new Date(b.date) - new Date(a.date);
      if (dateDiff !== 0) return dateDiff;
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeB - timeA; 
  });

  const inputStyle = "bg-[#F0EFEA] border-2 border-black rounded-none px-2 h-10 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-full";
  
  return (
    <div className='max-w-7xl mx-auto'>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h3 className='text-2xl md:text-3xl font-bold text-gray-900'>Transactions</h3>
        
        <div className="flex bg-gray-200 p-1 rounded-lg border border-gray-300">
            <button
                onClick={() => setViewMode('all')}
                className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${viewMode === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
                All
            </button>
            <button
                onClick={() => setViewMode('bank')}
                className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${viewMode === 'bank' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
                Bank
            </button>
        </div>
      </div>

      <ConfirmationModal 
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.type === 'bulk' ? 'Delete Transactions?' : 'Delete Transaction?'}
        message="Are you sure? This action cannot be undone."
        isDangerous={true}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
      />

      {isAdmin && (
        <div className='mb-6 p-5 bg-[#F0EFEA] border-2 border-black shadow-sm'>
            <h4 className='font-semibold mb-4 text-gray-900'>Add New Transaction</h4>
            
            <div className='grid grid-cols-10 gap-x-2 gap-y-3'>
            
            <div className='flex flex-col col-span-4 md:col-span-5'>
                <label className='text-xs font-medium mb-1 text-stone-500'>Date</label>
                <input
                type='date'
                className={`${inputStyle}`}
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
                />
            </div>

            <div className='flex flex-col col-span-10 md:col-span-5'>
                <label className='text-xs font-medium mb-1 text-stone-500'>Type</label>
                <CustomSelect 
                  value={form.type}
                  options={['Withdrawal', 'Payment', 'Bank']}
                  onChange={(val) => setForm({ ...form, type: val })}
                />
            </div>

            <div className='flex flex-col col-span-10 md:col-span-5'>
                <label className='text-xs font-medium mb-1 text-stone-500'>Amount</label>
                <input
                type='number'
                step='0.01'
                placeholder='Amount'
                className={`${inputStyle} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
                />
            </div>

            <div className='flex flex-col col-span-10 md:col-span-5'>
                <label className='text-xs font-medium mb-1 text-stone-500'>Group</label>
                <CustomSelect 
                  value={form.group_name}
                  options={groupOptions}
                  disabled={form.type === 'Bank'}
                  onChange={(val) => setForm({ ...form, group_name: val })}
                />
            </div>

            <div className='flex flex-col col-span-10 md:col-span-5'>
                <label className='text-xs font-medium mb-1 text-stone-500'>Source</label>
                <CustomSelect 
                  value={sourceOption}
                  options={['Credit Line', 'Cash']}
                  disabled={form.type === 'Bank' || form.type === 'Payment'}
                  onChange={(val) => setSourceOption(val)}
                />
            </div>

            <div className='flex flex-col col-span-10'>
                <label className='text-xs font-medium mb-1 text-stone-500'>Notes</label>
                <input
                placeholder='Notes'
                className={inputStyle}
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                />
            </div>
            </div>

            <button
            onClick={handleSave}
            disabled={saving || !form.amount}
            className='mt-4 px-6 py-2 bg-indigo-600 text-white hover:bg-indigo-700 font-medium shadow-sm transition-all rounded-none disabled:bg-stone-300 disabled:text-stone-500 disabled:border-stone-300 disabled:cursor-not-allowed'
            >
            {saving ? 'Saving...' : 'Save Transaction'}
            </button>
        </div>
      )}

      {/* Table Section (No Changes here) */}
      <div className='bg-[#F0EFEA] border-2 border-black shadow-sm overflow-hidden'>
        {sortedTxs.length === 0 ? (
            <div className="p-8 text-center text-gray-500 italic">
                {viewMode === 'bank' ? 'No Credit Line transactions found.' : 'No transactions found.'}
            </div>
        ) : (
            <div className='overflow-x-auto'>
                <table className='min-w-full border-collapse whitespace-nowrap'>
                <thead>
                    <tr className='bg-[#F0EFEA] border-b-2 border-black'>
                    {isAdmin && (
                        <th className='p-3 text-center'>
                        {sortedTxs.length > 0 && (
                            <input
                                type='checkbox'
                                checked={selectedIds.length === sortedTxs.length && sortedTxs.length > 0}
                                onChange={e => setSelectedIds(e.target.checked ? sortedTxs.map(t => t.id) : [])}
                                className="accent-indigo-600 h-4 w-4"
                            />
                            )}
                        </th>
                    )}
                    <th className='p-3 text-left text-xs md:text-sm font-semibold text-gray-700 uppercase tracking-wider'>Date</th>
                    <th className='p-3 text-left text-xs md:text-sm font-semibold text-gray-700 uppercase tracking-wider'>Type</th>
                    <th className='p-3 text-right text-xs md:text-sm font-semibold text-gray-700 uppercase tracking-wider'>Amount</th>
                    <th className='p-3 text-left text-xs md:text-sm font-semibold text-gray-700 uppercase tracking-wider'>Group</th>
                    <th className='p-3 text-center text-xs md:text-sm font-semibold text-gray-700 uppercase tracking-wider'>Credit Line</th>
                    <th className='p-3 text-center text-xs md:text-sm font-semibold text-gray-700 uppercase tracking-wider'>{viewMode === 'bank' ? 'Bank Rate' : 'Rate'}</th>
                    <th className='p-3 text-left text-xs md:text-sm font-semibold text-gray-700 uppercase tracking-wider'>Notes</th>
                    {isAdmin && <th className='p-3 text-center text-xs md:text-sm font-semibold text-gray-700 uppercase tracking-wider'>Action</th>}
                    </tr>
                </thead>
                <tbody className='divide-y-0'>
                    {sortedTxs.map(t => {
                    let displayAmount = t.amount;

                    const txDateStr = formatDate(t.date);
                    const activeRateConfig = rateSchedule
                        .filter(r => formatDate(r.effective_date) <= txDateStr)
                        .sort((a, b) => new Date(b.effective_date) - new Date(a.effective_date))[0];
                    let baseRate = activeRateConfig ? Number(activeRateConfig.annual_rate) : 0.14;
                    const finalRate = baseRate;

                    return (
                        <tr key={t.id} className='bg-[#F0EFEA] hover:bg-gray-100 transition-colors' onDoubleClick={() => startEdit(t)}>
                        {isAdmin && (
                            <td className='p-3 text-center'>
                            <input
                                type='checkbox'
                                checked={selectedIds.includes(t.id)}
                                onChange={() => toggleSelect(t.id)}
                                className="accent-indigo-600 h-4 w-4"
                            />
                            </td>
                        )}
                        <td className='p-3 text-xs md:text-sm text-gray-900'>{formatDate(t.date, 'MMM D, YYYY')}</td>
                        <td className='p-3 text-xs md:text-sm'>
                            <span className={`px-2 py-1 text-[10px] md:text-xs font-bold uppercase tracking-wide ${
                                t.type === 'Withdrawal' ? 'text-indigo-700' : 
                                t.type === 'Bank' ? 'text-purple-700 rounded-sm' : 'text-green-700'
                            }`}>
                            {t.type === 'Bank' ? 'Payment' : t.type}
                            </span>
                        </td>
                        <td className='p-3 text-xs md:text-sm text-right font-medium text-gray-900'>
                            {`₱${Number(displayAmount).toLocaleString('en-PH', {minimumFractionDigits: 2})}`}
                        </td>
                        <td className='p-3 text-xs md:text-sm text-stone-600'>{t.group_name}</td>
                        <td className='p-3 text-center text-xs md:text-sm'>
                             {t.is_credit_line ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">BANK</span>
                             ) : <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">CASH</span>}
                        </td>
                        <td className='p-3 text-center text-xs md:text-sm text-stone-500 font-medium'>{(finalRate * 100).toFixed(2)}%</td>
                        <td className='p-3 text-xs md:text-sm text-stone-500 truncate max-w-[150px]'>{t.notes || '-'}</td>
                        
                        {isAdmin && (
                            <td className='p-3 text-center text-xs md:text-sm'>
                            <div className='flex justify-center gap-2'>
                                <button onClick={() => startEdit(t)} className='text-indigo-600 hover:text-indigo-800 font-medium'>Edit</button>
                                <button onClick={() => confirmDelete(t.id)} className='text-rose-600 hover:text-rose-800 disabled:text-stone-400 font-medium'>Delete</button>
                            </div>
                            </td>
                        )}
                        </tr>
                    );
                    })}
                </tbody>
                </table>
            </div>
        )}
      </div>

      {isModalOpen && initialEditData && (
        <EditTransactionModal
          initialData={initialEditData}
          groupOptions={groupOptions} 
          rateSchedule={rateSchedule}
          groups={groups}
          transactions={transactions}
          onSave={handleModalSave}
          onCancel={handleModalCancel}
        />
      )}
    </div>
  );
}

export default TransactionsView;