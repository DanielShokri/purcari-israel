import * as z from 'zod';

const phoneRegex = /^0\d{1,2}-?\d{7}$/;
const addressRegex = /[א-תa-zA-Z]/; // At least one letter
// Full name: at least 3 chars + space + at least 3 chars (e.g., "John Doe", "ישראל ישראלי")
const fullNameRegex = /^\S{3,}\s+\S{3,}$/;

export const emailSchema = z.string()
  .min(1, 'אימייל הוא שדה חובה')
  .email('כתובת אימייל לא תקינה');

export const passwordSchema = z.string()
  .min(8, 'הסיסמה חייבת להכיל לפחות 8 תווים');

// Simple name validation (for address nicknames, short names)
export const nameSchema = z.string()
  .min(2, 'השם חייב להכיל לפחות 2 תווים');

// Full name validation: first name (3+ chars) + space + last name (3+ chars)
export const fullNameSchema = z.string()
  .min(7, 'השם המלא חייב להכיל שם פרטי ושם משפחה')
  .regex(fullNameRegex, 'השם המלא חייב להכיל שם פרטי (לפחות 3 תווים), רווח ושם משפחה (לפחות 3 תווים)');

export const phoneSchema = z.string()
  .min(1, 'מספר טלפון הוא שדה חובה')
  .regex(phoneRegex, 'מספר טלפון לא תקין (לדוגמה: 050-1234567)');

export const streetSchema = z.string()
  .min(3, 'כתובת קצרה מדי')
  .refine(val => addressRegex.test(val), 'כתובת חייבת להכיל אותיות');

export const citySchema = z.string()
  .min(2, 'עיר לא תקינה');

export const postalCodeSchema = z.string()
  .optional();

// Auth Schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const registerSchema = z.object({
  name: fullNameSchema,
  email: emailSchema,
  password: passwordSchema,
  phone: phoneSchema,
});

// Contact Schema
export const contactSchema = z.object({
  name: fullNameSchema,
  email: emailSchema,
  subject: z.string().min(2, 'נושא קצר מדי'),
  message: z.string().min(10, 'הודעה חייבת להכיל לפחות 10 תווים'),
});

// Shipping Schema
export const shippingSchema = z.object({
  name: fullNameSchema,
  email: emailSchema,
  phone: phoneSchema,
  street: streetSchema,
  city: citySchema,
  postalCode: postalCodeSchema,
  country: z.string().min(1, 'מדינה היא שדה חובה'),
});

// Payment Schema - DEPRECATED: Now using Rivhit hosted payment page
// Keeping the schema for backward compatibility if needed
export const paymentSchema = z.object({
  cardNumber: z.string().optional(),
  expiryDate: z.string().optional(),
  cvv: z.string().optional(),
});

// Profile Schema
export const profileSchema = z.object({
  name: fullNameSchema,
  phone: phoneSchema,
});

// Address Schema (name is a nickname like "בית", "משרד" - not a full name)
export const addressFormSchema = z.object({
  name: z.string().min(2, 'כינוי קצר מדי'),
  street: streetSchema,
  city: citySchema,
  postalCode: postalCodeSchema,
  country: z.string().min(1, 'מדינה היא שדה חובה'),
  isDefault: z.boolean(),
});

// Checkout Schema (Shipping only - payment handled by Rivhit hosted page)
export const checkoutSchema = z.object({
  // Shipping
  name: fullNameSchema,
  email: emailSchema,
  phone: phoneSchema,
  street: streetSchema,
  city: citySchema,
  postalCode: postalCodeSchema,
  country: z.string().min(1, 'מדינה היא שדה חובה'),
  // Coupon
  couponCode: z.string().optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type ShippingInput = z.infer<typeof shippingSchema>;
export type PaymentInput = z.infer<typeof paymentSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type AddressFormInput = z.infer<typeof addressFormSchema>;
