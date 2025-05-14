import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../Common/Header";
import styles from "./Login.module.css";
import { useAuth } from "../../AuthContext";
import { FaGoogle, FaEnvelope, FaLock, FaArrowLeft, FaPaperPlane } from "react-icons/fa";
import LoadingModal from "../Common/LoadingModal";

const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [resetEmail, setResetEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const [showResendVerification, setShowResendVerification] = useState(false);

  const { signIn, signInWithGoogle, resetPassword, resendVerification } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/chat";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setShowResendVerification(false);

    try {
      const { data, error: authError } = await signIn(email, password);
      if (authError) {
        if (authError.needsVerification) {
          setError(authError.message);
          setShowResendVerification(true);
        } else {
          setError(authError.message);
        }
        return;
      }
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      const { success, error } = await resendVerification(email);
      setShowResendVerification(false);
    } catch (err) {
      console.error("Resend failed:", err);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!resetEmail) {
      setResetMessage("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(resetEmail);
      setResetMessage("Password reset link sent to your email!");
    } catch (err) {
      setResetMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingModal message="Logging In..." />;
  }

  return (
    <>
      <Header />
      <div className={styles.container}>
        <div className={styles.card}>
          {showResetForm ? (
            <div className={styles.resetContainer}>
              <button 
                onClick={() => setShowResetForm(false)}
                className={styles.backButton}
              >
                <FaArrowLeft /> Back to Login
              </button>
              
              <div className={styles.resetHeader}>
                <h2>Reset Password</h2>
                <p>Enter your email to receive a reset link</p>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                  <FaEnvelope className={styles.inputIcon} />
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  disabled={loading}
                  className={styles.inputField}
                />
              </div>

              <button 
                onClick={handlePasswordReset} 
                disabled={loading}
                className={styles.resetButton}
              >
                <FaPaperPlane className={styles.buttonIcon} />
                {loading ? "Sending..." : "Send Reset Link"}
              </button>

              {resetMessage && (
                <div className={resetMessage.includes("sent") ? styles.successMessage : styles.errorMessage}>
                  {resetMessage}
                </div>
              )}
            </div>
          ) : (
            <>
              <div className={styles.loginHeader}>
                <h2>Welcome Back</h2>
                <p>Sign in to continue to your account</p>
              </div>

              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>
                    <FaEnvelope className={styles.inputIcon} />
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className={styles.inputField}
                    autoComplete="email"
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>
                    <FaLock className={styles.inputIcon} />
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className={styles.inputField}
                    autoComplete="current-password"
                  />
                </div>

                <button 
                  type="button"
                  onClick={() => setShowResetForm(true)}
                  className={styles.forgotPassword}
                >
                  Forgot password?
                </button>

                {error && (
                  <div className={styles.errorMessage}>
                    <div>{error}</div>
                    {showResendVerification && (
                      <button
                        type="button"
                        onClick={handleResendVerification}
                        className={styles.resendButton}
                      >
                        Resend Verification Email
                      </button>
                    )}
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={loading}
                  className={styles.loginButton}
                >
                  {loading ? "Signing In..." : "Sign In"}
                </button>
              </form>

              <div className={styles.divider}>
                <span>or continue with</span>
              </div>

              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className={styles.googleButton}
              >
                <FaGoogle className={styles.googleIcon} />
                Sign in with Google
              </button>

              <div className={styles.registerPrompt}>
                Don't have an account?{" "}
                <button 
                  onClick={() => !loading && navigate("/register")}
                  className={styles.registerLink}
                >
                  Create account
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default LoginScreen;