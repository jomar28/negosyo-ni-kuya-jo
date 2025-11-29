import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

function LoginModal({ isOpen, onClose }) {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { login } = useAuth();
  const modalRef = useRef(null);
  
  // 1. Changed ref to point to username instead of PIN
  const usernameInputRef = useRef(null); 

  useEffect(() => {
    if (isOpen) {
      // Reset loading state just in case it got stuck previously
      setIsLoggingIn(false); 
      setTimeout(() => {
        // 2. Focus username on open
        usernameInputRef.current?.focus(); 
      }, 100);
      setError('');
    }
  }, [isOpen]);

  // ... (Handle click outside remains same) ...
  useEffect(() => {
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setIsLoggingIn(true);

    setTimeout(() => {
      if (!login(username, pin)) {
        setError('Invalid username or PIN.');
        setIsLoggingIn(false);
      } else {
        onClose();
        setUsername('');
        setPin('');
        // 3. CRITICAL FIX: Reset loading state on success
        setIsLoggingIn(false); 
      }
    }, 300);
  };

  if (!isOpen) return null;

  const inputStyle = "bg-[#F0EFEA] border-2 border-black rounded-none px-2 h-10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-full transition-all";

  return (
    <div className='fixed inset-0 z-[150] bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in'>
      <div 
        ref={modalRef} 
        className='bg-[#F0EFEA] w-full max-w-sm border-2 border-black'
      >
        <form onSubmit={handleSubmit}>
          <div className='p-6'>
            <h3 className='text-lg font-bold mb-4 uppercase tracking-tight text-stone-900'>
              Admin Login
            </h3>
            
            <div className='flex flex-col mb-3'>
              <label className='text-xs font-semibold mb-1.5 text-stone-500 uppercase tracking-wider'>Username</label>
              <input
                ref={usernameInputRef} /* 4. Attached ref here */
                type='text'
                name='username'
                className={inputStyle}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete='off'
              />
            </div>

            <div className='flex flex-col'>
              <label className='text-xs font-semibold mb-1.5 text-stone-500 uppercase tracking-wider'>PIN</label>
              <input
                /* Removed ref from here */
                type='password'
                name='pin'
                className={`${inputStyle} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                autoComplete='off'
              />
            </div>
            
            {error && (
              <div className='mt-3 p-2 text-center text-sm font-medium text-rose-700 bg-rose-50 border-2 border-rose-200'>
                {error}
              </div>
            )}
          </div>
          
          <div className='bg-[#F0EFEA] px-6 py-4 flex justify-between gap-3 border-t-2 border-black'>
            <button
              type='button'
              onClick={onClose}
              className='px-4 py-2 text-stone-900 bg-white border-2 border-black hover:bg-gray-100 font-bold uppercase text-xs tracking-wider transition-colors rounded-none'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={isLoggingIn || !username || !pin}
              className='px-4 py-2 text-white font-bold uppercase text-xs tracking-wider border-2 border-black transition-all rounded-none bg-indigo-600 hover:bg-indigo-700 disabled:bg-stone-300 disabled:text-stone-500 disabled:border-stone-300 disabled:cursor-not-allowed'
            >
              {isLoggingIn ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginModal;