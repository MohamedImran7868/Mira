import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import logo from '../../../assets/Logo.png';
import profilepic from '../../../assets/imran.jpg';
import { IoSettings } from "react-icons/io5";
import { RiFeedbackFill } from "react-icons/ri";
import styles from './Chat.module.css';
import { useAuth } from "../../../AuthContext";

const ChatScreen = () => {
  const [message, setMessage] = useState("");
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const logout = async () => {
    try {
      await signOut();
      navigate("/chat");
    } catch (err) {
      console.error("Error signing out:", err.message);
    }
  };

  const [messageBegin, setMessageBegin]= useState(false);

  const sendMessage = () =>{
    var message = document.getElementById("message");
    var chatContainer = document.getElementById("chatContainer");
    var containerPlaceHolder = document.getElementById("containerPlaceHolder");

    if (message.value == ""){
      return;
    } 
    setMessageBegin(true);
    
    // generate response
    callModel(message.value);
    
    // Style adjustment
    chatContainer.style.justifyContent = 'flex-start';
    if(!messageBegin) containerPlaceHolder.style.display = 'none';

    createBubble(message.value, "human");
    //insertData(message.value, "human");
    message.value = "";
  }

  const callModel = async (input) => {
    const response = await fetch('http://127.0.0.1:5000/model', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({input})
    });

    const data = await response.json()
    createBubble( data.result, "bot");
    //insertData(data.result, "bot");

    console.log(data.result);
  }

  const createBubble = (message, role) => {
    var chatContainer = document.getElementById("chatContainer");
    const messageDiv = document.createElement('div');

    messageDiv.className = `${role == "human"? styles.humanMessage : styles.botMessage} ${styles.bubble}`;
    messageDiv.innerHTML = message;

    chatContainer.appendChild(messageDiv);
  }

  const insertData = async (message, sender) => {
    const messageData = {
      sender: sender,
      message_content: message,
    }

    const {data, error} = await supabase
    .from("message")
    .insert([messageData])
    .single();
  }

  return (
    <>
      <div className={styles.sideMenu}>
          <img src={logo} alt='mira logo' className={styles.logo}/>
        <div className={styles.btn}>
          <button className={styles.feedbackBtn} onClick={() => navigate('/feedback')}><RiFeedbackFill size={24}/>Feedback</button>
          <button className={styles.settingsBtn} onClick={() => navigate('/admin-dashboard')}><IoSettings size={24}/>Setting</button>         
          <button className={styles.feedbackBtn} onClick={logout}>Logout</button>
        </div>
      </div>
      <div className={styles.container}>
        <div className={styles.topContainer}>
          <Link to="/profile" className={styles.profileLink}>
            <img src={profilepic} alt='user profile picture' className={styles.profilePic}/>
          </Link>
        </div>
        <div id="chatContainer" className={styles.chatContainer}>
          <h1 id="containerPlaceHolder" className={styles.containerPlaceHolder}>Hi Bestie!<br />How was your day?</h1>
        </div>
        <div className={styles.chatInput}>
          <input 
            type="text" 
            id="message" 
            className={styles.input} 
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Share your thoughts here..." 
          />
          <button id='send button' className={styles.sendBtn} onClick={sendMessage}>Send</button>
        </div>
      </div>
    </>
  );
};

export default ChatScreen;