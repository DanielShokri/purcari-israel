import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useQuery, useMutation, Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from '@convex/api';
import { Id } from '@convex/dataModel';

import { Address, AuthUser, Order } from '@shared/types';
import { 
  profileSchema, 
  addressFormSchema, 
  ProfileInput, 
  AddressFormInput 
} from '../schemas/validationSchemas';

import {
  DashboardHeader,
  DashboardTabs,
  OrdersTab,
  ProfileTab,
  AddressesTab,
  AddressModal,
  TabId,
} from '../components/dashboard';

import { useCart } from '../hooks/useCart';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const [activeTab, setActiveTab] = useState<TabId>('orders');
  
  // Queries & Mutations
  const convexUser = useQuery(api.users.get);
  
  // User now includes addresses in the combined data structure
  type UserWithAddresses = AuthUser & { addresses?: Address[] };
  const user = convexUser as UserWithAddresses | null;
  const isUserLoading = convexUser === undefined;
  
  // Extract addresses from the combined user data
  const addresses = convexUser?.addresses || [];

   const convexOrders = useQuery(api.orders.listByCustomer, convexUser ? {} : "skip");
   const orders = convexOrders as Order[] || [];
   // Orders are loading only if we have a user email but convexOrders is still undefined
   const isOrdersLoading = (convexUser && convexUser.email) ? convexOrders === undefined : false;
  
  const { signOut } = useAuthActions();
  const updateProfileMutation = useMutation(api.users.updateProfile);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const createAddress = useMutation(api.userAddresses.create);
  const updateAddress = useMutation(api.userAddresses.update);
  const removeAddress = useMutation(api.userAddresses.remove);
  const [isUpdatingPrefs, setIsUpdatingPrefs] = useState(false);

  const [profileStatus, setProfileStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Track if profile form has been initialized to prevent resets while typing
  const profileInitializedRef = useRef(false);

  // Profile Form
  const { 
    register: registerProfile, 
    handleSubmit: handleProfileSubmitHook, 
    formState: { errors: profileErrors },
    reset: resetProfile
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
  });

  // Address Form
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  
  const addressFormMethods = useForm<AddressFormInput>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: {
      name: '',
      phone: '',
      street: '',
      city: '',
      postalCode: '',
      country: 'Israel',
      isDefault: false
    }
  });

  const { reset: resetAddress } = addressFormMethods;

  useEffect(() => {
    // Only initialize the form once when user data is first available
    // This prevents the form from being reset while the user is typing
    if (user && !profileInitializedRef.current) {
      resetProfile({
        name: user.name || '',
        phone: user.phone || ''
      });
      profileInitializedRef.current = true;
    }
  }, [user, resetProfile]);

  // Handlers
  const handleLogout = async () => {
    await signOut();
    // Note: We don't clear the cart on logout - user's cart persists in the database
    navigate('/login');
  };

  const onProfileSubmit = async (data: ProfileInput) => {
    setProfileStatus(null);
    setIsUpdatingProfile(true);
    try {
      await updateProfileMutation({ 
        name: data.name,
        phone: data.phone
      });
      setProfileStatus({ type: 'success', message: 'הפרופיל עודכן בהצלחה' });
    } catch (err: any) {
      setProfileStatus({ type: 'error', message: err.message || 'שגיאה בעדכון הפרופיל' });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

   const onAddressSubmit = async (data: AddressFormInput) => {
      if (!user) return;
      setIsUpdatingPrefs(true);
      try {
        if (editingAddressId) {
          await updateAddress({
            addressId: editingAddressId as Id<"userAddresses">,
            ...data,
            postalCode: data.postalCode || '',
          });
        } else {
           await createAddress({
             ...data,
             postalCode: data.postalCode || '',
           });
        }
       closeAddressModal();
    } catch (err) {
      console.error('Failed to update addresses:', err);
    } finally {
      setIsUpdatingPrefs(false);
    }
  };

  const deleteAddress = async (id: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק כתובת זו?')) return;
    try {
      await removeAddress({ addressId: id as Id<"userAddresses"> });
    } catch (err) {
      console.error('Failed to delete address:', err);
    }
  };

  const openEditAddress = (address: Address) => {
    setEditingAddressId(address._id);
    resetAddress({
      name: address.name,
      phone: address.phone || '',
      street: address.street,
      city: address.city,
      postalCode: address.postalCode,
      country: address.country,
      isDefault: address.isDefault || false
    });
    setIsAddressModalOpen(true);
  };

  const openNewAddress = () => {
    setEditingAddressId(null);
    resetAddress({
      name: '',
      phone: '',
      street: '',
      city: '',
      postalCode: '',
      country: 'Israel',
      isDefault: false
    });
    setIsAddressModalOpen(true);
  };

  const closeAddressModal = () => {
    setIsAddressModalOpen(false);
    setEditingAddressId(null);
    resetAddress({
      name: '',
      street: '',
      city: '',
      postalCode: '',
      country: 'Israel',
      isDefault: false
    });
  };

  return (
    <>
      <AuthLoading>
        <div className="min-h-screen flex items-center justify-center">טוען...</div>
      </AuthLoading>
      
      <Unauthenticated>
        <RedirectToLogin />
      </Unauthenticated>
      
      <Authenticated>
        {isUserLoading ? (
          <div className="min-h-screen flex items-center justify-center">טוען...</div>
        ) : !user ? (
          <div className="min-h-screen flex items-center justify-center">טוען נתוני משתמש...</div>
        ) : (
          <div className="bg-gray-50 min-h-screen py-12">
            <div className="container mx-auto px-4 max-w-4xl">
              <DashboardHeader user={user} onLogout={handleLogout} />
              
              <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} />

              <div className="min-h-[400px]">
                <AnimatePresence mode="wait">
                  {activeTab === 'orders' && (
                    <OrdersTab orders={orders} isLoading={isOrdersLoading} />
                  )}

                  {activeTab === 'profile' && (
                    <ProfileTab
                      userEmail={user.email}
                      register={registerProfile}
                      errors={profileErrors}
                      onSubmit={handleProfileSubmitHook(onProfileSubmit)}
                      isUpdating={isUpdatingProfile || isUpdatingPrefs}
                      status={profileStatus}
                    />
                  )}
                  {activeTab === 'addresses' && (
                    <AddressesTab
                      addresses={addresses}
                      isLoading={isUserLoading}
                      onAddNew={openNewAddress}
                      onEdit={openEditAddress}
                      onDelete={deleteAddress}
                    />
                  )}
                </AnimatePresence>
              </div>

              <AddressModal
                isOpen={isAddressModalOpen}
                isEditing={!!editingAddressId}
                formMethods={addressFormMethods}
                isSubmitting={isUpdatingPrefs}
                onSubmit={addressFormMethods.handleSubmit(onAddressSubmit)}
                onClose={closeAddressModal}
              />
            </div>
          </div>
        )}
      </Authenticated>
    </>
  );
};

// Helper component to handle redirect
const RedirectToLogin: React.FC = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate('/login');
  }, [navigate]);
  
  return <div className="min-h-screen flex items-center justify-center">מפנה...</div>;
};

export default DashboardPage;
