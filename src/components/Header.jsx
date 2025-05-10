import logo from "../assets/Logo.png";
import { useAuth } from "../AuthContext";
import { useNavigate } from "react-router-dom";

function Header() {
  const { signOut } = useAuth();
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
    <header style={headerStyle}>
      <img src={logo} alt="logo" style={logoStyle} />
      <button style={logOutStyle} onClick={logout}>
        Log Out
      </button>
    </header>
  );
}

export default Header;
