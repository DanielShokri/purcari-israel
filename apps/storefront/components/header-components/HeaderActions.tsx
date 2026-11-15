import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Search, User, LogOut, ChevronDown } from 'lucide-react';
import { useAppDispatch } from '../../store/hooks';
import { openSearchModal } from '../../store/slices/uiSlice';
import { useCart } from '../../hooks/useCart';
import { useCartUI } from '../../hooks/useCartUI';
import { useAuthActions } from "@convex-dev/auth/react";

interface HeaderActionsProps {
  user: any;
}

const HeaderActions: React.FC<HeaderActionsProps> = ({ user }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { itemCount, clearCart } = useCart();
  const { toggleCart } = useCartUI();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { signOut } = useAuthActions();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut();
      // Note: We don't clear the cart on logout - user's cart persists in the database
      setIsUserMenuOpen(false);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <button 
        className="p-2 text-gray-600 hover:text-secondary transition-colors hidden sm:block cursor-pointer"
        onClick={() => dispatch(openSearchModal())}
        aria-label="חיפוש"
      >
        <Search size={22} />
      </button>
      
      {/* User Menu */}
      <div className="relative hidden sm:block" ref={menuRef}>
        {user ? (
          <>
            <button 
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-1 p-2 text-gray-600 hover:text-secondary transition-colors cursor-pointer"
              aria-label="תפריט משתמש"
            >
              <User size={22} />
              <ChevronDown size={14} className={`transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isUserMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsUserMenuOpen(false)}
                />
                <div className="absolute end-0 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 min-w-[200px] py-2 overflow-hidden">
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-xs text-gray-500">שלום,</p>
                    <p className="font-bold text-gray-900 truncate">{user.name || user.email}</p>
                  </div>
                  
                  {/* Menu Items */}
                  <Link
                    to="/dashboard"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <User size={18} />
                    <span>אזור אישי</span>
                  </Link>
                  
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors w-full cursor-pointer"
                  >
                    <LogOut size={18} />
                    <span>{isLoggingOut ? 'מתנתק...' : 'התנתקות'}</span>
                  </button>
                </div>
              </>
            )}
          </>
        ) : (
          <Link 
            to="/login" 
            className="p-2 text-gray-600 hover:text-secondary transition-colors"
          >
            <User size={22} />
          </Link>
        )}
      </div>

      <button 
        className="p-2 text-gray-600 hover:text-secondary transition-colors relative cursor-pointer"
        onClick={toggleCart}
        aria-label={itemCount > 0 ? `סל קניות (${itemCount})` : 'סל קניות'}
      >
        <ShoppingCart size={22} />
        {itemCount > 0 && (
          <span className="absolute top-0 -end-1 bg-secondary text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">
            {itemCount}
          </span>
        )}
      </button>
    </div>
  );
};

export default HeaderActions;
