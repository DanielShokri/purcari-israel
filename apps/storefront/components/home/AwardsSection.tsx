import React from 'react';
import { motion } from 'framer-motion';
import theme from '../../theme/styles';

const AwardsSection: React.FC = () => {
  const awards = [
    { year: '2023', title: '430 מדליות', event: 'בתחרויות בינלאומיות' },
    { year: '2021', title: 'היקב המעוטר ביותר', event: 'בעולם' },
    { year: '2023', title: 'היקב המצליח ביותר', event: 'במרכז ומזרח אירופה' },
    { year: '1878', title: 'מדליית זהב ראשונה', event: 'בתערוכה העולמית בפריז' },
  ];

  return (
    <section className={`${theme.SECTION_PY} bg-primary text-white overflow-hidden`}>
      <div className={theme.CONTAINER}>
        <div className={`flex flex-col lg:flex-row items-center ${theme.GAP_SECTION}`}>
          <div className="w-full lg:w-1/2">
            <motion.h2 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className={`${theme.H2} mb-6 text-white`}
            >
              מסורת של <span className="text-accent">ניצחונות</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-gray-400 text-lg mb-8 leading-relaxed"
            >
              האיכות של Purcari אינה מוטלת בספק. עם היסטוריה שמתחילה ב-1827, היינות שלנו ממשיכים לקטוף את הפרסים היוקרתיים ביותר בעולם היין שנה אחר שנה.
            </motion.p>
            <div className="grid grid-cols-2 gap-6">
              {awards.map((award, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 * index }}
                  className="border-r border-accent/30 pr-6 py-2"
                >
                  <span className="text-accent font-bold text-sm block mb-1">{award.year}</span>
                  <h3 className="font-bold text-lg mb-1">{award.title}</h3>
                  <p className="text-gray-500 text-xs">{award.event}</p>
                </motion.div>
              ))}
            </div>
          </div>
          
          <div className="w-full lg:w-1/2 relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative z-10"
            >
              <img 
                src="https://winetravelawards.com/wp-content/uploads/2021/12/chateau-2.jpg" 
                alt="Purcari Awards" 
                className="rounded-3xl shadow-2xl grayscale hover:grayscale-0 transition-all duration-700"
              />
            </motion.div>
            <div className="absolute -top-10 -end-10 w-40 h-40 bg-secondary/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-10 -start-10 w-40 h-40 bg-accent/20 rounded-full blur-3xl animate-pulse delay-700"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AwardsSection;
