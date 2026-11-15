import React from 'react';
import { motion } from 'framer-motion';
import { Award, Truck, ShieldCheck } from 'lucide-react';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 }
};

const FeaturesBar: React.FC = () => {
  return (
    <motion.section
      {...fadeInUp}
      className="bg-white py-10 border border-gray-100 shadow-sm relative z-10 mt-8 mx-4 sm:mx-6 lg:mx-auto lg:max-w-6xl rounded-2xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
        <div className="flex flex-col items-center p-4 border-b md:border-b-0 border-gray-100">
          <div className="bg-gray-50 p-3 rounded-full mb-4 text-secondary"><Award size={32} /></div>
          <h2 className="font-bold text-lg mb-2">היקב המעוטר ביותר</h2>
          <p className="text-gray-500 text-sm px-6">היקב המעוטר ביותר במזרח אירופה עם מעל 400 מדליות בשנת 2023.</p>
        </div>
        <div className="flex flex-col items-center p-4 border-b md:border-b-0 md:border-e md:border-s border-gray-100">
          <div className="bg-gray-50 p-3 rounded-full mb-4 text-secondary"><Truck size={32} /></div>
          <h2 className="font-bold text-lg mb-2">משלוח מהיר</h2>
          <p className="text-gray-500 text-sm px-6">משלוח מהיר עד פתח הבית.</p>
        </div>
        <div className="flex flex-col items-center p-4">
          <div className="bg-gray-50 p-3 rounded-full mb-4 text-secondary"><ShieldCheck size={32} /></div>
          <h2 className="font-bold text-lg mb-2">קנייה מאובטחת</h2>
          <p className="text-gray-500 text-sm px-6">תשלום מאובטח בתקנים המחמירים ביותר.</p>
        </div>
      </div>
    </motion.section>
  );
};

export default FeaturesBar;
