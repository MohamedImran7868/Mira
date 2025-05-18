import { useState } from "react";
import { useAuth } from "../../AuthContext";
import { Link } from "react-router-dom";
import logo from "../../assets/Logo.png";
import LogoutPopup from "./LogoutPopup";
import { IoLogOut } from "react-icons/io5";
import styles from "./Header.module.css";

function Header() {
  const { signOut, user } = useAuth();
  const [showPopup, setShowPopup] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const logout = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error("Error signing out:", err.message);
    }
  };

  return (
    <>
      <LogoutPopup
        isVisible={showPopup}
        onConfirm={logout}
        onClose={() => setShowPopup(false)}
      />
      <header className={styles.header}>
        <div className={styles.headerContainer}>
          <Link to="/">
            <img src={logo} alt="logo" className={styles.logo} />
          </Link>
          {user && (
            <button
              className={`${styles.logoutBtn} ${
                isHovered ? styles.hovered : ""
              }`}
              onClick={() => setShowPopup(true)}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              aria-label="Logout"
            >
              <IoLogOut className={styles.logoutIcon} />
              <span className={styles.logoutText}>Logout</span>
            </button>
          )}
        </div>
      </header>
    </>
  );
}

export default Header;
