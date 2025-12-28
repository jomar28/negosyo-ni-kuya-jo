import React, { useEffect, useState, useRef } from 'react';
import { supabase } from './lib/supabaseClient';
import { formatDate, isBefore } from './utils/interest';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// --- SWIPER IMPORTS ---
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode } from 'swiper/modules'; 
// Import Swiper styles
import 'swiper/css';

import Sidebar from './components/Sidebar';
import MobileNavbar from './components/MobileNavbar';
import Dashboard from './components/Dashboard';
import TransactionsView from './components/TransactionsView';
import TsikotView from './components/TsikotView';
import LoginModal from './components/LoginModal';
import RateScheduleView from './components/RateScheduleView';
import GroupsView from './components/GroupsView';

function MainLayout() {
  const [view, setView] = useState('dashboard');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tsikots, setTsikots] = useState([]);
  const [rateSchedule, setRateSchedule] = useState([]);
  const [groups, setGroups] = useState([]); 
  
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { isAdmin, logout } = useAuth();

  const [lastScrollY, setLastScrollY] = useState(0);
  const [isNavVisible, setIsNavVisible] = useState(true);
  
  // Swiper Instance State
  const [swiperInstance, setSwiperInstance] = useState(null);

  async function loadData() {
    // UPDATED: Added sorting logic here
    // Transactions: Date DESC, then Created At DESC (Fixes same-day ordering)
    const txReq = supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    // Tsikot: Date Bought DESC
    const carReq = supabase
      .from('tsikot')
      .select('*')
      .order('date_bought', { ascending: false });

    // Rates: Effective Date DESC
    const rateReq = supabase
      .from('rate_changes')
      .select('*')
      .order('effective_date', { ascending: false });

    // Groups: Name ASC
    const groupReq = supabase
      .from('groups')
      .select('*')
      .order('name', { ascending: true });

    const [txRes, carRes, rateRes, groupRes] = await Promise.all([txReq, carReq, rateReq, groupReq]);

    if (txRes.data) setTransactions(txRes.data);
    if (carRes.data) setTsikots(carRes.data);
    if (rateRes.data) setRateSchedule(rateRes.data);
    if (groupRes.data) setGroups(groupRes.data);

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  // --- SYNC LOGIC: Navbar click controls Swiper (Mobile Only) ---
  useEffect(() => {
    // Only run this logic if we are actually using the swiper (which is now mobile only)
    if (swiperInstance && !swiperInstance.destroyed) {
      const viewIndices = {
        'dashboard': 0,
        'rates': 1,
        'groups': 2
      };
      
      // ONLY slide if the view matches a slide AND we aren't already there.
      // This prevents the infinite loop/thrashing that blocks clicks.
      if (view in viewIndices) {
        const targetIndex = viewIndices[view];
        if (swiperInstance.realIndex !== targetIndex) {
          swiperInstance.slideToLoop(targetIndex);
        }
      }
    }
  }, [view, swiperInstance, isAdmin]);

  // --- SYNC LOGIC: Swiper swipe controls Navbar ---
  const handleSlideChange = (swiper) => {
    const index = swiper.realIndex;
    
    // Determine the view based on the index
    let nextView = 'dashboard';
    if (index === 1 && isAdmin) nextView = 'rates';
    else if (index === 2 && isAdmin) nextView = 'groups';

    // Only update state if it's actually different to prevent re-renders
    if (view !== nextView) {
      setView(nextView);
    }
  };

  const handleLogin = () => {
    setIsLoginModalOpen(true);
  };

  // Detect Vertical Scroll to hide/show Navbar
  const handleVerticalScroll = (e) => {
    const currentScrollY = e.target.scrollTop;
    if (Math.abs(currentScrollY - lastScrollY) < 5) return;

    if (currentScrollY > lastScrollY && currentScrollY > 70) { 
      setIsNavVisible(false); 
    } else {
      setIsNavVisible(true); 
    }
    setLastScrollY(currentScrollY);
  };

  const getInitialSlideIndex = () => {
    if (view === 'rates') return 1;
    if (view === 'groups') return 2;
    return 0; // dashboard
  };

  // Helper to render the active component for the "Standard/Desktop" view
  const renderCurrentView = () => {
    switch (view) {
      case 'dashboard':
        return <Dashboard transactions={transactions} tsikots={tsikots} rateSchedule={rateSchedule} groups={groups} />;
      case 'rates':
        return <RateScheduleView onRatesChange={loadData} rateSchedule={rateSchedule} />;
      case 'groups':
        return <GroupsView groups={groups} onDataChange={loadData} />;
      case 'transactions':
        return <TransactionsView transactions={transactions} rateSchedule={rateSchedule} reload={loadData} groups={groups} />;
      case 'tsikots':
        return <TsikotView tsikots={tsikots} reload={loadData} supabase={supabase} formatDate={formatDate} isBefore={isBefore} />;
      default:
        return <Dashboard transactions={transactions} tsikots={tsikots} rateSchedule={rateSchedule} groups={groups} />;
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

  // Is this one of the views that should be in the Swiper on Mobile?
  const isSliderView = ['dashboard', 'rates', 'groups'].includes(view);

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

      <div className='flex-1 flex flex-col h-screen overflow-hidden relative z-0'>
        {/* MOBILE TOP BAR */}
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

        {/* CONTENT AREA */}
        
        {/* 1. MOBILE SWIPER (Only visible on Mobile AND when in a Slider View) */}
        {isSliderView && (
          <div className="md:hidden h-full">
             <Swiper
               modules={[FreeMode]}
               onSwiper={setSwiperInstance}
               onSlideChange={handleSlideChange}
               loop={isAdmin} // Enable infinite loop
               initialSlide={getInitialSlideIndex()}
               className="w-full h-full"
               simulateTouch={true}
               touchRatio={1} 
               resistance={true}
               resistanceRatio={0.5}
               speed={400}
             >
                {/* SLIDE 1: DASHBOARD */}
                <SwiperSlide className="h-full flex flex-col">
                  <div 
                    className="h-full w-full overflow-y-auto pt-24 pb-32 px-4"
                    onScroll={handleVerticalScroll} 
                  >
                     <Dashboard 
                        transactions={transactions} 
                        tsikots={tsikots} 
                        rateSchedule={rateSchedule} 
                        groups={groups}
                      />
                  </div>
                </SwiperSlide>

                {/* SLIDE 2: RATES (Only if Admin) */}
                {isAdmin && (
                  <SwiperSlide className="h-full flex flex-col">
                    <div 
                      className="h-full w-full overflow-y-auto pt-24 pb-32 px-4"
                      onScroll={handleVerticalScroll}
                    >
                       <RateScheduleView onRatesChange={loadData} rateSchedule={rateSchedule}/>
                    </div>
                  </SwiperSlide>
                )}

                {/* SLIDE 3: GROUPS (Only if Admin) */}
                {isAdmin && (
                  <SwiperSlide className="h-full flex flex-col">
                    <div 
                      className="h-full w-full overflow-y-auto pt-24 pb-32 px-4"
                      onScroll={handleVerticalScroll}
                    >
                       <GroupsView groups={groups} onDataChange={loadData} />
                    </div>
                  </SwiperSlide>
                )}
             </Swiper>
          </div>
        )}

        {/* 2. STANDARD SCROLL VIEW */}
        {/* Visible on Desktop ALWAYS. Visible on Mobile ONLY if NOT in slider view. */}
        <div 
          onScroll={handleVerticalScroll}
          className={`flex-1 overflow-y-auto p-4 pt-24 pb-32 md:p-8 md:pb-8 md:pt-8 ${isSliderView ? 'hidden md:block' : 'block'}`}
        >
           {renderCurrentView()}
        </div>

         <MobileNavbar 
            view={view} 
            setView={setView} 
            isNavVisible={isNavVisible} 
            isAdmin={isAdmin}
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