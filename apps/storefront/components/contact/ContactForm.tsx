import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, CheckCircle2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contactSchema, ContactInput } from '../../schemas/validationSchemas';

const ContactForm: React.FC = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema)
  });

  const onSubmit = (data: ContactInput) => {
    setIsSubmitted(true);
    reset();
  };

  return (
    <motion.div 
      className="lg:col-span-2 bg-white p-8 md:p-12 rounded-3xl shadow-xl"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8 }}
    >
      {isSubmitted ? (
        <div className="text-center py-12">
          <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">ההודעה נשלחה בהצלחה!</h2>
          <p className="text-gray-600 mb-8">תודה שפנית אלינו. נציג מטעמנו יחזור אליך בהקדם האפשרי.</p>
          <button 
            onClick={() => setIsSubmitted(false)}
            className="text-secondary font-bold hover:underline cursor-pointer"
          >
            שלח הודעה נוספת
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">שם מלא <span className="text-red-500">*</span></label>
              <input
                type="text"
                id="name"
                {...register('name')}
                className={`w-full border-gray-200 rounded-xl p-3 border focus:ring-2 focus:ring-secondary focus:border-secondary transition-all ${errors.name ? 'border-red-500' : ''}`}
                placeholder="הכנס שם מלא"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">אימייל <span className="text-red-500">*</span></label>
              <input
                type="email"
                id="email"
                {...register('email')}
                className={`w-full border-gray-200 rounded-xl p-3 border focus:ring-2 focus:ring-secondary focus:border-secondary transition-all ${errors.email ? 'border-red-500' : ''}`}
                placeholder="email@example.com"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
          </div>
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">נושא הפנייה <span className="text-red-500">*</span></label>
            <input
              type="text"
              id="subject"
              {...register('subject')}
              className={`w-full border-gray-200 rounded-xl p-3 border focus:ring-2 focus:ring-secondary focus:border-secondary transition-all ${errors.subject ? 'border-red-500' : ''}`}
              placeholder="איך נוכל לעזור?"
            />
            {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject.message}</p>}
          </div>
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">הודעה <span className="text-red-500">*</span></label>
            <textarea
              id="message"
              {...register('message')}
              rows={5}
              className={`w-full border-gray-200 rounded-xl p-3 border focus:ring-2 focus:ring-secondary focus:border-secondary transition-all resize-none ${errors.message ? 'border-red-500' : ''}`}
              placeholder="כתוב כאן את הודעתך..."
            ></textarea>
            {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message.message}</p>}
          </div>
          <button
            type="submit"
            className="w-full bg-secondary text-white py-4 rounded-xl font-bold text-lg hover:bg-red-900 transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-1 cursor-pointer"
          >
            <Send size={20} />
            שלח הודעה
          </button>
        </form>
      )}
    </motion.div>
  );
};

export default ContactForm;
