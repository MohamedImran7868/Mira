import { useState, useEffect } from "react";
import { useAuth } from "../../../AuthContext";
import Header from "../../Common/Header";
import styles from "./ViewFeedback.module.css";
import LoadingModal from "../../Common/LoadingModal";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

function ViewFeedback() {
  const { getFeedback, deleteFeedback } = useAuth();
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchName, setSearchName] = useState("");

  // Filters
  const [category, setCategory] = useState("");
  const [rating, setRating] = useState("");
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;

  // Sorting
  const [sortConfig, setSortConfig] = useState({
    field: "timestamp",
    order: "desc",
  });

  // Load initial feedback
  useEffect(() => {
    fetchFeedback();
  }, [currentPage, sortConfig, category, rating, dateRange]);

  const fetchFeedback = async () => {
    setLoading(true);
    setError(null);
    try {
      const filters = {
        category: category || undefined,
        rating: rating || undefined,
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
      };

      const { feedback, totalCount, totalPages } = await getFeedback(
        currentPage,
        filters,
        sortConfig.field,
        sortConfig.order,
        searchName
      );

      setFeedback(feedback);
      setTotalCount(totalCount);
      setTotalPages(totalPages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (feedbackId) => {
    if (!window.confirm("Are you sure you want to delete this feedback?")) {
      return;
    }

    setLoading(true);
    try {
      await deleteFeedback(feedbackId);
      await fetchFeedback(); // Refresh the list
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    setSortConfig((prev) => ({
      field,
      order: prev.field === field && prev.order === "asc" ? "desc" : "asc",
    }));
    setCurrentPage(1); // Reset to first page when sorting
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleResetFilters = () => {
    setSearchName("");
    setCategory("");
    setRating("");
    setDateRange([null, null]);
    setCurrentPage(1);
    setSortConfig({ field: "timestamp", order: "desc" });
  };

  return (
    <>
      <Header />
      <div className={styles.container}>
        <div className={styles.topContainer}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchFeedback();
            }}
            className={styles.filterForm}
          >
            <div className={styles.filterGroup}>
              <label>Search User:</label>
              <input
                type="text"
                placeholder="Search by user name"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className={styles.searchInput}
              />
            </div>

            <div className={styles.filterGroup}>
              <label>Category:</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                <option value="general">General Feedback</option>
                <option value="bug">Bug Report</option>
                <option value="feature">Feature Request</option>
                <option value="improvement">Improvement Suggestion</option>
                <option value="response">Chatbot Response</option>
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label>Rating:</label>
              <select
                value={rating}
                onChange={(e) => setRating(e.target.value)}
              >
                <option value="">All Ratings</option>
                <option value="1">1 Star</option>
                <option value="2">2 Stars</option>
                <option value="3">3 Stars</option>
                <option value="4">4 Stars</option>
                <option value="5">5 Stars</option>
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label>Date Range:</label>
              <DatePicker
                selectsRange
                startDate={startDate}
                endDate={endDate}
                onChange={(update) => setDateRange(update)}
                isClearable={true}
                placeholderText="Select date range"
                className={styles.dateInput}
              />
            </div>

            <div className={styles.buttonGroup}>
              <button type="submit" className={styles.searchBtn}>
                Apply Filters
              </button>
              <button
                type="button"
                onClick={handleResetFilters}
                className={styles.resetBtn}
              >
                Reset
              </button>
            </div>
          </form>
        </div>

        {error && <div className={styles.error}>Error: {error}</div>}

        <div className={styles.tableContainer}>
          <table className={styles.feedbackTable}>
            <thead>
              <tr>
                <th onClick={() => handleSort("feedback_title")}>
                  Title{" "}
                  {sortConfig.field === "feedback_title" &&
                    (sortConfig.order === "asc" ? "↑" : "↓")}
                </th>
                <th>Content</th>
                <th onClick={() => handleSort("feedback_rating")}>
                  Rating{" "}
                  {sortConfig.field === "feedback_rating" &&
                    (sortConfig.order === "asc" ? "↑" : "↓")}
                </th>
                <th onClick={() => handleSort("timestamp")}>
                  Date{" "}
                  {sortConfig.field === "timestamp" &&
                    (sortConfig.order === "asc" ? "↑" : "↓")}
                </th>
                <th onClick={() => handleSort("feedback_category")}>
                  Category{" "}
                  {sortConfig.field === "feedback_category" &&
                    (sortConfig.order === "asc" ? "↑" : "↓")}
                </th>
                <th>User</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {feedback.length > 0 ? (
                feedback.map((item) => (
                  <tr key={item.feedback_id}>
                    <td>{item.feedback_title || "N/A"}</td>
                    <td className={styles.contentCell}>
                      {item.feedback_message}
                    </td>
                    <td>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span
                          key={i}
                          className={
                            i < item.feedback_rating
                              ? styles.starFilled
                              : styles.starEmpty
                          }
                        >
                          ★
                        </span>
                      ))}
                    </td>
                    <td>{new Date(item.timestamp).toLocaleDateString()}</td>
                    <td>{item.displayCategory}</td>
                    <td>{item.user?.user?.user_name || "Unknown"}</td>
                    <td>
                      <button
                        className={styles.deleteBtn}
                        onClick={() => handleDelete(item.feedback_id)}
                        disabled={loading}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className={styles.noResults}>
                    {loading ? "Loading..." : "No feedback found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || loading}
              >
                Previous
              </button>
              <span>
                Page {currentPage} of {totalPages} ({totalCount} total)
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || loading}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default ViewFeedback;