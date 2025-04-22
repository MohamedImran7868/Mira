import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../Header.jsx";
import styles from "./ViewResources.module.css";
import { MdAttachEmail } from "react-icons/md";
import { FaClock } from "react-icons/fa6";

function ViewResources() {
  const [feedbackType, setFeedbackType] = useState("Response");
  const navigate = useNavigate();
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
            <option value="assosiation">Assosiation</option>
            <option value="consultant">Consultant</option>
          </select>
        </div>
        <div className={styles.resourcesList}>
            <div className={styles.resourceItem}>
                <span className={styles.resourceName}>Ms. Haifa</span>
                <span className={styles.resourceDesc}>Consultant Specialist from FCI faculty</span>
                <div className={styles.resourceDetails}>
                    <span className={styles.resourceContact}> <MdAttachEmail /> nur.haifa@mmu.edu.my</span>
                    <span className={styles.resourceTime}> <FaClock /> 9.00 am - 3.00 pm</span>
                </div>
                <div className={styles.btnContainer}>
                    <button className={styles.editBtn}>Edit</button>
                    <button className={styles.deleteBtn}>Delete</button>
                </div>
            </div>
            <div className={styles.resourceItem}>
                <span className={styles.resourceName}>Mr. Zahin</span>
                <span className={styles.resourceDesc}>Consultant Specialist from FCI faculty</span>
                <div className={styles.resourceDetails}>
                    <span className={styles.resourceContact}> <MdAttachEmail /> nzahinadri@mmu.edu.my</span>
                    <span className={styles.resourceTime}> <FaClock /> 10.00 am - 5.00 pm</span>
                </div>
                <div className={styles.btnContainer}>
                    <button className={styles.editBtn}>Edit</button>
                    <button className={styles.deleteBtn}>Delete</button>
                </div>
            </div>
        </div>
        <div className={styles.bottomContainer}>
            <button className={styles.addBtn} onClick={() => navigate('/add-resources')}>Add Resource</button>
        </div>
      </div>
    </>
  );
}

export default ViewResources;
