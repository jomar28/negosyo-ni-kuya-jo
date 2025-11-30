import React from 'react';

function MobileNavbar({ view, setView, isNavVisible, isAdmin }) {
  
  // Toggle Logic: Dashboard -> Rates -> Groups -> Dashboard
  const handleCenterClick = () => {
    // If we are currently outside the main slider pages, reset to dashboard
    if (!['dashboard', 'rates', 'groups'].includes(view)) {
        setView('dashboard');
        return;
    }

    if (!isAdmin) {
        setView('dashboard');
        return;
    }

    // Cycle
    if (view === 'dashboard') {
        setView('rates');
    } else if (view === 'rates') {
        setView('groups');
    } else {
        setView('dashboard');
    }
  };

  const isActiveMain = ['dashboard', 'rates', 'groups'].includes(view);

  // Helper for Center Content
  const getCenterContent = () => {
      if (view === 'rates') {
          return {
              label: 'Rates',
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 animate-fade-in" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                </svg>
              )
          };
      } else if (view === 'groups') {
          return {
              label: 'Groups',
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 animate-fade-in" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              )
          };
      } else {
          // Default to Dashboard Icon
          return {
              label: 'Dashboard',
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 animate-fade-in" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                </svg>
              )
          };
      }
  };

  const centerData = getCenterContent();

  const sideBtnClass = (active) => 
    `flex flex-col items-center justify-center w-full h-full transition-colors duration-300 ${active ? 'text-indigo-600' : 'text-stone-400 hover:text-stone-600'}`;

  return (
    <div className={`
      md:hidden fixed bottom-0 left-0 w-full 
      h-28 
      transition-transform duration-300 z-[60] pointer-events-none
      ${isNavVisible ? 'translate-y-0' : 'translate-y-full'}
    `}>
      
      <div className="
        absolute bottom-0 left-0 w-full h-20 
        bg-[#F0EFEA]/95 backdrop-blur-md border-t border-stone-200 
        shadow-[0_-8px_20px_-5px_rgba(0,0,0,0.1)] pb-safe pointer-events-auto
      ">
        {/* GRID LAYOUT: Ensures 3 distinct, non-overlapping clickable areas */}
        <div className="grid grid-cols-3 h-full">
          
          {/* Left: Transactions */}
          <div className="flex items-center justify-center">
            <button 
              onClick={() => setView('transactions')}
              className={sideBtnClass(view === 'transactions')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <span className="text-[10px] mt-1 font-bold tracking-wide">Transax</span>
            </button>
          </div>

          {/* Center: Toggle */}
          <div className="relative flex items-center justify-center">
            {/* Elevated Button Container */}
            <div className="absolute -top-8 flex flex-col items-center">
                <button 
                  onClick={handleCenterClick}
                  className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg border-[6px] border-[#F0EFEA] transition-all duration-300 active:scale-95
                    ${isActiveMain
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-white text-stone-400 hover:text-indigo-500'}
                  `}
                >
                    {centerData.icon}
                </button>
                <div className={`text-[10px] font-bold tracking-wide text-center mt-1 transition-colors duration-300 ${isActiveMain ? 'text-indigo-600' : 'text-stone-400'}`}>
                    {centerData.label}
                </div>
            </div>
          </div>

          {/* Right: Tsikot */}
          <div className="flex items-center justify-center">
            <button 
              onClick={() => setView('tsikots')}
              className={sideBtnClass(view === 'tsikots')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125V14.25m-19.5 0h19.5m-19.5 0L5.25 2.75h13.5L21.75 14.25" />
              </svg>
              <span className="text-[10px] mt-1 font-bold tracking-wide">Tsikot</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default MobileNavbar;