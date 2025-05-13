import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../Common/Header";
import styles from "./Login.module.css";
import { useAuth } from "../../AuthContext";
import googleImage from "../../assets/google.png";

import LoadingModal from "../Common/LoadingModal";

const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [resetEmail, setResetEmail] = useState("");
  const [loading, setLoading] = useState(false);

  // Sent Reset Password
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetMessage, setResetMessage] = useState("");

  // Resend verification
  const [showResendVerification, setShowResendVerification] = useState(false);

  const { signIn, signInWithGoogle, resetPassword, resendVerification } =
    useAuth();
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

  if (loading){
    return <LoadingModal message="Logging In..." />;
  }

  return (
    <>
      <Header />
      <div className={styles.container}>
        <div className={styles.formContainer}>
          {showResetForm ? (
            <div className={styles.resetForm}>
              <h3>Reset Password</h3>
              <input
                type="email"
                placeholder="Enter your email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
                disabled={loading}
              />
              <button onClick={handlePasswordReset} disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
              <button
                onClick={() => setShowResetForm(false)}
                disabled={loading}
              >
                Back to Login
              </button>
              {resetMessage && (
                <p className={styles.resetMessage}>{resetMessage}</p>
              )}
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className={styles.form}>
                <h2>Enter Your Information</h2>
                <input
                  type="email"
                  placeholder="Email"
                  name="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="true"
                />
                <input
                  type="password"
                  placeholder="Password"
                  name="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                {error && (
                  <div className={styles.errorMessage}>
                    {error}
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
                <button type="submit" disabled={loading}>
                  {loading ? "Logging in..." : "Login"}
                </button>
              </form>
              <p
                className={styles.forgotPassword}
                onClick={() => !loading && setShowResetForm(true)}
              >
                Forgot password?
              </p>
              <p className={styles.or}>or</p>
              <button
                onClick={handleGoogleLogin}
                className={styles.googlebtn}
                disabled={loading}
              >
                <img src={googleImage} alt="google img" />
                Sign In With Google
              </button>
              <p className={styles.register}>
                Don't have an account?{" "}
                <span onClick={() => !loading && navigate("/register")}>
                  Register
                </span>
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default LoginScreen;
