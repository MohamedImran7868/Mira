import { useState, useEffect } from "react";
import { useAuth } from "../../../AuthContext";
import Header from "../../Common/Header";
import styles from "./ManageUser.module.css";
import LoadingModal from "../../Common/LoadingModal";
import {
  FaSearch,
  FaTrash,
  FaChevronLeft,
  FaChevronRight,
  FaUser,
  FaEnvelope,
  FaInfoCircle,
} from "react-icons/fa";
import DeleteConfirmation from "../../Common/DeleteConfirmation";

function ManageUser() {
  const { getStudents, deleteStudent } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);

  // Delete Confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, [currentPage, searchTerm]);

  const fetchStudents = async (searchQuery = "") => {
    setLoading(true);
    setError(null);
    try {
      const { students, totalCount, totalPages } = await getStudents(
        currentPage,
        searchQuery
      );
      setStudents(students);
      setTotalStudents(totalCount);
      setTotalPages(totalPages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchStudents(searchTerm);
  };

  const handleDelete = async (userToDelete) => {
    setLoading(true);
    try {
      await deleteStudent(userToDelete);
      await fetchStudents();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <>
      <DeleteConfirmation
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => handleDelete(userToDelete)}
        title="Delete Resource"
        message="Are you sure you want to delete this resource? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />
      <Header />
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h2>Manage Students</h2>
            <p>View and manage all registered students</p>
          </div>

          <div className={styles.searchSection}>
            <form onSubmit={handleSearch} className={styles.searchForm}>
              <div className={styles.searchInputContainer}>
                <FaSearch className={styles.searchIcon} />
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button
                  className={styles.searchButton}
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Searching..." : "Search"}
                </button>
              </div>
            </form>
            <div className={styles.resultsInfo}>
              <span className={styles.resultsCount}>
                Showing {students.length} of {totalStudents} students
              </span>
            </div>
          </div>

          {error && (
            <div className={styles.errorMessage}>
              <FaInfoCircle className={styles.errorIcon} />
              {error}
            </div>
          )}

          {loading && <LoadingModal message="Loading students..." />}

          <div className={styles.tableWrapper}>
            <table className={styles.userTable}>
              <thead>
                <tr>
                  <th className={styles.nameHeader}>
                    <FaUser className={styles.headerIcon} />
                    Name
                  </th>
                  <th className={styles.emailHeader}>
                    <FaEnvelope className={styles.headerIcon} />
                    Email
                  </th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.length > 0 ? (
                  students.map((user) => (
                    <tr key={user.userID} className={styles.userRow}>
                      <td className={styles.nameCell}>
                        {user.user_name || "N/A"}
                      </td>
                      <td className={styles.emailCell}>{user.user_email}</td>
                      <td>
                        <span
                          className={`${styles.statusBadge} ${
                            user.students[0]?.status === "active"
                              ? styles.active
                              : styles.inactive
                          }`}
                        >
                          {user.students[0]?.status || "N/A"}
                        </span>
                      </td>
                      <td className={styles.actionsCell}>
                        <button
                          className={styles.deleteButton}
                          onClick={() => {
                            setUserToDelete(user.userID);
                            setShowDeleteModal(true);
                          }}
                          disabled={loading}
                        >
                          <FaTrash className={styles.deleteIcon} />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className={styles.emptyRow}>
                    <td colSpan="4" className={styles.noResults}>
                      {searchTerm
                        ? "No matching students found"
                        : "No students available"}
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
                Page {currentPage} of {totalPages}
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
        </div>
      </div>
    </>
  );
}

export default ManageUser;
