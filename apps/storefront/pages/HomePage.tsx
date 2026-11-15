import React from 'react';
import SEO from '../components/SEO';
import Hero from '../components/home/Hero';
import FeaturesBar from '../components/home/FeaturesBar';
import FeaturedProducts from '../components/home/FeaturedProducts';
import CategoriesGrid from '../components/home/CategoriesGrid';
import StoryTeaser from '../components/home/StoryTeaser';
import AwardsSection from '../components/home/AwardsSection';
import Newsletter from '../components/home/Newsletter';
import theme from '../theme/styles';

const HomePage: React.FC = () => {

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Purcari Israel",
    "url": "https://purcari.co.il",
    "logo": "https://purcari.co.il/logo.png",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+972-50-948-0040",
      "contactType": "customer service",
      "areaServed": "IL",
      "availableLanguage": ["Hebrew", "English"]
    },
    "sameAs": [
      "https://www.facebook.com/purcariisrael",
      "https://www.instagram.com/purcariisrael"
    ]
  };

  return (
    <div className="overflow-x-hidden">
      <SEO 
        title="דף הבית" 
        description="ברוכים הבאים לפורקארי ישראל - חנות היין המובילה ליינות פרימיום ממולדובה. גלו את מגוון היינות האדומים, הלבנים והמבעבעים שלנו."
        ogImage="https://purcari.co.il/images/og-home.jpg"
        schemaData={organizationSchema}
      />
      {/* Hero Section */}
      <Hero />

      {/* Features Bar */}
      <div className={`relative z-10 -mt-12 md:-mt-16 ${theme.CONTAINER_PX}`}>
        <FeaturesBar />
      </div>

      {/* Featured Products */}
      <FeaturedProducts />

      {/* Awards Section */}
      <AwardsSection />

      {/* Categories Grid */}
      <CategoriesGrid />

      {/* Story Teaser */}
      <StoryTeaser />

      {/* Newsletter Section */}
      <Newsletter />
    </div>
  );
};

export default HomePage;
