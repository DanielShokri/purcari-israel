import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";

export interface SignUpInput {
  email: string;
  password: string;
  name: string;
  phone: string;
}

export interface SignInInput {
  email: string;
  password: string;
}

export function useAuth() {
  const { signIn: convexSignIn, signOut: convexSignOut } = useAuthActions();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseError = (err: unknown, isLogin: boolean): string => {
    const message = (err as Error)?.message || "";

    if (message.includes("Invalid password") || message.includes("הסיסמה")) {
      return "הסיסמה לא עומדת בדרישות. הסיסמה חייבת להכיל לפחות 8 תווים.";
    }
    if (message.includes("User does not exist") || message.includes("Invalid credentials")) {
      return "לא קיים משתמש עם כתובת אימייל זו.";
    }
    if (message.includes("Incorrect password")) {
      return "הסיסמה שהוזנה אינה נכונה.";
    }
    if (message.includes("already exists") || message.includes("constraint")) {
      return "כתובת אימייל זו כבר רשומה במערכת.";
    }
    if (message.includes("Invalid email") || message.includes("אימייל")) {
      return "כתובת אימייל לא תקינה.";
    }

    return isLogin
      ? "שגיאה בהתחברות. אנא בדקו את הפרטים ונסו שוב."
      : "שגיאה בהרשמה. אנא נסו שוב מאוחר יותר.";
  };

  const parseGoogleError = (err: unknown): string => {
    const message = (err as Error)?.message || "";

    // OAuth specific errors
    if (message.includes("popup_closed") || message.includes("closed")) {
      return "ההתחברות בוטלה";
    }
    if (message.includes("popup_blocked") || message.includes("blocked")) {
      return "חלון ההתחברות נחסם. אנא אפשרו חלונות קופצים לאתר זה.";
    }
    if (message.includes("access_denied")) {
      return "ההתחברות נדחתה. אנא אשרו את הגישה המבוקשת.";
    }

    return "שגיאה בהתחברות עם Google. אנא נסו שוב.";
  };

  const signUp = async (data: SignUpInput): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await convexSignIn("password", {
        email: data.email,
        password: data.password,
        name: data.name,
        phone: data.phone,
        flow: "signUp",
      });


      return true;
    } catch (err) {
      console.error("Sign up error:", err);
      setError(parseError(err, false));
      return false;
    } finally {
      setIsLoading(false);
    }
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

      // The user document is created by the Convex Auth createOrUpdateUser callback,
      // so no profile call is needed here.

      return true;
    } catch (err) {
      console.error("Sign in error:", err);
      setError(parseError(err, true));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    await convexSignOut();
  };

  const signInWithGoogle = async (): Promise<boolean> => {
    setIsGoogleLoading(true);
    setError(null);
    try {
      // The library redirects internally; `redirectTo` sets where the OAuth callback
      // lands the user after sign-in.
      const params = new URLSearchParams(window.location.search);
      const redirectParam = params.get("redirect");
      await convexSignIn("google", {
        redirectTo: redirectParam ? `/${redirectParam}` : "/dashboard",
      });
      return true;
    } catch (err) {
      console.error("Google sign in error:", err);
      setError(parseGoogleError(err));
      setIsGoogleLoading(false);
      return false;
    }
  };

  const clearError = () => setError(null);

  return {
    signUp,
    signIn,
    signOut,
    signInWithGoogle,
    isLoading,
    isGoogleLoading,
    error,
    clearError,
  };
}
