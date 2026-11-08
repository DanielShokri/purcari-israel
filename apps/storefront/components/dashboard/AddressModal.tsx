import React from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { FormProvider, UseFormReturn } from 'react-hook-form';
import { AddressFormInput } from '../../schemas/validationSchemas';
import AddressAutocomplete from '../common/AddressAutocomplete';

interface AddressModalProps {
  isOpen: boolean;
  isEditing: boolean;
  formMethods: UseFormReturn<AddressFormInput>;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

const AddressModal: React.FC<AddressModalProps> = ({
  isOpen,
  isEditing,
  formMethods,
  isSubmitting,
  onSubmit,
  onClose,
}) => {
  if (!isOpen) return null;

  const { register, formState: { errors } } = formMethods;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-lg rounded-3xl shadow-xl"
      >
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-xl font-bold">
            {isEditing ? 'עריכת כתובת' : 'הוספת כתובת חדשה'}
          </h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <Plus size={24} className="rotate-45" />
          </button>
        </div>
        
        <FormProvider {...formMethods}>
          <form onSubmit={onSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                כינוי לכתובת (בית, עבודה וכו') <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('name')}
                className={`w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all ${errors.name ? 'border-red-500' : ''}`}
                placeholder="לדוגמה: הבית שלי"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">טלפון</label>
              <input
                type="tel"
                {...register('phone')}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all"
                placeholder="050-0000000"
                dir="ltr"
              />
            </div>

            <div>
              <AddressAutocomplete
                name="street" 
                label="רחוב ומספר בית" 
                placeholder="רחוב הירקון 1"
                error={errors.street?.message}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  עיר <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('city')}
                  className={`w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all ${errors.city ? 'border-red-500' : ''}`}
                  placeholder="תל אביב"
                />
                {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">מיקוד</label>
                <input
                  type="text"
                  {...register('postalCode')}
                  className={`w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all ${errors.postalCode ? 'border-red-500' : ''}`}
                  placeholder="1234567"
                />
                {errors.postalCode && <p className="text-red-500 text-xs mt-1">{errors.postalCode.message}</p>}
              </div>
            </div>
            
            <div className="flex items-center gap-2 py-2">
              <input
                type="checkbox"
                id="isDefault"
                {...register('isDefault')}
                className="w-5 h-5 rounded border-gray-300 text-secondary focus:ring-secondary"
              />
              <label htmlFor="isDefault" className="text-sm font-medium text-gray-700 cursor-pointer">
                הגדרה ככתובת ברירת מחדל
              </label>
            </div>
            
            <div className="pt-4 flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-secondary text-white py-3 rounded-xl font-bold hover:bg-red-900 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'שומר...' : (isEditing ? 'עדכון כתובת' : 'שמירת כתובת')}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors cursor-pointer"
              >
                ביטול
              </button>
            </div>
          </form>
        </FormProvider>
      </motion.div>
    </div>
  );
};

export default AddressModal;
