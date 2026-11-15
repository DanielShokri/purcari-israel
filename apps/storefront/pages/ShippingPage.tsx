import React from 'react';
import { Truck, Clock, MapPin, Package, RotateCcw, Phone } from 'lucide-react';
import SEO from '../components/SEO';

const ShippingPage: React.FC = () => {
  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      <SEO 
        title="מדיניות משלוחים"
        description="מידע על משלוחים וזמני אספקה בפורקארי ישראל. משלוח חינם בהזמנה מעל ₪300."
        canonical="/shipping"
      />
      
      {/* Header */}
      <div className="bg-gray-900 text-white py-12 mb-10">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-2">מדיניות משלוחים</h1>
          <p className="text-gray-400">כל המידע על משלוחים וזמני אספקה</p>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-4xl">
        {/* Shipping Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white p-6 rounded-2xl shadow-sm text-center">
            <div className="w-14 h-14 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Truck className="text-secondary" size={28} />
            </div>
            <h3 className="font-bold text-lg mb-2">משלוח חינם</h3>
            <p className="text-gray-600 text-sm">בהזמנה מעל ₪300</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm text-center">
            <div className="w-14 h-14 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="text-secondary" size={28} />
            </div>
            <h3 className="font-bold text-lg mb-2">אספקה מהירה</h3>
            <p className="text-gray-600 text-sm">3-5 ימי עסקים</p>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-8">
          {/* Shipping Info */}
          <section className="bg-white p-8 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <Truck className="text-secondary" size={24} />
              <h2 className="text-2xl font-bold">מידע על משלוחים</h2>
            </div>
            
            <div className="space-y-4 text-gray-700">
              <p>
                אנו שולחים את היינות שלנו בתנאים מיוחדים לשמירה על איכות היין. 
                כל המשלוחים נארזים באריזות מיוחדות המגנות על הבקבוקים במהלך המשלוח.
              </p>
              
              <h3 className="font-bold text-lg mt-6 mb-3">עלויות משלוח:</h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-secondary rounded-full"></span>
                  <span>הזמנות מעל ₪300 - <strong className="text-green-600">משלוח חינם!</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-secondary rounded-full"></span>
                  <span>הזמנות עד ₪300 - משלוח בעלות של ₪30</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-secondary rounded-full"></span>
                  <span>איסוף עצמי - חינם (בתיאום מראש)</span>
                </li>
              </ul>

              <h3 className="font-bold text-lg mt-6 mb-3">אזורי משלוח:</h3>

              <ul className="grid grid-cols-2 gap-2 mt-2">
                <li className="flex items-center gap-2">
                  <MapPin size={14} className="text-secondary" />
                  <span>גוש דן</span>
                </li>
                <li className="flex items-center gap-2">
                  <MapPin size={14} className="text-secondary" />
                  <span>ירושלים</span>
                </li>
                <li className="flex items-center gap-2">
                  <MapPin size={14} className="text-secondary" />
                  <span>חיפה והצפון</span>
                </li>
                <li className="flex items-center gap-2">
                  <MapPin size={14} className="text-secondary" />
                  <span>באר שבע והדרום</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Delivery Times */}
          <section className="bg-white p-8 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <Clock className="text-secondary" size={24} />
              <h2 className="text-2xl font-bold">זמני אספקה</h2>
            </div>
            
            <div className="space-y-4 text-gray-700">
              <p>זמני האספקה משתנים בהתאם לאזור המגורים:</p>
              
              <div className="overflow-x-auto">
                <table className="w-full mt-4">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-right py-3 px-4 font-bold">אזור</th>
                      <th className="text-right py-3 px-4 font-bold">זמן אספקה</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-4">גוש דן והמרכז</td>
                      <td className="py-3 px-4">2-3 ימי עסקים</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-4">ירושלים</td>
                      <td className="py-3 px-4">2-3 ימי עסקים</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-4">חיפה והצפון</td>
                      <td className="py-3 px-4">3-4 ימי עסקים</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-4">הדרום</td>
                      <td className="py-3 px-4">3-5 ימי עסקים</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4">יישובים מרוחקים</td>
                      <td className="py-3 px-4">4-7 ימי עסקים</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <p className="text-sm text-gray-500 mt-4">
                * הזמנות שהתקבלו לאחר השעה 14:00 יטופלו ביום העסקים הבא.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section className="bg-secondary/5 p-8 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <Phone className="text-secondary" size={24} />
              <h2 className="text-2xl font-bold">שאלות?</h2>
            </div>
            <p className="text-gray-700 mb-4">
              אם יש לכם שאלות נוספות לגבי המשלוחים, אנחנו כאן לעזור!
            </p>
            <div className="flex flex-wrap gap-4">
              <a 
                href="tel:050-9480040" 
                className="inline-flex items-center gap-2 bg-secondary text-white px-6 py-3 rounded-full font-medium hover:bg-red-900 transition-colors"
              >
                <Phone size={18} />
                050-9480040
              </a>
              <a 
                href="mailto:ivninov45@gmail.com" 
                className="inline-flex items-center gap-2 bg-white text-gray-900 px-6 py-3 rounded-full font-medium hover:bg-gray-100 transition-colors border border-gray-200"
              >
                ivninov45@gmail.com
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ShippingPage;
