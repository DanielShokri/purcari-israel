import { useAppDispatch } from '../hooks';
import { showToast } from '../slices/uiSlice';

/**
 * Hook for toast notifications.
 * Usage: const toast = useToast(); toast.success('...'); toast.error('...');
 */
export const useToast = () => {
  const dispatch = useAppDispatch();

  return {
    success: (message: string, duration?: number) => 
      dispatch(showToast({ type: 'success', message, duration })),
    
    error: (message: string, duration?: number) => 
      dispatch(showToast({ type: 'error', message, duration })),
    
    info: (message: string, duration?: number) => 
      dispatch(showToast({ type: 'info', message, duration })),
    
    warning: (message: string, duration?: number) => 
      dispatch(showToast({ type: 'warning', message, duration })),
  };
};

export default useToast;
