import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, Clock, ChevronLeft } from 'lucide-react';
import { Order } from '@shared/types';

interface OrdersTabProps {
  orders: Order[] | undefined;
  isLoading: boolean;
}

const OrderStatusBadge: React.FC<{ status: Order['status'] }> = ({ status }) => {
  const statusConfig = {
    pending: { label: 'בהמתנה', className: 'bg-blue-100 text-blue-700' },
    processing: { label: 'בטיפול', className: 'bg-blue-100 text-blue-700' },
    shipped: { label: 'נשלח', className: 'bg-blue-100 text-blue-700' },
    completed: { label: 'הושלם', className: 'bg-green-100 text-green-700' },
    cancelled: { label: 'בוטל', className: 'bg-red-100 text-red-700' },
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold ${config.className}`}>
      {config.label}
    </span>
  );
};

const OrderCard: React.FC<{ order: Order }> = ({ order }) => (
  <Link
    to={`/order-confirmation/${order._id}`}
    aria-label={`לפרטי הזמנה #${order._id.slice(-6).toUpperCase()}`}
    className="group bg-white p-6 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 transition-shadow"
  >
    <div className="flex items-center gap-4">
      <div className="bg-gray-50 p-3 rounded-xl text-gray-400">
        <Clock size={24} />
      </div>
      <div className="text-right">
        <p className="font-bold text-gray-900">הזמנה #{order._id.slice(-6).toUpperCase()}</p>
        <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString('he-IL')}</p>
      </div>
    </div>
    
    <div className="flex items-center gap-8">
      <div className="text-right">
        <p className="text-xs text-gray-500 mb-1 text-center md:text-right">סה"כ</p>
        <p className="font-bold text-secondary">₪{order.total}</p>
      </div>
      <div className="text-right">
        <p className="text-xs text-gray-500 mb-1 text-center md:text-right">סטטוס</p>
        <OrderStatusBadge status={order.status} />
      </div>
      <span
        className="p-2 bg-gray-50 rounded-full text-gray-400 transition-all group-hover:text-secondary group-hover:bg-red-50"
        aria-hidden="true"
      >
        <ChevronLeft size={20} />
      </span>
    </div>
  </Link>
);

const LoadingSkeleton: React.FC = () => (
  <div className="space-y-4">
    {[1, 2, 3].map(i => (
      <div key={i} className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
    ))}
  </div>
);

const EmptyState: React.FC = () => (
  <div className="bg-white p-12 rounded-3xl text-center shadow-sm">
    <Package size={48} className="mx-auto text-gray-200 mb-4" />
    <p className="text-gray-500 mb-6">עדיין לא ביצעת הזמנות</p>
    <Link to="/products" className="bg-secondary text-white px-8 py-3 rounded-full font-bold">
      עבור לחנות
    </Link>
  </div>
);

const OrdersTab: React.FC<OrdersTabProps> = ({ orders, isLoading }) => {
  return (
    <motion.div
      key="orders"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      {isLoading ? (
        <LoadingSkeleton />
      ) : orders && orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderCard key={order._id} order={order} />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
    </motion.div>
  );
};

export default OrdersTab;
