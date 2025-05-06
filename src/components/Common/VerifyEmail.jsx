import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase';
import LoadingModal from './LoadingModal';
import styles from './VerifyEmail.module.css';

const VerifyEmail = () => {
  const [message, setMessage] = useState('Checking email verification status...');
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(5);
  const navigate = useNavigate();

  useEffect(() => {
    const checkVerification = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) throw error;
        
        if (user?.email_confirmed_at) {
          setMessage('Email verified! Redirecting to chat...');
          // Start countdown to redirect
          const timer = setInterval(() => {
            setCountdown(prev => {
              if (prev <= 1) {
                clearInterval(timer);
                navigate('/chat');
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        } else {
          setMessage('Please check your email for the verification link. Once verified, you can log in.');
          setLoading(false);
        }
      } catch (error) {
        setMessage(`Error: ${error.message}`);
        setLoading(false);
      }
    };

    checkVerification();
  }, [navigate]);

  const resendVerification = async () => {
    setLoading(true);
    setMessage('Sending new verification email...');
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: (await supabase.auth.getUser()).data.user?.email,
      });
      
      if (error) throw error;
      setMessage('New verification email sent! Please check your inbox.');
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2>Verify Your Email</h2>
        <p className={styles.message}>{message}</p>
        
        {!loading && message.includes('check your email') && (
          <div className={styles.actions}>
            <button 
              onClick={resendVerification}
              className={styles.resendButton}
            >
              Resend Verification Email
            </button>
            <button 
              onClick={() => navigate('/login')}
              className={styles.loginButton}
            >
              Back to Login
            </button>
          </div>
        )}
        
        {countdown > 0 && message.includes('Redirecting') && (
          <p className={styles.countdown}>Redirecting in {countdown} seconds...</p>
        )}
      </div>
      
      {loading && <LoadingModal message={message} />}
    </div>
  );
};

export default VerifyEmail;