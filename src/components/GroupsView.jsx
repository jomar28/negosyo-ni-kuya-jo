import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import ConfirmationModal from './ConfirmationModal';

function GroupsView({ groups = [], onDataChange }) {
  // REMOVED: interest_multiplier from state
  const [form, setForm] = useState({ name: '' });
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null); 
  const [originalName, setOriginalName] = useState(null);
  
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, id: null });

  const sortedGroups = [...groups].sort((a, b) => a.name.localeCompare(b.name));

  function startEdit(group) {
    // Prevent editing Jomar programmatically as well
    if (group.name === 'Jomar') return;

    setEditingId(group.id);
    setOriginalName(group.name);
    setForm({ name: group.name });
  }

  function cancelEdit() {
    setEditingId(null);
    setOriginalName(null);
    setForm({ name: '' });
  }

  async function handleSave() {
    if (!form.name) return;
    setLoading(true);
    
    // LOGIC: If it's Jomar (safety check), 1.0. Everyone else is 0.5.
    // Since we hide edit buttons for Jomar, new entries will effectively always be 0.5
    const multiplier = form.name === 'Jomar' ? 1.0 : 0.5;
    let error = null;

    if (editingId) {
      // UPDATE
      const res = await supabase
        .from('groups')
        .update({ name: form.name, interest_multiplier: multiplier })
        .eq('id', editingId);
      error = res.error;

      // Update transactions history if renamed
      if (!error && originalName && originalName !== form.name) {
         await supabase
            .from('transactions')
            .update({ group_name: form.name })
            .eq('group_name', originalName);
      }

    } else {
      // INSERT
      const res = await supabase
        .from('groups')
        .insert({ name: form.name, interest_multiplier: multiplier });
      error = res.error;
    }

    if (!error) {
      cancelEdit();
      if (onDataChange) onDataChange();
    } else {
      alert('Error saving group');
      console.error(error);
    }
    setLoading(false);
  }

  function confirmDelete(id) {
    setConfirmConfig({ isOpen: true, id });
  }

async function handleDelete() {
    // --- FIX 1: Capture ID safely before state update ---
    const idToDelete = confirmConfig.id;

    setConfirmConfig({ ...confirmConfig, isOpen: false });
    
    const { error } = await supabase.from('groups').delete().eq('id', idToDelete);
    
    if (!error) {
        if (onDataChange) onDataChange();
        if (editingId === idToDelete) cancelEdit();
    } else {
        alert('Failed to delete group. Ensure no transactions are linked to it.');
    }
  }

  const disabledBtnStyle = "disabled:bg-stone-300 disabled:text-stone-500 disabled:border-stone-300 disabled:cursor-not-allowed";
    const inputStyle = "bg-[#F0EFEA] border-2 border-black rounded-none px-2 h-10  text-sm placeholder:text-stone-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-full";


  return (
    <div className='max-w-4xl mx-auto'>
      <h3 className='text-3xl font-bold mb-6 text-gray-900'>Groups Management</h3>
      
      <ConfirmationModal 
        isOpen={confirmConfig.isOpen}
        title="Delete Group?"
        message="Are you sure? This is permanent."
        isDangerous={true}
        onConfirm={handleDelete}
        onCancel={() => setConfirmConfig({ isOpen: false, id: null })}
      />

      <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
        
        {/* FORM */}
        <div className='p-6 bg-[#F0EFEA] border-2 border-black h-fit'>
          <h4 className='font-bold mb-4 uppercase tracking-wider'>
            {editingId ? 'Edit Group' : 'Add New Group'}
          </h4>
          
          <div className='mb-6'>
            <label className='text-xs font-medium mb-1 text-stone-500'>Group Name</label>
            <input 
              type="text" 
              className={inputStyle}
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
              placeholder="Group name"
            />
          </div>

          <div className="flex gap-2">
            <button 
                onClick={handleSave}
                disabled={loading || !form.name}
                className={`flex-1 bg-indigo-600 text-white font-bold uppercase py-3 border-2 border-black hover:bg-indigo-700 transition-colors ${disabledBtnStyle}`}
            >
                {loading ? 'Saving...' : (editingId ? 'Update Group' : 'Add Group')}
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
          <h4 className='font-bold mb-4 uppercase tracking-wider'>Groups List</h4>
          
          <div className='space-y-0 divide-y-2 divide-stone-300'>
            {sortedGroups.map((g) => (
              <div key={g.id} className={`flex justify-between items-center py-3 ${editingId === g.id ? 'bg-indigo-200 -mx-2 px-2' : ''}`}>
                <div>
                  <div className='font-bold text-gray-900'>{g.name}</div>
                </div>
                
                {/* JOMAR PROTECTION LOGIC */}
                {g.name === 'Jomar' ? (
                    <span className='text-xs font-bold bg-gray-200 text-gray-500 px-2 py-1 rounded-full border border-gray-300 select-none'>
                        Default
                    </span>
                ) : (
                    <div className="flex items-center text-xs md:text-sm gap-2">
                        <button 
                            onClick={() => startEdit(g)}
                            className="text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                            Edit
                        </button>
                        <button 
                            onClick={() => confirmDelete(g.id)}
                            className="text-rose-600 hover:text-rose-800 font-medium"
                        >
                            Delete
                        </button>
                    </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default GroupsView;