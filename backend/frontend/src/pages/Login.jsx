import React, { useState, useContext, useEffect } from "react";
import { toast } from "react-toastify";
import { useNavigate, Link } from "react-router-dom";
import Button from "../components/Button";
import { AppContext } from "../context/AppContext";
import { useAdmin } from "../context/AdminContext";
import { Eye, EyeOff } from "lucide-react";
import { useI18n } from "../i18n";

const LoginPage = () => {
  const { addUser, loginUser } = useContext(AppContext);
  const { enableWithPasscode } = useAdmin();
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [phone, setPhone] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => {
      // Ctrl+Shift+A
      if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        const code = window.prompt(t("auth.adminPasscode"));
        if (!code) return;
        const ok = enableWithPasscode(code);
        if (ok) {
          toast.success(t("auth.adminEnabled"));
          navigate('/');
        } else {
          toast.error(t("auth.invalidPasscode"));
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [enableWithPasscode, navigate]);

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    if (!email || !password || (!isLogin && (!name || !phone))) {
      toast.error(t("auth.allFieldsRequired"));
      return;
    }

    if (isLogin) {
      try {
        const success = await loginUser(email, password);
        if (success) {
          toast.success(t("auth.loggedIn"));
          navigate("/");
        } else {
          toast.error(t("auth.invalidLogin"));
        }
      } catch (error) {
        toast.error(t("auth.loginFailed"));
        console.error('Login error:', error);
      }
    } else {
      try {
        await addUser({ name, email, password, phone });
        toast.success(t("auth.registered"));
        navigate("/");
      } catch (error) {
        toast.error(t("auth.registrationFailed"));
        console.error('Registration error:', error);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-4xl max-w-[300px] sm:text-7xl sm:max-w-[590px] mx-auto mt-[-70px] text-center mb-10">
        {t("auth.welcome")}
      </h1>
      <div className="bg-white/20 p-8 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-3xl font-semibold text-center text-black">
          {isLogin ? t("auth.login") : t("auth.register")}
        </h2>
        <form onSubmit={onSubmitHandler} className="space-y-4 mt-6">
          {!isLogin && (
            <>
            <div>
              <label htmlFor="name" className="block text-md font-medium">
                {t("auth.fullName")}
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 mt-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                placeholder={t("auth.enterName")}
              />
            </div>
              <div>
                <label htmlFor="phone" className="block text-md font-medium">
                  {t("auth.phoneNumber")}
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2 mt-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                  placeholder={t("auth.enterPhone")}
                />
              </div>
            </>
          )}

          <div>
            <label htmlFor="email" className="block text-md font-medium">
              {t("auth.email")}
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 mt-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              placeholder={t("auth.enterEmail")}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-md font-medium">
              {t("auth.password")}
            </label>
            <div className="relative mt-2">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                placeholder={t("auth.enterPassword")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-red-600"
                aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                title={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <Button type="submit" className="button-31 w-full text-lg">
            {isLogin ? t("auth.login") : t("auth.register")}
          </Button>
        </form>
        
        {/* Forgot Password Link - Only show on login */}
        {isLogin && (
          <div className="mt-4 text-center">
            <Link 
              to="/forgot-password" 
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              {t("auth.forgotPassword")}
            </Link>
          </div>
        )}
        
        <div className="mt-4 text-center">
          <p>
            {isLogin ? (
              <>
                {t("auth.noAccount")}{" "}
                <span
                  className="text-red-600 cursor-pointer"
                  onClick={() => setIsLogin(false)}
                >
                  {t("auth.registerHere")}
                </span>
              </>
            ) : (
              <>
                {t("auth.hasAccount")}{" "}
                <span
                  className="text-red-600 cursor-pointer"
                  onClick={() => setIsLogin(true)}
                >
                  {t("auth.loginHere")}
                </span>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
