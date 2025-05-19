import { useState, useEffect } from "react";
import { useAuth } from "../../../AuthContext";
import Header from "../../Common/Header";
import styles from "./ManageUser.module.css";
import LoadingModal from "../../Common/LoadingModal";

function ManageUser() {
  const { getStudents, deleteStudent } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);

  // Load initial students
  useEffect(() => {
    fetchStudents();
  }, [currentPage]);

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
    setCurrentPage(1); // Reset to first page when searching
    fetchStudents(searchTerm);
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this student?")) {
      return;
    }

    setLoading(true);
    try {
      await deleteStudent(userId);
      // Refresh the current page
      await fetchStudents(searchTerm);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <>
      <Header />
      <div className={styles.container}>
        <div className={styles.topContainer}>
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <label className={styles.label}>Search Students:</label>
            <input
              type="text"
              className={styles.input}
              placeholder="Search by name or email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              className={styles.searchBtn}
              type="submit"
              disabled={loading}
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </form>
          <div className={styles.resultsCount}>
            Showing {students.length} of {totalStudents} students
          </div>
        </div>

        {error && <div className={styles.error}>Error: {error}</div>}

        {loading && <LoadingModal message="Loading..." />}

        <div className={styles.tableContainer}>
          <table className={styles.userTable}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {students.length > 0 ? (
                students.map((user) => (
                  <tr key={user.userID}>
                    <td>{user.user_name || "N/A"}</td>
                    <td>{user.user_email}</td>
                    <td>{user.students[0]?.status || "N/A"}</td>
                    <td>
                      <button
                        className={styles.deleteBtn}
                        onClick={() => handleDelete(user.userID)}
                        disabled={loading}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className={styles.noResults}>
                    {searchTerm
                      ? "No matching students found"
                      : "No students available"}
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
                Page {currentPage} of {totalPages}
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

export default ManageUser;
