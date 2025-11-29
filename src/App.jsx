import React, { useEffect, useState, useRef } from 'react';
import { supabase } from './lib/supabaseClient';
import { formatDate, isBefore } from './utils/interest';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import Sidebar from './components/Sidebar';
import MobileNavbar from './components/MobileNavbar';
import Dashboard from './components/Dashboard';
import TransactionsView from './components/TransactionsView';
import TsikotView from './components/TsikotView';
import LoginModal from './components/LoginModal';
import RateScheduleView from './components/RateScheduleView'; // Already imported

function MainLayout() {
  const [view, setView] = useState('dashboard');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tsikots, setTsikots] = useState([]);
  const [rateSchedule, setRateSchedule] = useState([]); // Already defined
  
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { isAdmin, logout } = useAuth();

  // State for hiding nav on scroll
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const contentRef = useRef(null);

  // --- UPDATED: Single function to load ALL data including Rates ---
  async function loadData() {
    const txReq = supabase.from('transactions').select('*');
    const carReq = supabase.from('tsikot').select('*');
    const rateReq = supabase.from('rate_changes').select('*'); // Fetch rates

    const [txRes, carRes, rateRes] = await Promise.all([txReq, carReq, rateReq]);

    if (txRes.error) console.error('Error loading transactions:', txRes.error);
    if (carRes.error) console.error('Error loading tsikots:', carRes.error);
    if (rateRes.error) console.error('Error loading rates:', rateRes.error);

    if (txRes.data) setTransactions(txRes.data);
    if (carRes.data) setTsikots(carRes.data);
    if (rateRes.data) setRateSchedule(rateRes.data); // Set rates

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);
  // -------------------------------------------------------------

  const handleLogin = () => {
    setIsLoginModalOpen(true);
  };

  // Scroll handler to show/hide nav
  const handleScroll = () => {
    if (contentRef.current) {
      const currentScrollY = contentRef.current.scrollTop;
      
      // Hide on scroll down, show on scroll up
      if (currentScrollY > lastScrollY && currentScrollY > 70) { 
        setIsNavVisible(false); 
      } else {
        setIsNavVisible(true); 
      }
      setLastScrollY(currentScrollY);
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-screen bg-[#F0EFEA]'>
        <div className='text-stone-500 animate-pulse font-medium'>Loading Journal...</div>
      </div>
    );
  }

  const authButtonStyle = "px-5 py-2 font-bold uppercase text-xs tracking-wider border-2 border-black transition-all rounded-none";

  return (
    <div 
      className='flex min-h-screen bg-[#F0EFEA] text-stone-800 font-sans'
      style={{
        backgroundImage: 'linear-gradient(to right, rgba(120, 113, 108, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(120, 113, 108, 0.05) 1px, transparent 1px)',
        backgroundSize: '24px 24px'
      }}
    >
      <LoginModal 
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

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
        <div 
          className={`md:hidden bg-[#F0EFEA]/90 p-4 flex justify-between items-center z-20 border-b border-stone-300 backdrop-blur-sm fixed top-0 w-full transition-transform duration-300 ${
            isNavVisible ? 'translate-y-0' : '-translate-y-full'
          }`}
        >
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

        <div 
          ref={contentRef}
          onScroll={handleScroll}
          className='flex-1 overflow-y-auto p-4 pt-24 pb-32 md:p-8 md:pb-8 md:pt-8'
        >
          {/* UPDATED: Pass rateSchedule to Dashboard */}
          {view === 'dashboard' && (
            <Dashboard 
              transactions={transactions} 
              tsikots={tsikots} 
              rateSchedule={rateSchedule} 
            />
          )}

          {/* UPDATED: Pass rateSchedule to TransactionsView */}
          {view === 'transactions' && (
            <TransactionsView 
              transactions={transactions} 
              rateSchedule={rateSchedule} 
              reload={loadData} 
            />
          )}

          {view === 'tsikots' && (
            <TsikotView
              tsikots={tsikots}
              reload={loadData}
              supabase={supabase}
              formatDate={formatDate}
              isBefore={isBefore}
            />
          )}

          {/* ADDED: New View for Rates */}
          {view === 'rates' && <RateScheduleView onRatesChange={loadData} rateSchedule={rateSchedule}/>}
        </div>

         <MobileNavbar 
            view={view} 
            setView={setView} 
            isNavVisible={isNavVisible} 
          />
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