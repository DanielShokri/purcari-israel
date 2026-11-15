import React from 'react';
import { FileText, AlertCircle } from 'lucide-react';
import SEO from '../components/SEO';
import { REFUND_BUSINESS_DAYS, RETURN_WINDOW_DAYS } from '../utils/policy';

const TermsPage: React.FC = () => {
  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      <SEO 
        title="תנאי שימוש"
        description="תנאי השימוש באתר פורקארי ישראל. קראו בעיון את התנאים לפני הרכישה."
        canonical="/terms"
      />
      
      {/* Header */}
      <div className="bg-gray-900 text-white py-12 mb-10">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-2">תנאי שימוש</h1>
          <p className="text-gray-400">עודכן לאחרונה: ינואר 2026</p>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm">
          {/* Age Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8 flex items-start gap-4">
            <AlertCircle className="text-amber-600 flex-shrink-0 mt-1" size={24} />
            <div>
              <h3 className="font-bold text-amber-800 mb-2">הגבלת גיל</h3>
              <p className="text-amber-700">
                אתר זה מיועד לבני 18 ומעלה בלבד. בביצוע הזמנה באתר, הנך מאשר/ת כי גילך מעל 18.
              </p>
            </div>
          </div>

          <div className="space-y-8 text-gray-700 leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText size={20} className="text-secondary" />
                1. כללי
              </h2>
              <p>
                ברוכים הבאים לאתר פורקארי ישראל (להלן: "האתר"). השימוש באתר ובשירותים המוצעים בו 
                כפוף לתנאי שימוש אלה. גלישה באתר ו/או רכישה בו מהווה הסכמה לתנאים אלה. 
                אם אינך מסכים/ה לתנאים, אנא הימנע/י משימוש באתר.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText size={20} className="text-secondary" />
                2. הזמנות ורכישות
              </h2>
              <ul className="space-y-3 list-disc list-inside">
                <li>כל ההזמנות באתר כפופות לאישור החברה ולזמינות המוצרים.</li>
                <li>המחירים באתר כוללים מע"מ ועשויים להשתנות ללא הודעה מוקדמת.</li>
                <li>התשלום מתבצע באמצעות כרטיס אשראי או אמצעי תשלום מאושרים אחרים.</li>
                <li>אישור ההזמנה יישלח לכתובת האימייל שסופקה.</li>
                <li>החברה שומרת לעצמה את הזכות לבטל הזמנות בנסיבות חריגות.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText size={20} className="text-secondary" />
                3. משלוחים
              </h2>
              <p>
                פרטים מלאים על מדיניות המשלוחים, זמני אספקה ועלויות ניתן למצוא 
                בעמוד <a href="/shipping" className="text-secondary hover:underline">מדיניות משלוחים</a>.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText size={20} className="text-secondary" />
                4. ביטולים והחזרות
              </h2>
              <ul className="space-y-3 list-disc list-inside">
                <li>ניתן לבטל עסקה בהתאם לחוק הגנת הצרכן תוך {RETURN_WINDOW_DAYS} יום מקבלת המוצר.</li>
                <li>ביטול עסקה יעשה בכתב (אימייל או דואר).</li>
                <li>החזר כספי יבוצע תוך {REFUND_BUSINESS_DAYS} ימי עסקים מאישור הביטול.</li>
                <li>מוצרים שנפתחו או נפגמו על ידי הלקוח לא יתקבלו להחזרה.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText size={20} className="text-secondary" />
                5. קניין רוחני
              </h2>
              <p>
                כל התכנים באתר, לרבות טקסטים, תמונות, לוגו, עיצוב גרפי וקוד, הינם קניינה 
                הבלעדי של פורקארי ישראל או של צדדים שלישיים שהעניקו לנו רישיון שימוש. 
                אין להעתיק, לשכפל, להפיץ או לעשות שימוש מסחרי בתכנים ללא אישור מפורש בכתב.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText size={20} className="text-secondary" />
                6. הגבלת אחריות
              </h2>
              <ul className="space-y-3 list-disc list-inside">
                <li>האתר מסופק "כמות שהוא" (AS IS) ללא אחריות מכל סוג.</li>
                <li>החברה אינה אחראית לנזקים ישירים או עקיפים כתוצאה משימוש באתר.</li>
                <li>החברה אינה אחראית לזמינות האתר או לתקלות טכניות.</li>
                <li>השימוש במוצרי אלכוהול הוא באחריות הרוכש בלבד.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText size={20} className="text-secondary" />
                7. שינויים בתנאי השימוש
              </h2>
              <p>
                החברה שומרת לעצמה את הזכות לשנות את תנאי השימוש מעת לעת. 
                שינויים יכנסו לתוקף עם פרסומם באתר. המשך השימוש באתר לאחר השינוי 
                מהווה הסכמה לתנאים המעודכנים.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText size={20} className="text-secondary" />
                8. דין וסמכות שיפוט
              </h2>
              <p>
                על תנאי שימוש אלה יחולו דיני מדינת ישראל בלבד. 
                סמכות השיפוט הבלעדית נתונה לבתי המשפט המוסמכים במחוז תל אביב-יפו.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText size={20} className="text-secondary" />
                9. יצירת קשר
              </h2>
              <p>
                לשאלות או בירורים בנוגע לתנאי השימוש, ניתן לפנות אלינו:
              </p>
              <ul className="mt-3 space-y-2">
                <li>טלפון: 050-9480040</li>
                <li>אימייל: ivninov45@gmail.com</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
