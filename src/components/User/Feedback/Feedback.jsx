import React, { useState } from "react";
import Header from "../../Common/Header";
import styles from "./Feedback.module.css";
import { useAuth } from "../../../AuthContext";
import { FaStar, FaCheckCircle, FaPaperPlane, FaLightbulb, FaBug, FaComments, FaCog } from "react-icons/fa";

const Feedback = () => {
  const { uploadFeedback } = useAuth();
  const [feedback, setFeedback] = useState({
    title: "",
    message: "",
    rating: 0,
    category: "general",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFeedback((prev) => ({ ...prev, [name]: value }));
  };

  const handleRatingChange = (rating) => {
    setFeedback((prev) => ({ ...prev, rating }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await uploadFeedback(feedback);
      setFeedback({
        title: "",
        message: "",
        rating: 0,
        category: "general",
      });
      setSubmitted(true);
    } catch (err) {
      setError("Failed to submit feedback. Please try again.");
      console.error("Submission error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <>
        <Header />
        <div className={styles.successContainer}>
          <div className={styles.successCard}>
            <FaCheckCircle className={styles.successIcon} />
            <h2>Thank You for Your Feedback!</h2>
            <p>
              We appreciate you taking the time to help us improve MIRA. Your insights are valuable to us.
            </p>
            <button
              className={styles.returnButton}
              onClick={() => setSubmitted(false)}
            >
              Submit Another Feedback
            </button>
          </div>
        </div>
      </>
    );
  }

  const categoryIcons = {
    general: <FaComments />,
    bug: <FaBug />,
    feature: <FaLightbulb />,
    improvement: <FaCog />,
    response: <FaComments />,
  };

  return (
    <>
      <Header />
      <div className={styles.container}>
        <div className={styles.feedbackCard}>
          <div className={styles.header}>
            <h2>Share Your Feedback</h2>
            <p>We'd love to hear your thoughts about MIRA</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="title" className={styles.inputLabel}>
                Feedback Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={feedback.title}
                onChange={handleChange}
                required
                maxLength="100"
                className={styles.inputField}
                placeholder="Brief description of your feedback"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="category" className={styles.inputLabel}>
                Category
              </label>
              <div className={styles.selectContainer}>
                <span className={styles.categoryIcon}>
                  {categoryIcons[feedback.category]}
                </span>
                <select
                  id="category"
                  name="category"
                  value={feedback.category}
                  onChange={handleChange}
                  required
                  className={styles.selectField}
                >
                  <option value="general">General Feedback</option>
                  <option value="bug">Bug Report</option>
                  <option value="feature">Feature Request</option>
                  <option value="improvement">Improvement Suggestion</option>
                  <option value="response">Chatbot Response</option>
                </select>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.inputLabel}>Your Rating</label>
              <div className={styles.ratingContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`${styles.star} ${
                      star <= feedback.rating ? styles.active : ""
                    }`}
                    onClick={() => handleRatingChange(star)}
                    aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
                  >
                    <FaStar />
                  </button>
                ))}
                <span className={styles.ratingText}>
                  {feedback.rating > 0
                    ? `${feedback.rating} star${feedback.rating !== 1 ? 's' : ''}`
                    : "Not rated"}
                </span>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="message" className={styles.inputLabel}>
                Detailed Feedback
              </label>
              <textarea
                id="message"
                name="message"
                value={feedback.message}
                onChange={handleChange}
                required
                rows="5"
                maxLength="500"
                className={styles.textareaField}
                placeholder="Please share your detailed thoughts, suggestions, or issues..."
              />
              <div className={styles.footerNote}>
                <span className={styles.charCount}>
                  {feedback.message.length}/500 characters
                </span>
              </div>
            </div>

            {error && (
              <div className={styles.errorMessage}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              <FaPaperPlane className={styles.buttonIcon} />
              {loading ? "Submitting..." : "Submit Feedback"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default Feedback;