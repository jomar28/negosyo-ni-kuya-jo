import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import { formatDate, isBefore } from './utils/interest';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import Sidebar from './components/Sidebar';
import MobileNavbar from './components/MobileNavbar';
import Dashboard from './components/Dashboard';
import TransactionsView from './components/TransactionsView';
import TsikotView from './components/TsikotView';
import LoginModal from './components/LoginModal'; // Import the modal

function MainLayout() {
  const [view, setView] = useState('dashboard');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tsikots, setTsikots] = useState([]);
  
  // NEW: State to control the login modal
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  
  // Auth Hook
  const { isAdmin, logout } = useAuth(); // Removed login, as modal handles it

  async function loadTsikots() {
    const { data, error } = await supabase.from('tsikot').select('*');
    if (error) {
      console.error('Error loading tsikots:', error);
      return;
    }
    setTsikots(data || []);
  }

  async function loadTransactions() {
    const { data, error } = await supabase.from('transactions').select('*');
    if (error) {
      console.error('Error loading transactions:', error);
      setLoading(false);
      return;
    }
    setTransactions(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadTransactions();
    loadTsikots();
  }, []);

  // UPDATED: This function now just *opens* the modal
  const handleLogin = () => {
    setIsLoginModalOpen(true);
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-screen bg-[#F0EFEA]'>
        <div className='text-stone-500 animate-pulse font-medium'>Loading Journal...</div>
      </div>
    );
  }

  // Common Button Style
  const authButtonStyle = "px-5 py-2 font-bold uppercase text-xs tracking-wider border-2 border-black transition-all rounded-none";

  return (
    // MODIFIED: Added inline styles for the Grid Pattern
    <div 
      className='flex min-h-screen bg-[#F0EFEA] text-stone-800 font-sans'
      style={{
        backgroundImage: 'linear-gradient(to right, rgba(120, 113, 108, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(120, 113, 108, 0.05) 1px, transparent 1px)',
        backgroundSize: '24px 24px'
      }}
    >
      {/* ADDED: Render the Login Modal */}
      <LoginModal 
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      {/* Desktop Sidebar - Hidden on Mobile */}
      <div className="hidden md:block sticky top-0 h-screen">
        <Sidebar 
            view={view} 
            setView={setView} 
            isAdmin={isAdmin} 
            handleLogin={handleLogin} 
            logout={logout}
            authButtonStyle={authButtonStyle}
            />
      </div>

      <div className='flex-1 flex flex-col h-screen overflow-hidden'>
        {/* Top Bar for Mobile */}
        <div className="md:hidden bg-[#F0EFEA]/90 p-4 flex justify-between items-center z-10 border-b-2 border-black backdrop-blur-sm">
            <h1 className="font-bold text-xl text-stone-800 tracking-tight">Negosyo ni Kuya Jo</h1>
            <button 
                onClick={isAdmin ? logout : handleLogin}
                className={`text-xs px-4 py-1.5 font-bold uppercase tracking-wider transition-colors border-2 border-black rounded-none ${
                  isAdmin 
                    ? 'bg-rose-600 text-white hover:bg-rose-700' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
            >
                {isAdmin ? 'Logout' : 'Login'}
            </button>
        </div>

        {/* Main Content Area - Scrollable */}
        <div className='flex-1 overflow-y-auto p-4 pb-32 md:p-8 md:pb-8'>
          {view === 'dashboard' && <Dashboard transactions={transactions} tsikots={tsikots} />}
          {view === 'transactions' && (
            <TransactionsView transactions={transactions} reload={loadTransactions} />
          )}
          {view === 'tsikots' && (
            <TsikotView
              tsikots={tsikots}
              reload={loadTsikots}
              supabase={supabase}
              formatDate={formatDate}
              isBefore={isBefore}
            />
          )}
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden">
           <MobileNavbar view={view} setView={setView} />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}