import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowUpLeft } from 'lucide-react';
import theme from '../../theme/styles';

const Hero: React.FC = () => {
  const [loadVideo, setLoadVideo] = useState(false);

  useEffect(() => {
    // Delay video loading to prioritize site assets
    const timer = setTimeout(() => setLoadVideo(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className={`mt-6 sm:mt-8 ${theme.CONTAINER_PX}`}>
      <div className={`relative h-[65vh] sm:h-[70vh] w-full overflow-hidden rounded-2xl sm:rounded-3xl bg-gray-900 shadow-2xl`}>
        {/* Static Background / Poster Image (LCP element: real <img> so the preload scanner sees it) */}
        <img
          src="/images/hero-1600.webp"
          srcSet="/images/hero-800.webp 800w, /images/hero-1600.webp 1600w"
          sizes="100vw"
          width={1600}
          height={1067}
          alt=""
          decoding="async"
          // @ts-expect-error React 18 types lack fetchpriority; the lowercase attribute is passed through to the DOM
          fetchpriority="high"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Video Background */}
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <AnimatePresence>
            {loadVideo && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.5 }}
                className="w-full h-full"
              >
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                  poster="/images/hero-1600.webp"
                >
                  <source 
                    src="https://purcariwineries.com/wp-content/uploads/2023/11/Purcari-General-44sec_ian_2023.mp4" 
                    type="video/mp4" 
                  />
                  Your browser does not support the video tag.
                </video>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Dark Screen Overlay for Text Readability */}
        <div className="absolute inset-0 bg-black/40 z-10"></div>
        
        {/* Directional Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-l from-black/60 via-black/20 to-transparent z-10"></div>

        <div className="absolute inset-0 flex items-center z-20">
          <div className={`max-w-xl text-right text-white ${theme.CONTAINER_PX}`}>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={`${theme.H1} mb-4 drop-shadow-lg text-white`}
            >
              ערכים אמיתיים אינם משתנים
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className={`${theme.BODY_LG} mb-8 drop-shadow-md text-white/90`}
            >
              מורשת של מצוינות מאז 1827. היינות של Purcari שכבשו את בתי המלוכה של אירופה, עכשיו אצלכם בשולחן.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Link
                to="/products"
                className="group inline-flex items-center gap-3 bg-white text-gray-900 px-8 py-4 rounded-full font-bold text-base sm:text-lg hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl"
              >
                גלו את היינות שלנו
                <ArrowUpLeft className="transition-transform group-hover:-translate-y-0.5 group-hover:-translate-x-0.5" size={22} />
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
