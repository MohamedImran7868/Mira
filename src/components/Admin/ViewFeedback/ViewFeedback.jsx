import { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import useFeedbackSubscription from "../../../realtime/feedback";

// Components
import Header from "../../Common/Header";
import styles from "./ViewFeedback.module.css";
import DeleteConfirmation from "../../Common/DeleteConfirmation";
import LoadingModal from "../../Common/LoadingModal";

// Date Picker
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// Icons
import {
  FaSearch,
  FaFilter,
  FaTrash,
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
  FaStar,
  FaRegStar,
  FaUser,
  FaCalendarAlt,
  FaTag,
  FaInfoCircle,
  FaSort,
  FaSortUp,
  FaSortDown,
} from "react-icons/fa";

function ViewFeedback() {
  const { getFeedback, deleteFeedback } = useAuth();
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchName, setSearchName] = useState("");
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  // Delete Confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [feedbackToDelete, setfeedbackToDelete] = useState(null);

  useEffect(() => {
    fetchFeedback();
  }, [currentPage, sortConfig, category, rating, dateRange, searchName]);

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

  useFeedbackSubscription(fetchFeedback);

  const handleSort = (field) => {
    setSortConfig((prev) => ({
      field,
      order: prev.field === field && prev.order === "asc" ? "desc" : "asc",
    }));
    setCurrentPage(1);
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

  const openModal = (feedback) => {
    setSelectedFeedback(feedback);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedFeedback(null);
  };

  const handleDelete = async (feedbackId) => {
    setDeleting(true);
    try {
      setShowDeleteModal(false);
      await deleteFeedback(feedbackId);
      await fetchFeedback();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteFromModal = async () => {
    if (selectedFeedback) {
      await handleDelete(selectedFeedback.feedback_id);
      closeModal();
    }
  };

  const renderSortIcon = (field) => {
    if (sortConfig.field !== field)
      return <FaSort className={styles.sortIcon} />;
    return sortConfig.order === "asc" ? (
      <FaSortUp className={styles.sortIcon} />
    ) : (
      <FaSortDown className={styles.sortIcon} />
    );
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }).map((_, i) =>
      i < rating ? (
        <FaStar key={i} className={styles.starFilled} />
      ) : (
        <FaRegStar key={i} className={styles.starEmpty} />
      )
    );
  };

  return (
    <>
      {deleting && <LoadingModal message="Deleting feedback..." />}
      <DeleteConfirmation
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => handleDelete(feedbackToDelete)}
        title="Delete Feedback"
        message="Are you sure you want to delete this feedback? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />
      <Header />
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h2>User Feedback</h2>
            <p>View and manage all user feedback submissions</p>
          </div>

          <div className={styles.filterSection}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                fetchFeedback();
              }}
              className={styles.filterForm}
            >
              <div className={styles.filterGrid}>
                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>
                    <FaSearch className={styles.filterIcon} />
                    Search User
                  </label>
                  <input
                    type="text"
                    placeholder="Search by user name..."
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    className={styles.filterInput}
                  />
                </div>

                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>
                    <FaTag className={styles.filterIcon} />
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={styles.filterSelect}
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
                  <label className={styles.filterLabel}>
                    <FaStar className={styles.filterIcon} />
                    Rating
                  </label>
                  <select
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    className={styles.filterSelect}
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
                  <label className={styles.filterLabel}>
                    <FaCalendarAlt className={styles.filterIcon} />
                    Date Range
                  </label>
                  <DatePicker
                    selectsRange
                    startDate={startDate}
                    endDate={endDate}
                    onChange={(update) => setDateRange(update)}
                    isClearable={true}
                    placeholderText="Select date range"
                    className={styles.datePicker}
                    dateFormat="MMM d, yyyy"
                  />
                </div>
              </div>

              <div className={styles.filterActions}>
                <button
                  type="submit"
                  className={styles.applyButton}
                  disabled={loading}
                >
                  <FaFilter className={styles.buttonIcon} />
                  Apply Filters
                </button>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className={styles.resetButton}
                >
                  Reset Filters
                </button>
              </div>
            </form>
          </div>

          {error && (
            <div className={styles.errorMessage}>
              <FaInfoCircle className={styles.errorIcon} />
              {error}
            </div>
          )}

          <div className={styles.tableWrapper}>
            <table className={styles.feedbackTable}>
              <thead>
                <tr>
                  <th
                    onClick={() => handleSort("feedback_title")}
                    className={styles.sortableHeader}
                  >
                    <div className={styles.headerContent}>
                      Title
                      {renderSortIcon("feedback_title")}
                    </div>
                  </th>
                  <th>Content Preview</th>
                  <th
                    onClick={() => handleSort("feedback_rating")}
                    className={styles.sortableHeader}
                  >
                    <div className={styles.headerContent}>
                      Rating
                      {renderSortIcon("feedback_rating")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("timestamp")}
                    className={styles.sortableHeader}
                  >
                    <div className={styles.headerContent}>
                      Date
                      {renderSortIcon("timestamp")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("feedback_category")}
                    className={styles.sortableHeader}
                  >
                    <div className={styles.headerContent}>
                      Category
                      {renderSortIcon("feedback_category")}
                    </div>
                  </th>
                  <th>User</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {feedback.length > 0 ? (
                  feedback.map((item) => (
                    <tr key={item.feedback_id} className={styles.feedbackRow}>
                      <td className={styles.titleCell}>
                        {item.feedback_title || "N/A"}
                      </td>
                      <td
                        className={styles.contentCell}
                        onClick={() => openModal(item)}
                      >
                        {item.feedback_message.length > 50
                          ? `${item.feedback_message.substring(0, 50)}...`
                          : item.feedback_message}
                      </td>
                      <td className={styles.ratingCell}>
                        <div className={styles.starsContainer}>
                          {renderStars(item.feedback_rating)}
                        </div>
                      </td>
                      <td className={styles.dateCell}>
                        {new Date(item.timestamp).toLocaleDateString()}
                      </td>
                      <td className={styles.categoryCell}>
                        <span className={styles.categoryBadge}>
                          {item.displayCategory}
                        </span>
                      </td>
                      <td className={styles.userCell}>
                        {item.user?.user?.user_name || "Unknown"}
                      </td>
                      <td className={styles.actionsCell}>
                        <button
                          className={styles.viewButton}
                          onClick={() => openModal(item)}
                        >
                          View
                        </button>
                        <button
                          className={styles.deleteButton}
                          onClick={() => {
                            setfeedbackToDelete(item.feedback_id);
                            setShowDeleteModal(true);
                          }}
                          disabled={loading}
                        >
                          <FaTrash className={styles.deleteIcon} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className={styles.emptyRow}>
                    <td colSpan="7" className={styles.noResults}>
                      {loading
                        ? "Loading feedback..."
                        : "No feedback found matching your criteria"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.paginationButton}
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || loading}
              >
                <FaChevronLeft className={styles.paginationIcon} />
                Previous
              </button>
              <div className={styles.pageInfo}>
                Page {currentPage} of {totalPages} ({totalCount} total)
              </div>
              <button
                className={styles.paginationButton}
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || loading}
              >
                Next
                <FaChevronRight className={styles.paginationIcon} />
              </button>
            </div>
          )}

          {/* Feedback Detail Modal */}
          {isModalOpen && selectedFeedback && (
            <div className={styles.modalOverlay} onClick={closeModal}>
              <div
                className={styles.modalContent}
                onClick={(e) => e.stopPropagation()}
              >
                <button className={styles.modalClose} onClick={closeModal}>
                  <FaTimes />
                </button>

                <h3 className={styles.modalTitle}>
                  {selectedFeedback.feedback_title || "Feedback Details"}
                </h3>

                <div className={styles.modalGrid}>
                  <div className={styles.modalSection}>
                    <h4 className={styles.modalSubtitle}>
                      <FaUser className={styles.modalIcon} />
                      From
                    </h4>
                    <p>{selectedFeedback.user?.user?.user_name || "Unknown"}</p>
                  </div>

                  <div className={styles.modalSection}>
                    <h4 className={styles.modalSubtitle}>
                      <FaTag className={styles.modalIcon} />
                      Category
                    </h4>
                    <p>{selectedFeedback.displayCategory}</p>
                  </div>

                  <div className={styles.modalSection}>
                    <h4 className={styles.modalSubtitle}>
                      <FaStar className={styles.modalIcon} />
                      Rating
                    </h4>
                    <div className={styles.modalRating}>
                      {renderStars(selectedFeedback.feedback_rating)}
                    </div>
                  </div>

                  <div className={styles.modalSection}>
                    <h4 className={styles.modalSubtitle}>
                      <FaCalendarAlt className={styles.modalIcon} />
                      Submitted
                    </h4>
                    <p>
                      {new Date(selectedFeedback.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className={styles.modalSection}>
                  <h4 className={styles.modalSubtitle}>Full Message</h4>
                  <div className={styles.feedbackMessageContainer}>
                    <div className={styles.feedbackMessage}>
                      {selectedFeedback.feedback_message}
                    </div>
                  </div>
                </div>

                <div className={styles.modalFooter}>
                  <button
                    className={styles.modalDeleteButton}
                    onClick={handleDeleteFromModal}
                    disabled={loading}
                  >
                    <FaTrash className={styles.modalDeleteIcon} />
                    {loading ? "Deleting..." : "Delete Feedback"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default ViewFeedback;
