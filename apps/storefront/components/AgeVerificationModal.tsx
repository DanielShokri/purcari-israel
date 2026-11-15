import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wine, AlertTriangle, ShieldCheck } from 'lucide-react';

const AGE_VERIFIED_KEY = 'purcari_age_verified';

const AgeVerificationModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user has already verified their age in this session
    const isVerified = sessionStorage.getItem(AGE_VERIFIED_KEY);
    if (!isVerified) {
      setIsOpen(true);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }
  }, []);

  const handleConfirm = () => {
    sessionStorage.setItem(AGE_VERIFIED_KEY, 'true');
    setIsOpen(false);
    document.body.style.overflow = '';
  };

  const handleDecline = () => {
    // Redirect to Google or another safe page
    window.location.href = 'https://www.google.com';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100]">
          {/* Backdrop - No click to close for legal compliance */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="bg-secondary p-6 text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wine className="text-white" size={32} />
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">אימות גיל</h2>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Age Requirement */}
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full mb-4">
                    <ShieldCheck size={20} className="text-secondary" />
                    <span className="font-bold text-gray-800">18+</span>
                  </div>
                  <p className="text-gray-700 text-lg font-medium mb-2">
                    אתר זה מיועד למבוגרים בלבד
                  </p>
                  <p className="text-gray-500 text-sm">
                    על מנת להיכנס לאתר, עליך לאשר שהנך בן/בת 18 ומעלה
                  </p>
                </div>

                {/* Health Warning */}
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-amber-100 p-2 rounded-lg flex-shrink-0">
                      <AlertTriangle size={20} className="text-amber-600" />
                    </div>
                    <div>
                      <p className="font-bold text-amber-800 text-sm mb-1">אזהרת משרד הבריאות</p>
                      <p className="text-amber-700 text-sm leading-relaxed">
                        צריכה מופרזת של אלכוהול מסכנת חיים ומזיקה לבריאות.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={handleConfirm}
                    className="w-full bg-secondary hover:bg-red-900 text-white py-4 rounded-xl font-bold text-lg transition-colors cursor-pointer shadow-lg"
                  >
                    אני מאשר/ת שאני בן/בת 18 ומעלה
                  </button>
                  <button
                    onClick={handleDecline}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 py-3 rounded-xl font-medium transition-colors cursor-pointer"
                  >
                    אני מתחת לגיל 18
                  </button>
                </div>

                {/* Legal Note */}
                <p className="text-center text-[11px] text-gray-400 leading-relaxed">
                  בלחיצה על "אני מאשר/ת" הנך מצהיר/ה כי הנך בגיל החוקי לצריכת אלכוהול בישראל (18+) 
                  ומסכים/ה לתנאי השימוש ומדיניות הפרטיות של האתר.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AgeVerificationModal;
