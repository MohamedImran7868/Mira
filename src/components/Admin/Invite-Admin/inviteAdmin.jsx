import { useState } from "react";
import { useAuth } from "../../../AuthContext";
import { useNavigate } from "react-router-dom";
import Header from "../../Common/Header";
import styles from "./inviteAdmin.module.css";

const InviteAdmin = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState({ text: "", isError: false });
  const [isLoading, setIsLoading] = useState(false);
  const { inviteAdmin } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: "", isError: false });

    if (!email) {
      setMessage({ text: "Please enter an email", isError: true });
      setIsLoading(false);
      return;
    }

    const { error } = await inviteAdmin(email);

    if (error) {
      setMessage({
        text: "An invitaion has already been sent to this email. Please inform the owner to check their email.",
        isError: true,
      });
    } else {
      setMessage({
        text: "Admin invited successfully! An invitation has been sent to the email.",
        isError: false,
      });
      setEmail("");
    }

    setIsLoading(false);
  };

  return (
    <>
      <Header />
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h2>Invite New Admin</h2>
            <p className={styles.subtitle}>
              Enter the email address of the person you want to invite as an
              admin
            </p>
          </div>

          {message.text && (
            <div
              className={`${styles.message} ${
                message.isError ? styles.error : styles.success
              }`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                className={styles.input}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={styles.button}
            >
              {isLoading ? (
                <>
                  <span className={styles.spinner}></span>
                  Sending Invite...
                </>
              ) : (
                "Send Admin Invite"
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default InviteAdmin;
