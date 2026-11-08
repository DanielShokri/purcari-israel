import React from 'react';
import { MapPin, Edit2, Trash2 } from 'lucide-react';
import { Address } from '@shared/types';

interface AddressCardProps {
  address: Address;
  onEdit: (address: Address) => void;
  onDelete: (id: string) => void;
}

const AddressCard: React.FC<AddressCardProps> = ({ address, onEdit, onDelete }) => {
  return (
    <div 
      className={`bg-white p-6 rounded-2xl shadow-sm border-2 transition-all ${
        address.isDefault ? 'border-secondary/20 bg-red-50/10' : 'border-transparent'
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="bg-gray-50 p-2 rounded-lg text-secondary">
          <MapPin size={20} />
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onEdit(address)}
            className="p-2 text-gray-400 hover:text-secondary hover:bg-red-50 rounded-lg transition-all cursor-pointer"
          >
            <Edit2 size={16} />
          </button>
          <button 
            onClick={() => onDelete(address._id)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <h4 className="font-bold text-gray-900 mb-1">
        {address.name}
        {address.isDefault && (
          <span className="ms-2 text-[10px] bg-secondary text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
            ברירת מחדל
          </span>
        )}
      </h4>
      <p className="text-gray-500 text-sm">{address.street}</p>
      <p className="text-gray-500 text-sm">{address.city}, {address.postalCode}</p>
      <p className="text-gray-500 text-sm">{address.country}</p>
      {address.phone && (
        <p className="text-gray-500 text-sm mt-1" dir="ltr">{address.phone}</p>
      )}
    </div>
  );
};

export default AddressCard;
