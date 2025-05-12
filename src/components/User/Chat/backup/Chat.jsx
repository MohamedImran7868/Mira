import { useNavigate, Link } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import logo from '../../../assets/Logo.png';
import profilepic from '../../../assets/imran.jpg';
import { IoSettings } from "react-icons/io5";
import { RiFeedbackFill } from "react-icons/ri";
import { IoLogOut } from "react-icons/io5";
import { FiMenu, FiX } from "react-icons/fi";
import styles from './Chat.module.css';
import { useAuth } from "../../../AuthContext";

const ChatScreen = () => {
  const { signOut } = useAuth();
  const [message, setMessage] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
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

  const [messageBegin, setMessageBegin] = useState(false);

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
      chatContainerRef.current.style.justifyContent = 'flex-start';
    }
    
    createBubble(message, "human");
    callModel(message);
    setMessage("");
  };

  const callModel = async (input) => {
    setIsTyping(true);
    try {
      const response = await fetch('http://127.0.0.1:5000/model', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ input })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      simulateTypingEffect(data.result);
    } catch (error) {
      console.error('Error calling model:', error);
      simulateTypingEffect("Sorry, I'm having trouble connecting to the AI service.");
    }
  };

  const simulateTypingEffect = (text) => {
    const chatContainer = chatContainerRef.current;
    if (!chatContainer) return;

    // Create typing indicator
    const typingIndicator = document.createElement('div');
    typingIndicator.className = `${styles.botMessage} ${styles.bubble}`;
    typingIndicator.id = 'typing-indicator';
    typingIndicator.innerHTML = `
      <span class="${styles.typingIndicator}"></span>
      <span class="${styles.typingIndicator}"></span>
      <span class="${styles.typingIndicator}"></span>
    `;
    
    chatContainer.appendChild(typingIndicator);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    // Create the actual message element but keep it hidden initially
    const messageDiv = document.createElement('div');
    messageDiv.className = `${styles.botMessage} ${styles.bubble}`;
    messageDiv.style.display = 'none';
    chatContainer.appendChild(messageDiv);

    let i = 0;
    const words = text.split(' ');

    // Clear any existing interval
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }

    typingIntervalRef.current = setInterval(() => {
      if (i < words.length) {
        messageDiv.innerHTML = words.slice(0, i + 1).join(' ') + (i < words.length - 1 ? '...' : '');
        
        // Show the message div and hide typing indicator when we start typing
        if (i === 0) {
          typingIndicator.style.display = 'none';
          messageDiv.style.display = 'block';
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

    const messageDiv = document.createElement('div');
    messageDiv.className = `${role === "human" ? styles.humanMessage : styles.botMessage} ${styles.bubble}`;
    
    const paragraphs = message.split('\n').map((paragraph, i) => 
      paragraph ? `<p key=${i}>${paragraph}</p>` : '<br/>'
    ).join('');
    
    messageDiv.innerHTML = paragraphs;
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
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
    <>
      <div className={`${styles.sideMenu} ${isSidebarOpen ? '' : styles.collapsed}`}>
        <img src={logo} alt='mira logo' className={styles.logo}/>
        <div className={styles.btn}>
          <button className={styles.iconBtn} onClick={() => navigate('/feedback')}>
            <RiFeedbackFill size={24}/>
            <span>Feedback</span>
          </button>
          <button className={styles.iconBtn} onClick={() => navigate('/admin-dashboard')}>
            <IoSettings size={24}/>
            <span>Settings</span>
          </button>         
          <button className={styles.iconBtn} onClick={logout}>
            <IoLogOut size={24}/>
            <span>Logout</span>
          </button>
        </div>
      </div>
      
      <div className={`${styles.container} ${isSidebarOpen ? '' : styles.collapsed}`}>
        <button className={styles.menuToggle} onClick={toggleSidebar}>
          {isSidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
        <div className={styles.topContainer}>
          <Link to="/profile" className={styles.profileLink}>
            <img src={profilepic} alt='user profile picture' className={styles.profilePic}/>
          </Link>
        </div>
        
        <div id="chatContainer" className={styles.chatContainer} ref={chatContainerRef}
          style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
          {!messageBegin && (
            <h1 className={styles.containerPlaceHolder} 
                style={{ 
                  left: isSidebarOpen ? 'calc(50% + 125px)' : '50%',
                  transform: isSidebarOpen ? 'translateX(calc(-50% - 125px))' : 'translateX(-50%)'
                }}>
              Hi Bestie!<br />How was your day?
            </h1>
          )}
        </div>
        
        <div className={styles.chatInput} >
          <input 
            type="text" 
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
            {isTyping ? '...' : 'Send'}
          </button>
        </div>
      </div>
    </>
  );
};

export default ChatScreen;