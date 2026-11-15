import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ScrollToTop from './components/ScrollToTop';
import ToastContainer from './components/toast/ToastContainer';
import ErrorBoundary from './components/ErrorBoundary';
import SEO from './components/SEO';

const HomePage = lazy(() => import('./pages/HomePage'));
const ShopPage = lazy(() => import('./pages/ShopPage'));
const ProductPage = lazy(() => import('./pages/ProductPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const OrderConfirmationPage = lazy(() => import('./pages/OrderConfirmationPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ShippingPage = lazy(() => import('./pages/ShippingPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

const pageLoading = (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div>
  </div>
);

// Private, per-user pages: keep them out of the index even after React replaces the shell's head.
const privateRoute = (title: string, page: React.ReactElement) => (
  <>
    <SEO title={title} noindex />
    {page}
  </>
);

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Router>
        <ScrollToTop />
        <ToastContainer />
        <Layout>
          <Suspense fallback={pageLoading}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/products" element={<ShopPage />} />
              <Route path="/product/:id" element={<ProductPage />} />
              <Route path="/checkout" element={privateRoute('תשלום', <CheckoutPage />)} />
              <Route path="/order-confirmation/:id" element={privateRoute('אישור הזמנה', <OrderConfirmationPage />)} />
              <Route path="/login" element={privateRoute('התחברות', <LoginPage />)} />
              <Route path="/dashboard" element={privateRoute('האזור האישי', <DashboardPage />)} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/shipping" element={<ShippingPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </Layout>
      </Router>
    </ErrorBoundary>
  );
};

export default App;
