// Functions
import { useState } from "react";
import { useAuth } from "../../AuthContext";
import { useNavigate } from "react-router-dom";

// Images
import logo from "../../assets/Logo.png";

// Pages
import LogoutPopup from "./LogoutPopup";


// ICONS
import { IoLogOut } from "react-icons/io5";

function Header() {
  const { signOut, user } = useAuth();
  const [showPopup, setShowPopup] = useState(false); // State for confirm logout popup
  const [isHovered, setIsHovered] = useState(false); // State for hover effect
  const navigate = useNavigate();

  const headerStyle = {
    backgroundColor: "var(--color-navbar)",
    height: "65px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  };

  const logoStyle = {
    width: "150px",
  };

  const logOutStyle = {
    position: "absolute",
    right: "20px",
    display: "flex",
    alignItems: "center",
    border: "none",
    backgroundColor: "transparent",
    cursor: "pointer",
    color: isHovered ? "red" : "inherit", // Change color on hover
    transform: isHovered ? "scale(1.1)" : "scale(1)", // Slight zoom effect
    transition: "all 0.2s ease-in-out", // Smooth transition
  };

  const logout = async () => {
    try {
      await signOut();
      navigate("/chat");
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
      <header style={headerStyle}>
        <img src={logo} alt="logo" style={logoStyle} />
        {user && (
          <button
            style={logOutStyle}
            onClick={() => setShowPopup(true)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <IoLogOut size={30} />
          </button>
        )}
      </header>
    </>
  );
}

export default Header;
