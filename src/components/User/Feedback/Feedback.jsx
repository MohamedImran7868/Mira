import React, { useState } from "react";
import Header from "../../Header";
import styles from "./Feedback.module.css";
import { useAuth } from "../../../AuthContext";

const Feedback = () => {
  const { user, uploadFeedback } = useAuth();
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
      // Call feedback submission function
      await uploadFeedback(feedback);

      // Reset form only after successful submission
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
            <h2>Thank You for Your Feedback!</h2>
            <p>
              We appreciate you taking the time to share your thoughts with us.
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

  return (
    <>
      <Header />
      <div className={styles.container}>
        <div className={styles.feedbackCard}>
          <h2 className={styles.title}>Share Your Feedback</h2>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="title">Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={feedback.title}
                onChange={handleChange}
                required
                maxLength="100"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="category">Category</label>
              <select
                id="category"
                name="category"
                value={feedback.category}
                onChange={handleChange}
                required
              >
                <option value="general">General Feedback</option>
                <option value="bug">Bug Report</option>
                <option value="feature">Feature Request</option>
                <option value="improvement">Improvement Suggestion</option>
                <option value="response">Chatbot Response</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Rating</label>
              <div className={styles.ratingContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`${styles.star} ${
                      star <= feedback.rating ? styles.active : ""
                    }`}
                    onClick={() => handleRatingChange(star)}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="message">Your Feedback</label>
              <textarea
                id="message"
                name="message"
                value={feedback.message}
                onChange={handleChange}
                required
                rows="5"
                maxLength="500"
              />
              <span className={styles.charCount}>
                {feedback.message.length}/500 characters
              </span>
            </div>

            {error && <div className={styles.errorMessage}>{error}</div>}

            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit Feedback"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default Feedback;
