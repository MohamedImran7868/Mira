import { useNavigate, Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { Sidebar, Menu, MenuItem, sidebarClasses } from "react-pro-sidebar";
import { useAuth } from "../../../AuthContext";

// Pages
import styles from "./Chat.module.css";
import LogoutPopup from "../../Common/LogoutPopup";

// Images
import logo from "../../../assets/Logo.png";
import logoOnly from "../../../assets/LogoOnly.png";
import profilepic from "../../../assets/imran.jpg";

// ICONS
import { IoSettings } from "react-icons/io5";
import { RiFeedbackFill } from "react-icons/ri";
import { IoLogOut } from "react-icons/io5";
import { FiMenu, FiX, FiSend } from "react-icons/fi";

const ChatScreen = () => {
  const { signOut, getImageUrl } = useAuth();
  const [message, setMessage] = useState("");
  const [messageBegin, setMessageBegin] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const chatContainerRef = useRef(null);
  const typingIntervalRef = useRef(null);
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const logout = async () => {
    try {
      await signOut();
      navigate("/chat");
    } catch (err) {
      console.error("Error signing out:", err.message);
    }
  };

  useEffect(() => {
    // Clean up interval on unmount
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, []);

  const sendMessage = () => {
    if (!message.trim() || isTyping) return;

    setMessageBegin(true);

    if (chatContainerRef.current) {
      chatContainerRef.current.style.justifyContent = "flex-start";
    }

    createBubble(message, "human");
    callModel(message);
    setMessage("");
  };

  const callModel = async (input) => {
    setIsTyping(true);
    try {
      const response = await fetch("http://127.0.0.1:5000/model", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      simulateTypingEffect(data.result);
    } catch (error) {
      console.error("Error calling model:", error);
      simulateTypingEffect(
        "Sorry, I'm having trouble connecting to the AI service."
      );
    }
  };

  const simulateTypingEffect = (text) => {
    const chatContainer = chatContainerRef.current;
    if (!chatContainer) return;

    // Create typing indicator
    const typingIndicator = document.createElement("div");
    typingIndicator.className = `${styles.botMessage} ${styles.bubble}`;
    typingIndicator.id = "typing-indicator";
    typingIndicator.innerHTML = `
      <span class="${styles.typingIndicator}"></span>
      <span class="${styles.typingIndicator}"></span>
      <span class="${styles.typingIndicator}"></span>
    `;

    chatContainer.appendChild(typingIndicator);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    // Create the actual message element but keep it hidden initially
    const messageDiv = document.createElement("div");
    messageDiv.className = `${styles.botMessage} ${styles.bubble}`;
    messageDiv.style.display = "none";
    chatContainer.appendChild(messageDiv);

    let i = 0;
    const words = text.split(" ");

    // Clear any existing interval
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }

    typingIntervalRef.current = setInterval(() => {
      if (i < words.length) {
        messageDiv.innerHTML =
          words.slice(0, i + 1).join(" ") + (i < words.length - 1 ? "..." : "");

        // Show the message div and hide typing indicator when we start typing
        if (i === 0) {
          typingIndicator.style.display = "none";
          messageDiv.style.display = "block";
        }

        chatContainer.scrollTop = chatContainer.scrollHeight;
        i++;
      } else {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;

        // Remove the typing indicator if it's still there
        if (chatContainer.contains(typingIndicator)) {
          chatContainer.removeChild(typingIndicator);
        }

        setIsTyping(false);
      }
    }, 100);
  };

  const createBubble = (message, role) => {
    const chatContainer = chatContainerRef.current;
    if (!chatContainer) return;

    const messageDiv = document.createElement("div");
    messageDiv.className = `${
      role === "human" ? styles.humanMessage : styles.botMessage
    } ${styles.bubble}`;

    const paragraphs = message
      .split("\n")
      .map((paragraph, i) =>
        paragraph ? `<p key=${i}>${paragraph}</p>` : "<br/>"
      )
      .join("");

    messageDiv.innerHTML = paragraphs;
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    // Auto-focus input when not typing
    if (!isTyping) {
      const input = document.querySelector(`.${styles.input}`);
      if (input) input.focus();
    }
  }, [isTyping]);

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Show popup if needed */}
      <LogoutPopup
        isVisible={showPopup}
        onConfirm={logout}
        onClose={() => setShowPopup(false)}
      />
      {/* Sidebar Overlay for mobile */}
      {!isSidebarOpen && (
        <div
          className={`${styles.sidebarOverlay} ${
            isSidebarOpen ? "active" : ""
          }`}
          onClick={toggleSidebar}
        />
      )}

      <Sidebar
        collapsed={!isSidebarOpen}
        toggled={isSidebarOpen}
        onToggle={toggleSidebar}
        breakPoint="md"
        className={styles.sidebar}
        style={{ height: "100vh" }}
        rootStyles={{
          [`.${sidebarClasses.container}`]: {
            backgroundColor: "var(--color-navbar)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          },
        }}
      >
        <div className={styles.logoContainer}>
          {isSidebarOpen ? (
            <img src={logo} alt="mira logo" className={styles.logo} />
          ) : (
            <img src={logoOnly} alt="mira logo" className={styles.logoOnly} />
          )}
        </div>
        <div>
          <Menu iconShape="circle" className={styles.menu}>
            <MenuItem
              icon={<RiFeedbackFill size={24} />}
              onClick={() => navigate("/feedback")}
              className={styles.menuItem}
            >
              Feedback
            </MenuItem>
            <MenuItem
              icon={<IoSettings size={24} />}
              onClick={() => navigate("/profile")}
              className={styles.menuItem}
            >
              Settings
            </MenuItem>
            <MenuItem
              icon={<IoLogOut size={24} />}
              onClick={() => setShowPopup(true)}
              className={styles.menuItem}
            >
              Logout
            </MenuItem>
          </Menu>
        </div>
      </Sidebar>

      <div
        className={`${styles.container} ${
          !isSidebarOpen ? styles.collapsed : ""
        }`}
      >
        <button className={styles.menuToggle} onClick={toggleSidebar}>
          {isSidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>

        <div className={styles.topContainer}>
          <Link to="/profile" className={styles.profileLink}>
            <img
              src={profilepic}
              alt="user profile picture"
              className={styles.profilePic}
            />
          </Link>
        </div>

        <div
          id="chatContainer"
          className={styles.chatContainer}
          ref={chatContainerRef}
        >
          {!messageBegin && (
            <h1 className={styles.containerPlaceHolder}>
              Hi Bestie!
              <br />
              How was your day?
            </h1>
          )}
        </div>

        <div className={styles.chatInput}>
          <input
            type="text"
            id="input"
            name="input"
            value={message}
            className={styles.input}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Share your thoughts here..."
            disabled={isTyping}
          />
          <button
            className={styles.sendBtn}
            onClick={sendMessage}
            disabled={!message.trim() || isTyping}
          >
            {isTyping ? <div className={styles.loader}></div> : <FiSend className={styles.sendIcon} size={24}/>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatScreen;
