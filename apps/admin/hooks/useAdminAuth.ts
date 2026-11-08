import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@convex/api";

export interface SignInInput {
  email: string;
  password: string;
}

/**
 * Admin authentication hook: sign-in, sign-out and auth state.
 * Admin role validation is handled reactively by components/app.
 */
export function useAdminAuth() {
  const { signIn: convexSignIn, signOut: convexSignOut } = useAuthActions();
  const { isLoading: isAuthLoading, isAuthenticated: sessionAuthenticated } = useConvexAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reactive query for the current user
  const currentUser = useQuery(api.users.get);
  const isAuthenticated = sessionAuthenticated && currentUser !== undefined && currentUser !== null;
  const isAdmin = isAuthenticated && currentUser?.role === 'admin';

  const parseError = (err: unknown): string => {
    const message = (err as Error)?.message || "";

    if (message.includes("Invalid password") || message.includes("Incorrect password")) {
      return "שם משתמש או סיסמה שגויים";
    }
    if (message.includes("User does not exist") || message.includes("Invalid credentials")) {
      return "לא קיים משתמש עם כתובת אימייל זו";
    }
    if (message.includes("דורש התחברות") || message.includes("admin")) {
      return "גישה נדחתה - מערכת ניהול למנהלים בלבד";
    }

    return "שגיאה בהתחברות. אנא בדקו את הפרטים ונסו שוב";
  };

  const signIn = async (data: SignInInput): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      await convexSignIn("password", {
        email: data.email,
        password: data.password,
        flow: "signIn",
      });

      return true;
    } catch (err) {
      console.error("Admin sign in error:", err);
      setError(parseError(err));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    await convexSignOut();
  };

  const clearError = () => setError(null);

  return {
    signIn,
    signOut,
    isLoading: isLoading || isAuthLoading || (sessionAuthenticated && currentUser === undefined),
    error,
    clearError,
    currentUser,
    isAuthenticated,
    isAdmin,
  };
}
