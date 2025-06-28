import { useNavigate, Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { containsProfanity } from "../../Common/filter";
import ReactMarkdown from "react-markdown";
// Components
import styles from "./Chat.module.css";
import LogoutPopup from "../../Common/LogoutPopup";
import {
  Sidebar,
  Menu,
  MenuItem,
  SubMenu,
  sidebarClasses,
} from "react-pro-sidebar";

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

  // State
  const [imageUrl, setImageUrl] = useState(null);
  const [chatSessions, setChatSessions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [currentChat, setCurrentChat] = useState(null);
  const [editingChatId, setEditingChatId] = useState(null);
  const [newChatName, setNewChatName] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [lastBotMessageTime, setLastBotMessageTime] = useState(null);
  const [showResourcePrompt, setShowResourcePrompt] = useState(false);

  // Refs
  const chatContainerRef = useRef(null);
  const typingIntervalRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Fetch chat sessions on mount and when userProfile changes
  useEffect(() => {
    const fetchChatSessions = async () => {
      const sessions = await getChatSessions();
      setChatSessions(sessions);
      if (sessions.length > 0 && !currentChat) {
        loadChat(sessions[0].chatid);
      }
    };
    if (userProfile?.studentid) fetchChatSessions();
    // eslint-disable-next-line
  }, [userProfile]);

  // Clean up typing interval on unmount
  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    };
  }, []);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  // Focus input after bot response is done typing
  useEffect(() => {
    if (!isTyping && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isTyping]);

  // Fetch user profile image on mount
  useEffect(() => {
    if (userProfile) setImageUrl(getImageUrl(userProfile.user_image));
  }, [userProfile, getImageUrl]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Profanity check
  useEffect(() => {
    setShowWarning(input && containsProfanity(input));
  }, [input]);

  // Inactivity prompt
  useEffect(() => {
    const checkInactivity = () => {
      if (lastBotMessageTime && !isTyping && messages.length > 0) {
        if (Date.now() - lastBotMessageTime > 120000)
          setShowResourcePrompt(true);
      }
    };
    const inactivityInterval = setInterval(checkInactivity, 10000);
    return () => clearInterval(inactivityInterval);
  }, [lastBotMessageTime, isTyping, messages.length]);

  // Helpers
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
      const msgs = await getChatMessages(chatId);
      setCurrentChat(chatId);
      setMessages(msgs);
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
      if (currentChat === chatId) clearChat();
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isTyping || showWarning) return;

    let chatId = currentChat;
    try {
      if (!chatId) {
        const newSession = await createChatSession();
        setChatSessions((prev) => [newSession, ...prev]);
        chatId = newSession.chatid;
        setCurrentChat(chatId);
        setMessages([]);
      }
      const newHumanMessage = {
        message_content: input,
        sender: "human",
        message_timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, newHumanMessage]);
      callModel(input, chatId);
      setInput("");
    } catch (error) {
      console.error("Error in sendMessage:", error);
    }
  };

  const callModel = async (input, chatId) => {
    setIsTyping(true);
    setShowResourcePrompt(false);

    let fullResponse = "";
    try {
      // Testing: http://127.0.0.1:5000/model  Production: https://api.mirahub.me/model
      const response = await fetch("https://api.mirahub.me/model", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });
      if (!response.ok) throw new Error("Network response was not ok");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      // Add the user's message immediately
      await saveMessage(chatId, input, "human");

      while (!done) {
        const { value, done: streamDone } = await reader.read();
        if (streamDone) break;
        const lines = decoder
          .decode(value, { stream: true })
          .split("\n")
          .filter(Boolean);

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.chunk) {
              if (fullResponse.length === 0) {
                data.chunk = data.chunk.replace(/^\s+/, "");
              }
              fullResponse += data.chunk;
              // Update the bot message in the UI as it streams
              setMessages((prev) => {
                const newMessages = [...prev];
                // If last message is bot and isTyping, update it, else add new
                const last = newMessages[newMessages.length - 1];
                if (last && last.sender === "bot" && last.isTyping) {
                  newMessages[newMessages.length - 1] = {
                    ...last,
                    message_content: fullResponse,
                  };
                } else {
                  newMessages.push({
                    message_content: fullResponse,
                    sender: "bot",
                    isTyping: true,
                    message_timestamp: new Date().toISOString(),
                  });
                }
                return newMessages;
              });
            }
            if (data.done) {
              done = true;
              // Mark the last bot message as not typing
              setMessages((prev) => {
                const newMessages = [...prev];
                const last = newMessages[newMessages.length - 1];
                if (last && last.sender === "bot") {
                  newMessages[newMessages.length - 1] = {
                    ...last,
                    isTyping: false,
                  };
                }
                return newMessages;
              });
              setIsTyping(false);
              setLastBotMessageTime(Date.now());
              // Save the bot's full response to the database
              await saveMessage(chatId, fullResponse, "bot");
            }
          } catch (err) {
            console.error("Error parsing chunk:", err);
          }
        }
      }
    } catch (error) {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          message_content:
            "Sorry, I'm sleepy right now. Mira will take a nap and get back to you with full Energy.",
          sender: "bot",
          isTyping: false,
          message_timestamp: new Date().toISOString(),
        },
      ]);
    }
  };

  const toggleSidebar = () => setIsSidebarOpen((open) => !open);

  const logout = async () => {
    try {
      if (currentChat) await endChatSession(currentChat);
      await signOut();
      navigate("/chat");
    } catch (err) {
      console.error("Error signing out:", err.message);
    }
  };

  // Render
  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <LogoutPopup
        isVisible={showPopup}
        onConfirm={logout}
        onClose={() => setShowPopup(false)}
      />

      {!isSidebarOpen && (
        <div
          className={`${styles.sidebarOverlay} ${isSidebarOpen ? "active" : ""}`}
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
        className={`${styles.container} ${!isSidebarOpen ? styles.collapsed : ""}`}
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
              alt="user profile"
              className={styles.profilePic}
            />
          </Link>
        </div>

        <div
          id="chatContainer"
          className={styles.chatContainer}
          ref={chatContainerRef}
        >
          {messages.length === 0 && !isTyping ? (
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
              >
                <ReactMarkdown>{msg.message_content}</ReactMarkdown>
              </div>
            ))
          )}
          {isTyping && (
            <div className={`${styles.botMessage} ${styles.bubble}`}>
              <span className={styles.typingIndicator}></span>
              <span className={styles.typingIndicator}></span>
              <span className={styles.typingIndicator}></span>
            </div>
          )}
          {showResourcePrompt && <ResourcePrompt />}
        </div>

        <div className={styles.chatInput}>
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
            ref={inputRef}
            type="text"
            id="input"
            name="input"
            value={input}
            className={`${styles.input} ${
              showWarning ? styles.inappropriate : ""
            }`}
            onChange={(e) => setInput(e.target.value)}
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
            disabled={!input.trim() || isTyping || showWarning}
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
