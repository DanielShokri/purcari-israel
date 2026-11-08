import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import useToast from "../../store/hooks/useToast";
import { LogIn, UserPlus, Mail, Lock, User as UserIcon, AlertCircle, Phone } from "lucide-react";
import { motion } from "framer-motion";
import { useForm, SubmitHandler, FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, registerSchema, LoginInput, RegisterInput } from "../../schemas/validationSchemas";
import { useAuth, SignUpInput, SignInInput } from "../../hooks/useAuth";
import { useAnalytics, useTrackSignup, useTrackLogin } from "../../hooks/useAnalytics";
import { Authenticated } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { suppressAllBeforeunloadListeners } from "../../lib/beforeunloadGuard";

// Google icon component for sign-in button
const GoogleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

type FormData = LoginInput | RegisterInput;

const AuthForm: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect");
  const toast = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const { signIn, signUp, isLoading, error, clearError } = useAuth();
  const { signIn: convexSignIn } = useAuthActions();
  const { identify } = useAnalytics();
  const { trackSignup } = useTrackSignup();
  const { trackLogin } = useTrackLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(isLogin ? loginSchema : registerSchema),
  });

  const registerErrors = errors as FieldErrors<RegisterInput>;
  const loginErrors = errors as FieldErrors<LoginInput>;

  useEffect(() => {
    reset();
    clearError();
  }, [isLogin]);

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    let success = false;

    if (isLogin) {
      const loginData: SignInInput = { email: data.email, password: data.password };
      success = await signIn(loginData);
      if (success) {
        toast.success("התחברת בהצלחה");
        trackLogin("email");
      }
    } else {
      const registerData: SignUpInput = {
        email: data.email,
        password: data.password,
        name: (data as RegisterInput).name,
        phone: (data as RegisterInput).phone,
      };
      success = await signUp(registerData);
      if (success) {
        toast.success("ברוכים הבאים! החשבון נוצר בהצלחה");
        trackSignup("email", true);
      }
    }

    if (success) {
      // Link anonymous browsing history to authenticated user
      identify();
      const url = redirect ? `/${redirect}` : "/dashboard";
      navigate(url);
    } else if (error) {
      toast.error(error);
    }
  };

  const handleGoogleSignIn = async () => {
    trackLogin("google");
    setIsGoogleLoading(true);

    // Detach all beforeunload listeners before the OAuth redirect (Firefox ignores
    // stopImmediatePropagation); they are restored on pagehide.
    const restore = suppressAllBeforeunloadListeners();

    try {
      await convexSignIn("google");
    } catch (err) {
      // Error means no navigation is happening — restore listeners immediately.
      restore();
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Component to handle redirect for authenticated users
  const AuthenticatedRedirect: React.FC = () => {
    useEffect(() => {
      const destination = redirect || "/";
      navigate(destination, { replace: true });
    }, []);

    return null;
  };

  return (
    <>
      <Authenticated>
        <AuthenticatedRedirect />
      </Authenticated>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md"
      >
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">{isLogin ? "ברוכים השבים" : "הצטרפו אלינו"}</h1>
        <p className="text-gray-500">
          {isLogin ? "התחברו לחשבון שלכם כדי לצפות בהזמנות" : "צרו חשבון כדי לעקוב אחר ההזמנות, לנהל כתובות משלוח ועוד"}
        </p>
      </div>

      {(error || Object.keys(errors).length > 0) && (
        <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl mb-6 flex flex-col gap-2 text-sm">
          {error && (
            <div className="flex items-center gap-3">
              <AlertCircle size={18} />
              {error}
            </div>
          )}
          {!error && (
            <div className="flex items-center gap-3">
              <AlertCircle size={18} /> אנא בדקו את השדות המסומנים
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {!isLogin && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                שם מלא <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 start-0 flex items-center ps-3 text-gray-400">
                  <UserIcon size={18} />
                </span>
                <input
                  type="text"
                  {...register("name" as const)}
                  className={`w-full border-gray-300 rounded-xl p-3 ps-10 border focus:ring-secondary focus:border-secondary ${
                    !isLogin && registerErrors.name ? "border-red-500" : ""
                  }`}
                />
              </div>
              {!isLogin && registerErrors.name && (
                <p className="text-red-500 text-xs mt-1">{registerErrors.name.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                טלפון נייד <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 start-0 flex items-center ps-3 text-gray-400">
                  <Phone size={18} />
                </span>
                <input
                  type="tel"
                  {...register("phone" as const)}
                  placeholder="050-1234567"
                  dir="ltr"
                  className={`w-full border-gray-300 rounded-xl p-3 ps-10 border focus:ring-secondary focus:border-secondary text-left ${
                    !isLogin && registerErrors.phone ? "border-red-500" : ""
                  }`}
                />
              </div>
              {!isLogin && registerErrors.phone && (
                <p className="text-red-500 text-xs mt-1">{registerErrors.phone.message}</p>
              )}
            </div>
          </>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            אימייל <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 start-0 flex items-center ps-3 text-gray-400">
              <Mail size={18} />
            </span>
            <input
              type="email"
              {...register("email")}
              className={`w-full border-gray-300 rounded-xl p-3 ps-10 border focus:ring-secondary focus:border-secondary ${
                errors.email ? "border-red-500" : ""
              }`}
            />
          </div>
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            סיסמה <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 start-0 flex items-center ps-3 text-gray-400">
              <Lock size={18} />
            </span>
            <input
              type="password"
              {...register("password")}
              className={`w-full border-gray-300 rounded-xl p-3 ps-10 border focus:ring-secondary focus:border-secondary ${
                errors.password ? "border-red-500" : ""
              }`}
            />
          </div>
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-secondary text-white py-4 rounded-xl font-bold text-lg hover:bg-red-900 transition-colors flex items-center justify-center gap-2 mt-4 shadow-lg cursor-pointer disabled:opacity-70"
        >
          {isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
          {isLoading
            ? "מעביר לחשבון..."
            : isLogin
            ? "התחברות"
            : "הרשמה"}
        </button>
      </form>

      {/* Google Sign-in */}
      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">או</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading}
          aria-label="המשיכו עם Google"
          className="mt-4 w-full bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-400 transition-colors flex items-center justify-center gap-3 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isGoogleLoading ? (
            <svg className="w-5 h-5 animate-spin text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <GoogleIcon className="w-5 h-5" />
          )}
          <span>{isGoogleLoading ? "מתחבר..." : "המשיכו עם Google"}</span>
        </button>
      </div>

      <div className="mt-8 pt-6 border-t text-center">
        <p className="text-gray-500 mb-2">{isLogin ? "עדיין לא רשומים?" : "כבר יש לכם חשבון?"}</p>
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="text-secondary font-bold hover:underline cursor-pointer"
        >
          {isLogin ? "צרו חשבון עכשיו" : "התחברו כאן"}
        </button>
      </div>
    </motion.div>
    </>
  );
};

export default AuthForm;
