import React from 'react';

function MobileNavbar({ view, setView, isNavVisible, isAdmin }) {
  
  const navBtnClass = (activeView) => 
    `flex flex-col items-center transition-colors duration-300 ${view === activeView ? 'text-indigo-600' : 'text-stone-400 hover:text-stone-600'}`;

  // Toggle Logic for Center Button
  const handleCenterClick = () => {
    if (view === 'dashboard' && isAdmin) {
        setView('rates');
    } else {
        setView('dashboard');
    }
  };

  const isRatesActive = view === 'rates';

  return (
    <div className={`
      md:hidden fixed bottom-0 left-0 w-full 
      h-28 
      transition-transform duration-300 z-50 
      ${isNavVisible ? 'translate-y-0' : 'translate-y-full'}
    `}>
      
      <div className="
        absolute bottom-0 left-0 w-full h-20 
        bg-[#F0EFEA]/95 backdrop-blur-md border-t border-stone-200 
        shadow-[0_-8px_20px_-5px_rgba(0,0,0,0.1)] pb-safe
      ">
        <div className="relative flex justify-between items-center px-8 py-2 h-full">
          
          {/* Left: Transactions */}
          <button 
            onClick={() => setView('transactions')}
            className={navBtnClass('transactions')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="-1 -1 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <span className="text-[10px] mt-1 font-bold tracking-wide">Transax</span>
          </button>

          {/* Center: Dashboard / Rates Toggle */}
          <div className="relative -top-8">
              <button 
                onClick={handleCenterClick}
                className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg border-[6px] border-[#F0EFEA] transition-all duration-300 active:scale-95
                  ${view === 'dashboard' || view === 'rates'
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-white text-stone-400 hover:text-indigo-500'}
                `}
              >
                  {isRatesActive ? (
                    /* PERCENT ICON */
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 animate-fade-in" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 20L17 4M6 9h0a2 2 0 100 4 2 2 0 000-4zm12 6h0a2 2 0 100 4 2 2 0 000-4z" />
                    </svg>
                  ) : (
                    /* DASHBOARD CHART ICON (Preserved) */
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 animate-fade-in" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  )}
              </button>
              
              <div className={`text-[10px] font-bold tracking-wide text-center mt-1 transition-colors duration-300 ${view === 'dashboard' || view === 'rates' ? 'text-indigo-600' : 'text-stone-400'}`}>
                  {isRatesActive ? 'Rates' : 'Dashboard'}
              </div>
          </div>

          {/* Right: Tsikot */}
          <button 
            onClick={() => setView('tsikots')}
            className={navBtnClass('tsikots')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="2 5 20 14" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l2-2h10l2 2v6a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1H8v1a1 1 0 01-1 1H6a1 1 0 01-1-1v-6z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 10V8a1 1 0 011-1h8a1 1 0 011 1v2" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 14h.01M16 14h.01" />
            </svg>
            <span className="text-[10px] mt-1 font-bold tracking-wide">Tsikot</span>
          </button>

        </div>
      </div>
    </div>
  );
}

export default MobileNavbar;