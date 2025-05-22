import { useState } from "react";
import { useAuth } from "../../AuthContext";
import { Link } from "react-router-dom";
import logo from "../../assets/Logo.png";
import LogoutPopup from "./LogoutPopup";
import { IoLogOut, IoNotificationsCircleOutline } from "react-icons/io5";
import { RiPagesFill } from "react-icons/ri";
import styles from "./Header.module.css";

function Header() {
  const { signOut, user } = useAuth();
  const [showPopup, setShowPopup] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showPagesDropdown, setShowPagesDropdown] = useState(false);

  const logout = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error("Error signing out:", err.message);
    }
  };

  // Pages based on role
  const studentPages = [
    { path: "/chat", name: "Chat" },
    { path: "/feedback", name: "Feedback" },
    { path: "/profile", name: "Profile Management" },
  ];

  const adminPages = [
    { path: "/admin-dashboard", name: "Dashboard" },
    { path: "/manage-user", name: "User Management" },
    { path: "/view-feedback", name: "Feedback Management" },
    { path: "/view-resources", name: "Resource Management" },
  ];

  const currentPages = user?.role === "admin" ? adminPages : studentPages;

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
            <div className={styles.iconsContainer}>
              <div className="otherIcon">
                <IoNotificationsCircleOutline className={styles.icon} />
                <div
                  className={styles.pagesWrapper}
                  onMouseEnter={() => setShowPagesDropdown(true)}
                  onMouseLeave={() => setShowPagesDropdown(false)}
                >
                  <RiPagesFill className={styles.icon} />
                  {showPagesDropdown && (
                    <div className={styles.pagesDropdown}>
                      {currentPages.map((page) => (
                        <Link
                          key={page.path}
                          to={page.path}
                          className={styles.dropdownItem}
                          onClick={() => setShowPagesDropdown(false)}
                        >
                          {page.name}
                        </Link>
                      ))}
                      <hr />
                      {/* <Link to={() => setShowPopup(true)} className={styles.dropdownItem}><IoLogOut className={styles.icon} />Log out</Link> */}
                    </div>
                  )}
                </div>
              </div>
              <div className="logOutIcon">
                <button
                  className={`${styles.logoutBtn} ${
                    isHovered ? styles.hovered : ""
                  }`}
                  onClick={() => setShowPopup(true)}
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                  aria-label="Logout"
                >
                  <IoLogOut className={styles.icon} />
                </button>
              </div>
            </div>
          )}
        </div>
      </header>
    </>
  );
}

export default Header;
