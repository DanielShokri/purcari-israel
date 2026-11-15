import React from 'react';
import { motion } from 'framer-motion';

const AboutHero: React.FC = () => {
  return (
    <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img 
          src="/images/about-hero-1600.webp"
          srcSet="/images/about-hero-800.webp 800w, /images/about-hero-1600.webp 1600w"
          sizes="100vw"
          width={1600}
          height={1199}
          decoding="async"
          // @ts-expect-error React 18 types lack fetchpriority; the lowercase attribute is passed through to the DOM
          fetchpriority="high"
          alt="Purcari Vineyards" 
          className="w-full h-full object-cover scale-110"
        />
        <div className="absolute inset-0 bg-black/50"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10 text-center text-white">
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl md:text-7xl font-bold mb-6 tracking-tight"
        >
          הסיפור של פורקרי
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-xl md:text-2xl font-light max-w-3xl mx-auto"
        >
          מורשת של מצוינות מאז 1827, המביאה את טעמי מולדובה אל שולחן שלכם בישראל.
        </motion.p>
      </div>
    </section>
  );
};

export default AboutHero;
