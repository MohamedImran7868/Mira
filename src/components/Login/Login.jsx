import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../Common/Header";
import styles from "./Login.module.css";
import { useAuth } from "../../AuthContext";
import { FaEnvelope, FaLock, FaArrowLeft, FaPaperPlane } from "react-icons/fa";
import LoadingModal from "../Common/LoadingModal";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { signIn, resetPassword, resendVerification } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setShowResendVerification(false);

    try {
      const { data, profile, error: authError } = await signIn(email, password);

      if (authError) {
        if (authError.needsVerification) {
          setError(authError.message);
          setShowResendVerification(true);
        } else {
          setError(authError.message);
        }
        return;
      }

      // Redirect based on role
      if (profile?.role === "admin" && profile?.isProfile_set === "set") {
        navigate("/admin-dashboard");
      } else if (profile?.role === "admin" && profile?.isProfile_set === "not set") {
        navigate("/complete-profile");
      } else {
        navigate("/chat");
      }
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
    return (
      <LoadingModal
        message={showResetForm ? "Processing..." : "Logging In..."}
      />
    );
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
                <div
                  className={
                    resetMessage.includes("sent")
                      ? styles.successMessage
                      : styles.errorMessage
                  }
                >
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
                  <div className={styles.passwordWrapper}>
                  <input
                    type={showPassword? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className={styles.inputField}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className={styles.passwordToggle}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                  </div>
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
