import React from 'react';
import SEO from '../components/SEO';
import AboutHero from '../components/about/AboutHero';
import HistorySection from '../components/about/HistorySection';
import StatsSection from '../components/about/StatsSection';
import ValuesSection from '../components/about/ValuesSection';
import PurcariIsraelSection from '../components/about/PurcariIsraelSection';

const AboutPage: React.FC = () => {
  return (
    <div className="bg-white min-h-screen">
      <SEO 
        title="אודותינו"
        description="גלו את הסיפור המרתק של יקב פורקרי - מסורת של ייצור יין מאז 1827. המסע שלנו ממולדובה לישראל והמחויבות שלנו לאיכות ללא פשרות."
        canonical="/about"
        ogImage="https://purcari.co.il/images/og-about.jpg"
      />
      {/* Hero Section */}
      <AboutHero />

      {/* History Section */}
      <HistorySection />

      {/* Stats Section */}
      <StatsSection />

      {/* Values Section */}
      <ValuesSection />

      {/* Purcari Israel Section */}
      <PurcariIsraelSection />
    </div>
  );
};

export default AboutPage;
