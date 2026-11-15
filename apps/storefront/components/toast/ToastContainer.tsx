import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { useAppSelector } from '../../store/hooks';
import { selectToasts } from '../../store/slices/uiSlice';
import Toast from './Toast';

const ToastContainer: React.FC = () => {
  const toasts = useAppSelector(selectToasts);

  return (
    <div 
      className="fixed bottom-6 start-4 z-[100] flex flex-col-reverse gap-3 pointer-events-none"
      role="region"
      aria-live="polite"
      aria-label="התראות"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast toast={toast} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ToastContainer;
