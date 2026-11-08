import React, { useEffect, useRef, useState } from 'react';
import { CreditCard, Shield, Loader2, AlertCircle } from 'lucide-react';

interface PaymentStepProps {
  /** iCredit payment page URL to embed in iframe */
  paymentUrl: string | null;
  /** Whether the payment URL is being generated */
  isLoadingUrl: boolean;
  /** Error message from iCredit API, if any */
  paymentError: string | null;
  /** Retry function when there's an error */
  onRetry: () => void;
  /** Called when user clicks "Back" */
  prevStep: () => void;
  /** Total amount for display */
  total: number;
}

/**
 * PaymentStep - Shows iCredit payment form in an embedded iframe.
 * 
 * The iframe loads iCredit's hosted payment page, keeping the customer
 * on our site while ensuring PCI compliance (we never touch card data).
 * 
 * After payment completes, iCredit redirects within the iframe, 
 * and we detect completion via postMessage or redirect URL.
 */
const PaymentStep: React.FC<PaymentStepProps> = ({
  paymentUrl,
  isLoadingUrl,
  paymentError,
  onRetry,
  prevStep,
  total,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // iCredit resizes itself over postMessage ("ParentFrameLoad" carries the
  // rendered document height). Without honouring it the card form sits below
  // the fold inside a fixed 500px box.
  const [iframeHeight, setIframeHeight] = useState(500);

  const ALLOWED_ORIGINS = ['https://icredit.rivhit.co.il', 'https://testicredit.rivhit.co.il'];

  const isAllowedOrigin = (origin: string): boolean => {
    return ALLOWED_ORIGINS.includes(origin);
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!isAllowedOrigin(event.origin)) return;
      console.log('[iCredit] Received message:', event.data);

      const data = event.data;
      if (
        data &&
        data.method === 'ParentFrameLoad' &&
        typeof data.height === 'number' &&
        data.height > 0
      ) {
        setIframeHeight(Math.max(500, Math.ceil(data.height)));
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <>
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <CreditCard className="text-secondary" />
        תשלום מאובטח
      </h2>
      
      <div className="space-y-4">
        {/* Security badge */}
        <div className="flex items-center gap-3 text-sm text-gray-500 bg-green-50 p-3 rounded-lg border border-green-100">
          <Shield className="text-green-600 flex-shrink-0" size={20} />
          <div>
            <p className="font-medium text-green-800">סה"כ לתשלום: ₪{total.toFixed(2)}</p>
            <p className="text-xs text-green-600">התשלום מאובטח ומוצפן</p>
          </div>
        </div>

        {/* Loading state - while getting payment URL */}
        {isLoadingUrl && (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <Loader2 className="animate-spin mx-auto text-secondary mb-3" size={40} />
            <p className="text-gray-600 font-medium">מכין טופס תשלום מאובטח...</p>
            <p className="text-gray-400 text-sm mt-1">אנא המתן</p>
          </div>
        )}

        {/* Error state */}
        {paymentError && !isLoadingUrl && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-4 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-medium mb-1">שגיאה בטעינת טופס התשלום</p>
                <p className="text-sm text-red-600">{paymentError}</p>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={prevStep}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                חזרה
              </button>
              <button
                type="button"
                onClick={onRetry}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                נסה שוב
              </button>
            </div>
          </div>
        )}

        {/* iCredit Payment iframe */}
        {paymentUrl && !isLoadingUrl && !paymentError && (
          <div className="relative">
            {/* iframe container with loading overlay */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <iframe
                ref={iframeRef}
                src={paymentUrl}
                title="טופס תשלום מאובטח"
                className="w-full border-0"
                style={{ height: `${iframeHeight}px`, minHeight: '500px' }}
              />
            </div>
            
            {/* Credit card logos */}
            <div className="flex justify-center items-center gap-4 py-3 mt-2">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/100px-Visa_Inc._logo.svg.png" 
                alt="Visa" 
                className="h-5 object-contain opacity-50"
              />
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/MasterCard_Logo.svg/100px-MasterCard_Logo.svg.png" 
                alt="Mastercard" 
                className="h-5 object-contain opacity-50"
              />
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/American_Express_logo_%282018%29.svg/100px-American_Express_logo_%282018%29.svg.png" 
                alt="American Express" 
                className="h-5 object-contain opacity-50"
              />
            </div>
          </div>
        )}

        {/* Back button - only show when iframe is visible */}
        {paymentUrl && !isLoadingUrl && !paymentError && (
          <button 
            type="button" 
            onClick={prevStep}
            className="w-full bg-gray-100 text-gray-600 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            ביטול וחזרה לסיכום ההזמנה
          </button>
        )}
      </div>
    </>
  );
};

export default PaymentStep;
