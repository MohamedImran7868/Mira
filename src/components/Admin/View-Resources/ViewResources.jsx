import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../AuthContext";
import Header from "../../Common/Header.jsx";
import styles from "./ViewResources.module.css";
import { MdAttachEmail, MdSearch } from "react-icons/md";
import { FaClock } from "react-icons/fa6";

function ViewResources() {
  const { userProfile, getResources, deleteResource } = useAuth();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [resourceType, setResourceType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  // Load resources
  useEffect(() => {
    fetchResources();
  }, [currentPage, resourceType, searchQuery]);

  const fetchResources = async () => {
    setLoading(true);
    setError(null);
    try {
      const type = resourceType === "all" ? undefined : resourceType;
      const { data, totalPages } = await getResources(
        currentPage,
        type,
        searchQuery
      );
      setResources(data);
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
    fetchResources();
  };

  const handleDelete = async (resourceId) => {
    if (!window.confirm("Are you sure you want to delete this resource?")) {
      return;
    }

    setLoading(true);
    try {
      await deleteResource(resourceId);
      await fetchResources();
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
            <div className={styles.searchGroup}>
              <MdSearch className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>
          </form>

          <div className={styles.filterGroup}>
            <label className={styles.type}>Type:</label>
            <select
              value={resourceType}
              onChange={(e) => {
                setResourceType(e.target.value);
                setCurrentPage(1);
              }}
              className={styles.typeSelect}
            >
              <option value="all">All</option>
              <option value="association">Association</option>
              <option value="consultant">Consultant</option>
            </select>
          </div>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.resourcesList}>
          {resources.length > 0 ? (
            resources.map((resource) => (
              <div key={resource.resourceid} className={styles.resourceItem}>
                <span className={styles.resourceName}>
                  {resource.resource_name}
                </span>
                <span className={styles.resourceDesc}>
                  {resource.resource_details}
                </span>
                <div className={styles.resourceDetails}>
                  <span className={styles.resourceContact}>
                    <MdAttachEmail /> {resource.resource_contact}
                  </span>
                  {resource.resource_time && (
                    <span className={styles.resourceTime}>
                      <FaClock /> {resource.resource_time}
                    </span>
                  )}
                </div>
                {userProfile?.role === "admin" && (
                  <div className={styles.btnContainer}>
                    <button
                      className={styles.editBtn}
                      onClick={() =>
                        navigate(`/edit-resources/${resource.resourceid}`)
                      }
                    >
                      Edit
                    </button>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => handleDelete(resource.resourceid)}
                      disabled={loading}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className={styles.noResults}>
              {loading ? "Loading..." : "No resources found"}
            </div>
          )}
        </div>

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

        {userProfile?.role === "admin" && (
          <div className={styles.bottomContainer}>
            <button
              className={styles.addBtn}
              onClick={() => navigate("/add-resources")}
            >
              Add Resource
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default ViewResources;
