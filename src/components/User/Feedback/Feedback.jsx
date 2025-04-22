import React, { useState } from 'react';
import styles from './Feedback.module.css';
import { useNavigate } from 'react-router-dom';
import Header from '../../Header';

const Feedback = ({ onSubmitFeedback, onBack }) => {
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState('Response');

  return (
    <>
    <Header />
    <div className={styles.container}>
      
      <div className={styles.topContainer}>
        <h2 className={styles.title}> Your Opinion Matters!!!</h2>
        
        <div className={styles.form}>
          <label className={styles.type}>Type:</label>
          <select
            value={feedbackType}
            onChange={(e) => setFeedbackType(e.target.value)}
            className={styles.typeSelect}
          >
            <option value="Response">Response</option>
            <option value="Design">Design</option>
          </select>
        </div>
        
        <div className={styles.feedbackContainer}>
          <h3 className={styles.feedback}>Feedback:</h3>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Write your thought here …"
            className={styles.feedbackTextarea}
            maxLength="1000"
          />
          <p className={styles.feedbackLength}>{feedback.length}/1000</p>
        </div>
        
        <div className={styles.btn}>
          <button 
            onClick={() => onSubmitFeedback({ type: feedbackType, message: feedback })}
            className={styles.submitBtn}
            style={{ fontFamily: 'Agrandir, sans-serif' }}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
    </>
  );
};

export default Feedback;