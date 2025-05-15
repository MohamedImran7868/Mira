import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "../../Common/Header";
import styles from "./ViewFeedback.module.css";

function ViewFeedback() {
  const [feedbackType, setFeedbackType] = useState("Response");
  return (
    <>
      <Header />
      <div className={styles.container}>
        <div className={styles.topContainer}>
          <label className={styles.type}>Type:</label>
          <select
            value={feedbackType}
            onChange={(e) => setFeedbackType(e.target.value)}
            className={styles.typeSelect}
          >
            <option value="Response">Response</option>
            <option value="Design">Design</option>
          </select>
          <button className={styles.searchBtn} type="submit">
            Search
          </button>
        </div>
        <div className={styles.userList}>
          <div className={styles.userItem}>
            <span className={styles.user}>User 1</span>
            <div className={styles.feedbackContainer}>
              <span className={styles.feedback}>Feedback 1</span>
              <div className={styles.btnContainer}>
                <button className={styles.warningBtn}>Warning</button>
                <button className={styles.deleteBtn}>Delete</button>
              </div>
            </div>
          </div>
          <hr />
          <div className={styles.userItem}>
            <span className={styles.user}>User 2</span>
            <div className={styles.feedbackContainer}>
              <span className={styles.feedback}>Feedback 2</span>
              <div className={styles.btnContainer}>
                <button className={styles.warningBtn}>Warning</button>
                <button className={styles.deleteBtn}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ViewFeedback;
