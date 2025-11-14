import React from 'react';

function Sidebar({ view, setView, isAdmin, handleLogin, logout, authButtonStyle }) {
  const getButtonStyles = (targetView) => {
    const baseStyle = 'w-full text-left p-3 border-b-2 font-bold transition-all duration-200';
    
    // Matches the "Card" aesthetic when active: Beige bg + thick black border
    if (view === targetView) {
      return `${baseStyle} bg-[#F0EFEA] border-black text-gray-900`;
    }
    
    // clean look when inactive, subtle hover
    return `${baseStyle} border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100`;
  };

  return (
    <div className='w-64 bg-[#F0EFEA] h-screen border-r border-stone-300 p-6 flex flex-col'>
      <h2 className='text-2xl font-bold mb-8 text-gray-900'>Negosyo ni Kuya Jo</h2>
      
      <nav className='flex flex-col gap-3'>
        <button
          onClick={() => setView('dashboard')}
          className={getButtonStyles('dashboard')}
        >
          Dashboard
        </button>
        
        <button
          onClick={() => setView('transactions')}
          className={getButtonStyles('transactions')}
        >
          Transactions
        </button>
        
        <button
          onClick={() => setView('tsikots')}
          className={getButtonStyles('tsikots')}
        >
          Tsikots
        </button>
      </nav>
        <div className='mt-auto pt-6 border-t-2 border-stone-300 flex justify-center'>
        <button 
            onClick={isAdmin ? logout : handleLogin}
            className={`${authButtonStyle} ${
              isAdmin 
                ? 'bg-rose-600 text-white hover:bg-rose-700' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
        >
            {isAdmin ? 'Logout' : 'Login'}
        </button>
      </div>
    </div>
  );
}

export default Sidebar;