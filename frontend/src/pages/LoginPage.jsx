import React, { useEffect, useState } from "react";
import { Apple, Github, Chrome, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatedThemeToggler } from "../components/common/AnimatedThemeToggler";
import { Ripple } from "../components/common/Ripple";
import { loginUser, registerUser } from "../services/AuthService";

const AUTH_STORAGE_KEY = "mapplify_auth_user";
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function preloadGoogleMapsSdk() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.resolve();
  }

  const apiKey = String(import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "").trim();
  if (!apiKey) {
    return Promise.resolve();
  }

  if (window.google?.maps) {
    return Promise.resolve();
  }

  const existingScript = document.querySelector('script[data-mapplify-google-maps="true"]');
  if (existingScript) {
    return new Promise((resolve) => {
      if (existingScript.getAttribute("data-loaded") === "true") {
        resolve();
        return;
      }

      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => resolve(), { once: true });
    });
  }

  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places,marker`;
    script.async = true;
    script.defer = true;
    script.dataset.mapplifyGoogleMaps = "true";
    script.addEventListener("load", () => {
      script.setAttribute("data-loaded", "true");
      resolve();
    }, { once: true });
    script.addEventListener("error", () => resolve(), { once: true });
    document.head.appendChild(script);
  });
}

function buildStoredAuthProfile(response, authMode, fullName, email) {
  const responseUser = response?.user && typeof response.user === "object"
    ? response.user
    : (response && typeof response === "object" ? response : {});

  const resolvedName = String(
    responseUser?.name ||
      responseUser?.fullName ||
      responseUser?.username ||
      fullName ||
      ""
  ).trim();

  return {
    isAuthenticated: true,
    loggedInAt: Date.now(),
    source: authMode,
    token: response?.token || null,
    id: responseUser?.id !== undefined && responseUser?.id !== null ? String(responseUser.id) : "",
    name: resolvedName,
    email: String(responseUser?.email || email || "").trim(),
    phoneNumber: String(responseUser?.phoneNumber || responseUser?.phone || "").trim(),
    fullName: String(fullName || "").trim(),
    identifier: String(email || "").trim(),
    user: responseUser,
  };
}

function toFriendlyAuthError(error, authMode) {
  const status = error?.status;
  const message = error?.message || "";
  const rawMessage = message.toLowerCase();

  if (message) {
    if (rawMessage.includes("internal server error")) {
      return "Server error. Please try again in a moment.";
    }
    return message;
  }

  if (authMode === "login") {
    if (status === 404) return "Email is not registered.";
    if (status === 403) return "Your account is not allowed to sign in.";
  }

  if (authMode === "signup") {
    if (status === 409) return "This email is already registered.";
    if (status === 400) return "Invalid sign up details. Please check your information.";
  }

  if (status >= 500) {
    return "Server error. Please try again in a moment.";
  }

  return error?.message || "Authentication failed. Please try again.";
}

function validateAuthFields({ authMode, fullName, identifier, passcode, confirmPasscode, phoneNumber }) {
  const nextErrors = {};

  if (authMode === "signup") {
    if (!fullName.trim()) {
      nextErrors.fullName = "Full name is required.";
    }
    if (!phoneNumber?.trim()) {
      nextErrors.phoneNumber = "Phone number is required.";
    }
  }

  if (!identifier.trim()) {
    nextErrors.identifier = "Email is required.";
  } else if (!emailPattern.test(identifier.trim())) {
    nextErrors.identifier = "Enter a valid email address.";
  }

  if (!passcode) {
    nextErrors.passcode = "Passcode is required.";
  } else if (authMode === "signup") {
    const hasLetter = /[A-Za-z]/.test(passcode);
    const hasNumber = /\d/.test(passcode);

    if (passcode.length < 8 || !hasLetter || !hasNumber) {
      nextErrors.passcode = "Use at least 8 characters with letters and numbers.";
    }
  }

  if (authMode === "signup") {
    if (!confirmPasscode) {
      nextErrors.confirmPasscode = "Please confirm your passcode.";
    } else if (confirmPasscode !== passcode) {
      nextErrors.confirmPasscode = "Passcodes do not match.";
    }
  }

  return nextErrors;
}

const LoginPage = () => {
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState("login");
  const [fullName, setFullName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [passcode, setPasscode] = useState("");
  const [confirmPasscode, setConfirmPasscode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPostAuthLoading, setIsPostAuthLoading] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(
    document.documentElement.classList.contains("dark"),
  );

  useEffect(() => {
    const applyThemeState = () => {
      setIsDarkTheme(document.documentElement.classList.contains("dark"));
    };

    applyThemeState();

    const observer = new MutationObserver(applyThemeState);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isPostAuthLoading) {
      return undefined;
    }

    let cancelled = false;
    const waitForLoadingScreen = new Promise((resolve) => {
      window.setTimeout(resolve, 2000);
    });
    const preloadMapsSdk = preloadGoogleMapsSdk();

    Promise.all([waitForLoadingScreen, preloadMapsSdk]).then(() => {
      if (!cancelled) {
        navigate("/map");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isPostAuthLoading, navigate]);

  const handleModeSwitch = (mode) => {
    setAuthMode(mode);
    setErrors({});
    setApiError("");
    if (mode === "login") {
      setConfirmPasscode("");
      setPhoneNumber("");
    }
  };

  const handleAuthSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = validateAuthFields({
      authMode,
      fullName,
      identifier,
      passcode,
      confirmPasscode,
      phoneNumber,
    });

    setErrors(nextErrors);
    setApiError("");
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      setIsSubmitting(true);

      const email = identifier.trim();
      let response;

      if (authMode === "signup") {
        response = await registerUser({
          name: fullName.trim(),
          phoneNumber: phoneNumber.trim(),
          email,
          password: passcode,
        });
      } else {
        response = await loginUser({
          email,
          password: passcode,
        });
      }

      const authPayload = buildStoredAuthProfile(response, authMode, fullName.trim(), email);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authPayload));
      
      if (authMode === "signup") {
        localStorage.setItem("mapplify_show_tour", "true");
      }
      
      setIsPostAuthLoading(true);
    } catch (error) {
      setApiError(toFriendlyAuthError(error, authMode));
    } finally {
      setIsSubmitting(false);
    }
  };

  const onIdentifierChange = (event) => {
    setIdentifier(event.target.value);
    if (apiError) setApiError("");
    if (errors.identifier) {
      setErrors((prev) => ({ ...prev, identifier: undefined }));
    }
  };

  const onFullNameChange = (event) => {
    setFullName(event.target.value);
    if (apiError) setApiError("");
    if (errors.fullName) {
      setErrors((prev) => ({ ...prev, fullName: undefined }));
    }
  };

  const onPhoneNumberChange = (event) => {
    setPhoneNumber(event.target.value);
    if (apiError) setApiError("");
    if (errors.phoneNumber) {
      setErrors((prev) => ({ ...prev, phoneNumber: undefined }));
    }
  };

  const onPasscodeChange = (event) => {
    setPasscode(event.target.value);
    if (apiError) setApiError("");
    if (errors.passcode || errors.confirmPasscode) {
      setErrors((prev) => ({
        ...prev,
        passcode: undefined,
        confirmPasscode: authMode === "signup" ? prev.confirmPasscode : undefined,
      }));
    }
  };

  const onConfirmPasscodeChange = (event) => {
    setConfirmPasscode(event.target.value);
    if (apiError) setApiError("");
    if (errors.confirmPasscode) {
      setErrors((prev) => ({ ...prev, confirmPasscode: undefined }));
    }
  };

  const isSubmitDisabled =
    isSubmitting ||
    !identifier.trim() ||
    !passcode ||
    (authMode === "signup" && (!fullName.trim() || !phoneNumber.trim() || !confirmPasscode));

  const topTextClass = isDarkTheme ? "text-white" : "text-black";
  const cardTextClass = isDarkTheme ? "text-white" : "text-black";
  const cardSurfaceClass = "border-white/40 bg-white/20";
  const socialButtonClass =
    "flex h-12 flex-1 items-center justify-center rounded-2xl border border-white/40 bg-white/20 transition-all hover:scale-[1.02] hover:bg-white/30 active:scale-[0.98] sm:h-14";
  const socialIconClass = isDarkTheme ? "text-white" : "text-black";
  const inputClass = isDarkTheme
    ? "h-12 w-full rounded-2xl border border-white/40 bg-white/30 px-4 text-sm text-white transition-all placeholder:text-white/70 focus:outline-none focus:ring-1 focus:ring-blue-500/30 sm:h-14 sm:px-6"
    : "h-12 w-full rounded-2xl border border-white/40 bg-white/30 px-4 text-sm text-black transition-all placeholder:text-black/65 focus:outline-none focus:ring-1 focus:ring-blue-500/30 sm:h-14 sm:px-6";
  const helperTextClass = isDarkTheme ? "text-white" : "text-black";
  const helperLinkClass = isDarkTheme
    ? "underline underline-offset-2 text-white transition-colors hover:text-white"
    : "underline underline-offset-2 text-black transition-colors hover:text-black";

  if (isPostAuthLoading) {
    return (
      <div
        className="relative isolate flex min-h-screen w-full items-center justify-center overflow-hidden bg-(--page-bg) px-4 py-6 text-(--page-fg)"
        style={{
          "--spinner-bar-color": isDarkTheme ? "#f8fafc" : "#0f172a",
          "--spinner-shadow-color": isDarkTheme ? "rgba(15,23,42,0.65)" : "rgba(15,23,42,0.32)",
        }}
      >
        <Ripple className="z-0 opacity-80" mainCircleSize={210} mainCircleOpacity={0.24} numCircles={8} />

        <div className="relative z-10 flex flex-col items-center gap-6 rounded-4xl border border-white/40 bg-white/20 px-10 py-9 text-center backdrop-blur-xl shadow-[0_20px_80px_rgba(15,23,42,0.18)] sm:rounded-[45px]">
          <div className="spinner-theme" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
          <p className={`text-sm font-semibold tracking-[0.18em] ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
            LOADING MAPPLIFY
          </p>
        </div>

        <style>{`
          .spinner-theme {
            position: relative;
            width: 60px;
            height: 60px;
            display: flex;
            justify-content: center;
            align-items: center;
            border-radius: 50%;
            margin-left: -75px;
          }

          .spinner-theme span {
            position: absolute;
            top: 50%;
            left: var(--left);
            width: 35px;
            height: 7px;
            background: var(--spinner-bar-color);
            animation: dominos 1s ease infinite;
            box-shadow: 2px 2px 3px 0px var(--spinner-shadow-color);
          }

          .spinner-theme span:nth-child(1) {
            --left: 80px;
            animation-delay: 0.125s;
          }

          .spinner-theme span:nth-child(2) {
            --left: 70px;
            animation-delay: 0.3s;
          }

          .spinner-theme span:nth-child(3) {
            left: 60px;
            animation-delay: 0.425s;
          }

          .spinner-theme span:nth-child(4) {
            animation-delay: 0.54s;
            left: 50px;
          }

          .spinner-theme span:nth-child(5) {
            animation-delay: 0.665s;
            left: 40px;
          }

          .spinner-theme span:nth-child(6) {
            animation-delay: 0.79s;
            left: 30px;
          }

          .spinner-theme span:nth-child(7) {
            animation-delay: 0.915s;
            left: 20px;
          }

          .spinner-theme span:nth-child(8) {
            left: 10px;
          }

          @keyframes dominos {
            50% {
              opacity: 0.7;
            }

            75% {
              transform: rotate(90deg);
            }

            80% {
              opacity: 1;
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="relative isolate flex min-h-screen w-full items-center justify-center overflow-hidden bg-(--page-bg) px-4 py-6 text-(--page-fg) font-sans sm:px-6 sm:py-8">
      <Ripple className="z-0 opacity-80" mainCircleSize={210} mainCircleOpacity={0.24} numCircles={8} />

      <div className={`absolute right-4 top-4 z-60 flex items-center gap-4 text-[10px] tracking-widest sm:right-8 sm:top-8 ${topTextClass}`}>
        <AnimatedThemeToggler />
      </div>

      <div className={`relative z-20 w-full max-w-[440px] overflow-hidden rounded-4xl border p-6 backdrop-blur-xl shadow-[0_20px_80px_rgba(15,23,42,0.18)] sm:rounded-[45px] sm:p-10 ${cardSurfaceClass} ${cardTextClass}`}>
        <div className="pointer-events-none absolute inset-0 rounded-4xl bg-linear-to-br from-white/70 via-white/35 to-transparent dark:from-white/45 dark:via-white/20 sm:rounded-[45px]" />

        <div className="relative z-10 space-y-5 sm:space-y-7">
          <div className="space-y-2">
            <h1 className={`text-3xl font-semibold tracking-tight sm:text-4xl ${helperTextClass}`}>
              {authMode === "login" ? "Login" : "Create Account"}
            </h1>
          </div>

          <div className="flex gap-3">
            {[Apple, Chrome, Github].map((Icon, idx) => (
              <button key={idx} className={socialButtonClass}>
                <Icon size={20} className={socialIconClass} />
              </button>
            ))}
          </div>

          <form className="space-y-4" onSubmit={handleAuthSubmit} noValidate>
            {authMode === "signup" && (
              <div className="space-y-2">
                <input
                  value={fullName}
                  onChange={onFullNameChange}
                  type="text"
                  autoComplete="name"
                  placeholder="Full Name"
                  className={inputClass}
                />
                {errors.fullName && (
                  <p className="text-xs font-medium text-rose-700">{errors.fullName}</p>
                )}
              </div>
            )}

            {authMode === "signup" && (
              <div className="space-y-2">
                <input
                  value={phoneNumber}
                  onChange={onPhoneNumberChange}
                  type="tel"
                  autoComplete="tel"
                  placeholder="Phone Number"
                  className={inputClass}
                />
                {errors.phoneNumber && (
                  <p className="text-xs font-medium text-rose-700">{errors.phoneNumber}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <input
                value={identifier}
                onChange={onIdentifierChange}
                type="email"
                autoComplete="email"
                placeholder="Email@gmail.com"
                className={inputClass}
              />
              {errors.identifier && (
                <p className="text-xs font-medium text-rose-700">{errors.identifier}</p>
              )}
            </div>

            <div className="space-y-2">
              <input
                value={passcode}
                onChange={onPasscodeChange}
                type="password"
                autoComplete={authMode === "signup" ? "new-password" : "current-password"}
                placeholder="Passcode"
                className={inputClass}
              />
              {errors.passcode && (
                <p className="text-xs font-medium text-rose-700">{errors.passcode}</p>
              )}
            </div>

            {authMode === "signup" && (
              <div className="space-y-2">
                <input
                  value={confirmPasscode}
                  onChange={onConfirmPasscodeChange}
                  type="password"
                  autoComplete="new-password"
                  placeholder="Confirm Passcode"
                  className={inputClass}
                />
                {errors.confirmPasscode && (
                  <p className="text-xs font-medium text-rose-700">{errors.confirmPasscode}</p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitDisabled}
              className="group mt-2 flex h-12 w-full items-center justify-center gap-3 rounded-full bg-(--button-bg) text-sm font-bold text-(--button-fg) shadow-[0_0_20px_rgba(0,0,0,0.12)] transition-all hover:bg-(--button-hover-bg) disabled:cursor-not-allowed disabled:bg-slate-400 disabled:text-white/95 disabled:opacity-90 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800 dark:disabled:bg-slate-700 dark:disabled:text-white/80 sm:mt-4 sm:h-14 sm:text-base"
            >
              {isSubmitting ? "PLEASE WAIT" : authMode === "login" ? "LOGIN" : "SIGN UP"}{" "}
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>

            {apiError && (
              <p className="text-center text-xs font-medium text-rose-700">{apiError}</p>
            )}

            <div className={`text-center text-xs ${helperTextClass}`}>
              {authMode === "login" ? "New user?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => handleModeSwitch(authMode === "login" ? "signup" : "login")}
                className={`font-semibold ${helperLinkClass}`}
              >
                {authMode === "login" ? "Sign up" : "Login"}
              </button>
            </div>
          </form>

          <div className={`pt-1 text-center text-xs ${helperTextClass}`}>
            Learn more about Mapplify on the{" "}
            <Link to="/about" className={helperLinkClass}>
              About page
            </Link>
            .
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
