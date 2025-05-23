import { useState } from "react";
import { useAuth } from "../../AuthContext";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../assets/Logo.png";
import LogoutPopup from "./LogoutPopup";
import { 
  IoLogOut, 
  IoNotificationsOutline,
  IoChevronDown,
  IoChevronUp
} from "react-icons/io5";
import { RiPagesLine } from "react-icons/ri";
import styles from "./Header.module.css";

function Header() {
  const { signOut, user } = useAuth();
  const [showPopup, setShowPopup] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showPagesDropdown, setShowPagesDropdown] = useState(false);
  const navigate = useNavigate();

  const logout = async () => {
    try {
      await signOut();
      setShowPopup(false);
      navigate("/");
    } catch (err) {
      console.error("Error signing out:", err.message);
    }
  };

  // Pages based on role
  const studentPages = [
    { path: "/student-dashboard", name: "Dashboard", icon: "📊" },
    { path: "/chat", name: "Chat", icon: "💬" },
    { path: "/feedback", name: "Feedback", icon: "📝" },
    { path: "/view-resources", name: "Resources", icon: "📚" },
    { path: "/profile", name: "Profile", icon: "👤" },
  ];

  const adminPages = [
    { path: "/admin-dashboard", name: "Dashboard", icon: "📊" },
    { path: "/manage-user", name: "Users", icon: "👥" },
    { path: "/view-feedback", name: "Feedback", icon: "📝" },
    { path: "/view-resources", name: "Resources", icon: "📚" },
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
          <Link to="/" className={styles.logoLink}>
            <img src={logo} alt="MIRA Logo" className={styles.logo} />
            {/* <span className={styles.logoText}>MIRA</span> */}
          </Link>
          
          {user && (
            <div className={styles.navContainer}>
              <nav className={styles.mainNav}>
                {currentPages.map((page) => (
                  <Link 
                    key={page.path} 
                    to={page.path}
                    className={styles.navLink}
                  >
                    {page.name}
                  </Link>
                ))}
              </nav>

              <div className={styles.actionsContainer}>
                {/* <button className={styles.notificationBtn}>
                  <IoNotificationsOutline className={styles.actionIcon} />
                  <span className={styles.notificationBadge}>3</span>
                </button> */}

                <div 
                  className={styles.pagesDropdownContainer}
                  onMouseEnter={() => setShowPagesDropdown(true)}
                  onMouseLeave={() => setShowPagesDropdown(false)}
                >
                  <button 
                    className={styles.pagesToggle}
                    onClick={() => setShowPagesDropdown(!showPagesDropdown)}
                  >
                    <RiPagesLine className={styles.actionIcon} />
                    <span>Menu</span>
                    {showPagesDropdown ? (
                      <IoChevronUp className={styles.chevronIcon} />
                    ) : (
                      <IoChevronDown className={styles.chevronIcon} />
                    )}
                  </button>

                  {showPagesDropdown && (
                    <div className={styles.pagesDropdown}>
                      {currentPages.map((page) => (
                        <Link
                          key={page.path}
                          to={page.path}
                          className={styles.dropdownItem}
                          onClick={() => setShowPagesDropdown(false)}
                        >
                          <span className={styles.itemIcon}>{page.icon}</span>
                          {page.name}
                        </Link>
                      ))}
                      <div className={styles.dropdownDivider}></div>
                      <button 
                        className={styles.dropdownItem} 
                        onClick={() => {
                          setShowPagesDropdown(false);
                          setShowPopup(true);
                        }}
                      >
                        <IoLogOut className={styles.itemIcon} />
                        Log Out
                      </button>
                    </div>
                  )}
                </div>

                <button
                  className={`${styles.logoutBtn} ${
                    isHovered ? styles.hovered : ""
                  }`}
                  onClick={() => setShowPopup(true)}
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                  aria-label="Logout"
                >
                  <IoLogOut className={styles.actionIcon} />
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