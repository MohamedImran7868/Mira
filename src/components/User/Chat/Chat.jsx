import { useNavigate, Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import {
  Sidebar,
  Menu,
  MenuItem,
  SubMenu,
  sidebarClasses,
  menuClasses,
} from "react-pro-sidebar";
import { useAuth } from "../../../AuthContext";

// Pages
import styles from "./Chat.module.css";
import LogoutPopup from "../../Common/LogoutPopup";
import { containsProfanity } from "../../Common/filter";

// Images
import logo from "../../../assets/Logo.png";
import logoOnly from "../../../assets/LogoOnly.png";

// ICONS
import { IoSettings, IoChatbubbles } from "react-icons/io5";
import { RiFeedbackFill, RiChatAiFill } from "react-icons/ri";
import { IoLogOut } from "react-icons/io5";
import { FiMenu, FiX, FiSend, FiTrash2, FiEdit } from "react-icons/fi";
import { FaHandHoldingHeart } from "react-icons/fa";

const ChatScreen = () => {
  const {
    userProfile,
    getImageUrl,
    signOut,
    getChatSessions,
    getChatMessages,
    createChatSession,
    saveMessage,
    updateChatName,
    deleteChatSession,
    endChatSession,
  } = useAuth();

  const [message, setMessage] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [chatSessions, setChatSessions] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [editingChatId, setEditingChatId] = useState(null);
  const [newChatName, setNewChatName] = useState("");
  const [messages, setMessages] = useState([]);
  const [typingIndicator, setTypingIndicator] = useState(false);
  const [isInappropriate, setIsInAppropriate] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [lastBotMessageTime, setLastBotMessageTime] = useState(null);
  const [showResourcePrompt, setShowResourcePrompt] = useState(false);

  const chatContainerRef = useRef(null);
  const typingIntervalRef = useRef(null);
  const navigate = useNavigate();

  // Fetch chat sessions on mount and when userProfile changes
  useEffect(() => {
    const fetchChatSessions = async () => {
      const sessions = await getChatSessions();
      setChatSessions(sessions);

      // If there are sessions but no current chat, set the first one as current
      if (sessions.length > 0 && !currentChat) {
        loadChat(sessions[0].chatid);
      }
    };

    if (userProfile?.studentid) {
      fetchChatSessions();
    }
  }, [userProfile]);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, []);

  // Fetch user profile Image on mount
  useEffect(() => {
    if (userProfile) {
      setImageUrl(getImageUrl(userProfile.user_image));
    }
  }, [userProfile]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages, typingIndicator]);

  // Check for profanity whenever message changes
  useEffect(() => {
    if (message && containsProfanity(message)) {
      setIsInAppropriate(true);
      setShowWarning(true);
    } else {
      setIsInAppropriate(false);
      setShowWarning(false);
    }
  }, [message]);

  // Check for chat inactivity
  useEffect(() => {
    const checkInactivity = () => {
      if (lastBotMessageTime && !isTyping) {
        const inactiveTime = Date.now() - lastBotMessageTime;
        if (inactiveTime > 120000) {
          // 2 minutes in milliseconds
          setShowResourcePrompt(true);
        }
      }
    };

    const inactivityInterval = setInterval(checkInactivity, 10000); // Check every 10 seconds

    return () => clearInterval(inactivityInterval);
  }, [lastBotMessageTime, isTyping]);

  const ResourcePrompt = () => (
    <div className={styles.resourcePrompt}>
      <p>
        If you feel chatting with me isn't enough, you may find additional help
        at our{" "}
        <Link to="/view-resources" className={styles.resourceLink}>
          resources page
        </Link>
        .
      </p>
    </div>
  );

  const loadChat = async (chatId) => {
    try {
      const messages = await getChatMessages(chatId);
      setCurrentChat(chatId);
      setMessages(messages);
    } catch (error) {
      console.error("Error loading chat:", error);
    }
  };

  const clearChat = () => {
    setCurrentChat(null);
    setMessages([]);
  };

  const handleRenameChat = async (chatId, currentName) => {
    if (editingChatId === chatId) {
      try {
        await updateChatName(chatId, newChatName);
        setChatSessions((prev) =>
          prev.map((chat) =>
            chat.chatid === chatId ? { ...chat, chat_name: newChatName } : chat
          )
        );
        setEditingChatId(null);
        setNewChatName("");
      } catch (error) {
        console.error("Error renaming chat:", error);
      }
    } else {
      setEditingChatId(chatId);
      setNewChatName(currentName);
    }
  };

  const handleDeleteChat = async (chatId) => {
    try {
      await deleteChatSession(chatId);
      setChatSessions((prev) => prev.filter((chat) => chat.chatid !== chatId));
      if (currentChat == chatId) {
        clearChat();
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || isTyping) return;

    if (isInappropriate) {
      setShowWarning(true);
      return;
    }

    let chatId = currentChat;

    try {
      // If no current chat, create a new one
      if (!chatId) {
        const newSession = await createChatSession();
        setChatSessions((prev) => [newSession, ...prev]);
        chatId = newSession.chatid;
        setCurrentChat(chatId);
        setMessages([]);
      }

      // Save human message
      const newHumanMessage = {
        message_content: message,
        sender: "human",
        message_timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, newHumanMessage]);
      await saveMessage(chatId, message, "human");
      callModel(message, chatId);
      setMessage("");
    } catch (error) {
      console.error("Error in sendMessage:", error);
    }
  };

  const callModel = async (input, chatId) => {
    setIsTyping(true);
    setTypingIndicator(true);
    setShowResourcePrompt(false);

    try {
      // Testing: http://127.0.0.1:5000/model  Production: https://api.mirahub.me/model
      const response = await fetch("https://api.mirahub.me/model ", {
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

      // Save bot response to database
      simulateTypingEffect(data.result);
      await saveMessage(chatId, data.result, "bot");
      setLastBotMessageTime(Date.now());
      // Show bot response instantly (no typing effect)
      // setMessages((prev) => [
      //   ...prev,
      //   {
      //     message_content: data.result,
      //     sender: "bot",
      //     isTyping: false,
      //     message_timestamp: new Date().toISOString(),
      //   },
      // ]);
      // await saveMessage(chatId, data.result, "bot");
      // setTypingIndicator(false);
      // setIsTyping(false);

      // simulateTypingEffect("For Testing");
      // await saveMessage(chatId, "For Testing", "bot");
    } catch (error) {
      console.error("Error calling model:", error);
      const errorMsg =
        "Sorry, I'm sleepy right now. Mira will take a Nap and get back too you with full Energy.";
      simulateTypingEffect(errorMsg);

      // Show bot response instantly (no typing effect)
      // setMessages((prev) => [
      //   ...prev,
      //   {
      //     message_content: errorMsg,
      //     sender: "bot",
      //     isTyping: false,
      //     message_timestamp: new Date().toISOString(),
      //   },
      // ]);
      // setTypingIndicator(false);
      // setIsTyping(false);
    }
  };

  const simulateTypingEffect = (text) => {
    let i = 0;
    const words = text.split(" ");
    let partialMessage = "";

    // Clear any existing interval
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }

    typingIntervalRef.current = setInterval(() => {
      if (i < words.length) {
        partialMessage = words.slice(0, i + 1).join(" ");

        // Update the last message with the partial content
        setMessages((prev) => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];

          if (
            lastMessage &&
            lastMessage.sender === "bot" &&
            lastMessage.isTyping
          ) {
            newMessages[newMessages.length - 1] = {
              ...lastMessage,
              message_content:
                partialMessage + (i < words.length - 1 ? "..." : ""),
            };
          } else {
            newMessages.push({
              message_content:
                partialMessage + (i < words.length - 1 ? "..." : ""),
              sender: "bot",
              isTyping: true,
              message_timestamp: new Date().toISOString(),
            });
          }

          return newMessages;
        });

        i++;
      } else {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;

        // Mark the message as complete
        setMessages((prev) => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];

          if (lastMessage && lastMessage.sender === "bot") {
            newMessages[newMessages.length - 1] = {
              ...lastMessage,
              isTyping: false,
            };
          }

          return newMessages;
        });

        setTypingIndicator(false);
        setIsTyping(false);
      }
    }, 30);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const logout = async () => {
    try {
      // End current chat session if exists
      if (currentChat) {
        await endChatSession(currentChat);
      }
      await signOut();
      navigate("/chat");
    } catch (err) {
      console.error("Error signing out:", err.message);
    }
  };

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
        <div>
          <div className={styles.logoContainer}>
            {isSidebarOpen ? (
              <img src={logo} alt="mira logo" className={styles.logo} />
            ) : (
              <img src={logoOnly} alt="mira logo" className={styles.logoOnly} />
            )}
          </div>

          {/* Menu for chat */}
          <Menu iconShape="circle" className={styles.menu}>
            <MenuItem
              icon={
                <RiChatAiFill size={24} className={styles.sidebarIconbutton} />
              }
              className={styles.menuItem}
              onClick={clearChat}
            >
              New Chat
            </MenuItem>
            <SubMenu
              label="Our Chat"
              icon={
                <IoChatbubbles size={24} className={styles.sidebarIconbutton} />
              }
            >
              {chatSessions.map((chat) => (
                <MenuItem
                  key={chat.chatid}
                  active={currentChat === chat.chatid}
                  onClick={() => loadChat(chat.chatid)}
                >
                  {editingChatId === chat.chatid ? (
                    <div className={styles.chatEditContainer}>
                      <input
                        type="text"
                        value={newChatName}
                        onChange={(e) => setNewChatName(e.target.value)}
                        className={styles.chatNameInput}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRenameChat(chat.chatid, chat.chat_name);
                        }}
                        className={styles.chatEditButton}
                      >
                        <FiSend size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className={styles.chatItem}>
                      <span className={styles.chatName}>
                        {chat.chat_name || "New Chat"}
                      </span>
                      <div className={styles.chatActions}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRenameChat(chat.chatid, chat.chat_name);
                          }}
                          className={styles.chatActionButton}
                        >
                          <FiEdit size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteChat(chat.chatid);
                          }}
                          className={styles.chatActionButton}
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </MenuItem>
              ))}
            </SubMenu>
          </Menu>
        </div>

        {/* Menu for button */}
        <div>
          <Menu iconShape="circle" className={styles.menu}>
            <MenuItem
              icon={
                <FaHandHoldingHeart
                  size={24}
                  className={styles.sidebarIconbutton}
                />
              }
              onClick={() => navigate("/view-resources")}
              className={styles.menuItem}
            >
              External Help
            </MenuItem>
            <MenuItem
              icon={
                <RiFeedbackFill
                  size={24}
                  className={styles.sidebarIconbutton}
                />
              }
              onClick={() => navigate("/feedback")}
              className={styles.menuItem}
            >
              Feedback
            </MenuItem>
            <MenuItem
              icon={
                <IoSettings size={24} className={styles.sidebarIconbutton} />
              }
              onClick={() => navigate("/profile")}
              className={styles.menuItem}
            >
              Settings
            </MenuItem>
            <MenuItem
              icon={<IoLogOut size={24} className={styles.sidebarIconbutton} />}
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
          {isSidebarOpen ? (
            <FiX size={24} className={styles.sidebarIconbutton} />
          ) : (
            <FiMenu size={24} className={styles.sidebarIconbutton} />
          )}
        </button>

        <div className={styles.topContainer}>
          <Link to="/profile" className={styles.profileLink}>
            <img
              src={imageUrl}
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
          {messages.length === 0 && !typingIndicator ? (
            <h1 className={styles.containerPlaceHolder}>
              Hi Bestie!
              <br />
              How was your day?
            </h1>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`${
                  msg.sender === "human"
                    ? styles.humanMessage
                    : styles.botMessage
                } ${styles.bubble}`}
                dangerouslySetInnerHTML={{
                  __html: msg.message_content
                    .split("\n")
                    .map((paragraph, i) =>
                      paragraph ? `<p key=${i}>${paragraph}</p>` : "<br/>"
                    )
                    .join(""),
                }}
              />
            ))
          )}
          {typingIndicator && (
            <div className={`${styles.botMessage} ${styles.bubble}`}>
              <span className={styles.typingIndicator}></span>
              <span className={styles.typingIndicator}></span>
              <span className={styles.typingIndicator}></span>
            </div>
          )}
          {showResourcePrompt && <ResourcePrompt />}
        </div>

        <div className={styles.chatInput}>
          {/* Popup Warning */}
          {showWarning && (
            <div className={styles.warningPopup}>
              <div className={styles.warningContent}>
                <span className={styles.warningIcon}>⚠️</span>
                <p>Please remove inappropriate language before sending</p>
                <button
                  className={styles.closeWarning}
                  onClick={() => setShowWarning(false)}
                >
                  ×
                </button>
              </div>
            </div>
          )}
          <input
            type="text"
            id="input"
            name="input"
            value={message}
            className={`${styles.input} ${
              isInappropriate ? styles.inappropriate : ""
            }`}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Share your thoughts here..."
            disabled={isTyping}
          />
          <button
            className={styles.sendBtn}
            onClick={sendMessage}
            disabled={!message.trim() || isTyping}
          >
            {isTyping ? (
              <div className={styles.loader}></div>
            ) : (
              <FiSend className={styles.sendIcon} size={24} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatScreen;
