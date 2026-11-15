import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram } from 'lucide-react';

// Official Purcari logo from purcari.de (white version with transparent background)
const PURCARI_LOGO_URL = 'https://www.purcari.de/cdn/shop/files/Purcari-Logo-Weiss-510x313.png?v=1699458103&width=160';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/">
              <img 
                src={PURCARI_LOGO_URL}
                alt="Purcari - Château Purcari"
                width={65}
                height={40}
                loading="lazy"
                className="h-10 w-auto"
              />
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              יינות פרימיום מבית פורקרי, המשלבים מסורת של מאות שנים עם טכנולוגיה מודרנית. טעם של איכות בלתי מתפשרת.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h2 className="text-lg font-bold mb-6 text-accent">ניווט מהיר</h2>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><Link to="/about" className="hover:text-white transition-colors">הסיפור שלנו</Link></li>
              <li><Link to="/products" className="hover:text-white transition-colors">החנות</Link></li>
              <li><Link to="/shipping" className="hover:text-white transition-colors">מדיניות משלוחים</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">צור קשר</Link></li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h2 className="text-lg font-bold mb-6 text-accent">מידע משפטי</h2>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><Link to="/terms" className="hover:text-white transition-colors">תנאי שימוש</Link></li>
              <li><Link to="/privacy" className="hover:text-white transition-colors">מדיניות פרטיות</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h2 className="text-lg font-bold mb-6 text-accent">צור קשר</h2>
            <ul className="space-y-3 text-sm text-gray-400">
              <li>טלפון: 050-9480040</li>
              <li>אימייל: ivninov45@gmail.com</li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h2 className="text-lg font-bold mb-6 text-accent">עקבו אחרינו</h2>
            <div className="flex space-x-4">
              <a href="https://www.facebook.com/purcariwines/" aria-label="Facebook" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <Facebook size={20} />
              </a>
              <a href="https://www.instagram.com/purcari_israel/?hl=en/" aria-label="Instagram" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <Instagram size={20} />
              </a>
            </div>
          </div>
          
        </div>

        <div className="border-t border-gray-800 pt-8 text-center text-xs text-gray-400">
          <p>&copy; {new Date().getFullYear()} Purcari Israel. כל הזכויות שמורות.</p>
          <p className="mt-2">אזהרה: צריכה מופרזת של אלכוהול מסכנת חיים ומזיקה לבריאות.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;