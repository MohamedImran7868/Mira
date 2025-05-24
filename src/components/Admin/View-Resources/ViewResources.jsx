import { useState, useEffect } from "react";
import { useAuth } from "../../../AuthContext";
import Header from "../../Common/Header.jsx";
import styles from "./ViewResources.module.css";
import {
  MdAttachEmail,
  MdSearch,
  MdAdd,
  MdEdit,
  MdDelete,
  MdAccessTime,
  MdClose,
} from "react-icons/md";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import DeleteConfirmation from "../../Common/DeleteConfirmation.jsx";

function ViewResources() {
  const {
    userProfile,
    getResources,
    addResource,
    updateResource,
    deleteResource,
  } = useAuth();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [resourceType, setResourceType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Delete Confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState(null);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentResource, setCurrentResource] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    resource_type: "association",
    resource_name: "",
    resource_details: "",
    resource_contact: "",
    resource_time: "",
  });

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

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchResources();
  };

  const handleDelete = async (resourceId) => {
    setLoading(true);
    try {
      await deleteResource(resourceId);
      await fetchResources();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
    }
  };

  const openAddModal = () => {
    setFormData({
      resource_type: "association",
      resource_name: "",
      resource_details: "",
      resource_contact: "",
      resource_time: "",
    });
    setShowAddModal(true);
  };

  const openEditModal = (resource) => {
    setCurrentResource(resource);
    setFormData({
      resource_type: resource.resource_type,
      resource_name: resource.resource_name,
      resource_details: resource.resource_details,
      resource_contact: resource.resource_contact,
      resource_time: resource.resource_time || "",
    });
    setShowEditModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addResource({
        ...formData,
        adminid: userProfile.adminid,
      });
      setShowAddModal(false);
      await fetchResources();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateResource(currentResource.resourceid, formData);
      setShowEditModal(false);
      await fetchResources();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DeleteConfirmation
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => handleDelete(resourceToDelete)}
        title="Delete Resource"
        message="Are you sure you want to delete this resource? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />
      <Header />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Resources Management</h1>
          <p>View and manage available mental health resources</p>
        </div>

        <div className={styles.controls}>
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <div className={styles.searchGroup}>
              <MdSearch className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
              <button type="submit" className={styles.searchButton}>
                Search
              </button>
            </div>
          </form>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Filter by type:</label>
            <select
              value={resourceType}
              onChange={(e) => {
                setResourceType(e.target.value);
                setCurrentPage(1);
              }}
              className={styles.typeSelect}
            >
              <option value="all">All Resources</option>
              <option value="association">Associations</option>
              <option value="consultant">Consultants</option>
            </select>
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

        <div className={styles.resourcesGrid}>
          {resources.length > 0 ? (
            resources.map((resource) => (
              <div key={resource.resourceid} className={styles.resourceCard}>
                <div className={styles.resourceHeader}>
                  <span className={styles.resourceType}>
                    {resource.resource_type === "association"
                      ? "Association"
                      : "Consultant"}
                  </span>
                  {userProfile?.role === "admin" && (
                    <div className={styles.resourceActions}>
                      <button
                        onClick={() => openEditModal(resource)}
                        className={styles.editButton}
                      >
                        <MdEdit />
                      </button>
                      <button
                        onClick={() => {
                          setResourceToDelete(resource.resourceid);
                          setShowDeleteModal(true);
                        }}
                        className={styles.deleteButton}
                        disabled={loading}
                      >
                        <MdDelete />
                      </button>
                    </div>
                  )}
                </div>
                <h3 className={styles.resourceName}>
                  {resource.resource_name}
                </h3>
                <p className={styles.resourceDesc}>
                  {resource.resource_details}
                </p>
                <div className={styles.resourceMeta}>
                  <div className={styles.metaItem}>
                    <MdAttachEmail className={styles.metaIcon} />
                    <span>{resource.resource_contact}</span>
                  </div>
                  {resource.resource_time && (
                    <div className={styles.metaItem}>
                      <MdAccessTime className={styles.metaIcon} />
                      <span>{resource.resource_time}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className={styles.noResults}>
              {loading ? (
                <div className={styles.loading}>Loading resources...</div>
              ) : (
                <>
                  <div className={styles.noResultsIcon}>📭</div>
                  <h3>No resources found</h3>
                  <p>Try adjusting your search or filters</p>
                </>
              )}
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || loading}
              className={styles.pageButton}
            >
              <FaChevronLeft />
            </button>
            <span className={styles.pageInfo}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || loading}
              className={styles.pageButton}
            >
              <FaChevronRight />
            </button>
          </div>
        )}

        {userProfile?.role === "admin" && (
          <button className={styles.addButton} onClick={openAddModal}>
            <MdAdd className={styles.addIcon} />
            Add New Resource
          </button>
        )}
      </div>

      {/* Add Resource Modal */}
      {showAddModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Add New Resource</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className={styles.closeButton}
              >
                <MdClose />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className={styles.modalForm}>
              <div className={styles.formRow}>
                <label className={styles.formLabel}>Resource Type</label>
                <select
                  name="resource_type"
                  value={formData.resource_type}
                  onChange={handleFormChange}
                  className={styles.formSelect}
                  required
                >
                  <option value="association">Association</option>
                  <option value="consultant">Consultant</option>
                </select>
              </div>

              <div className={styles.formRow}>
                <label className={styles.formLabel}>Resource Name</label>
                <input
                  type="text"
                  name="resource_name"
                  value={formData.resource_name}
                  onChange={handleFormChange}
                  className={styles.formInput}
                  required
                  placeholder="Enter resource name"
                />
              </div>

              <div className={styles.formRow}>
                <label className={styles.formLabel}>Contact Information</label>
                <input
                  type="text"
                  name="resource_contact"
                  value={formData.resource_contact}
                  onChange={handleFormChange}
                  className={styles.formInput}
                  required
                  placeholder="Email or phone number"
                />
              </div>

              <div className={styles.formRow}>
                <label className={styles.formLabel}>
                  Availability (Optional)
                </label>
                <input
                  type="text"
                  name="resource_time"
                  value={formData.resource_time}
                  onChange={handleFormChange}
                  className={styles.formInput}
                  placeholder="e.g., 9:00 AM - 5:00 PM"
                />
              </div>

              <div className={styles.formRow}>
                <label className={styles.formLabel}>Description</label>
                <textarea
                  name="resource_details"
                  value={formData.resource_details}
                  onChange={handleFormChange}
                  className={styles.formTextarea}
                  required
                  rows="4"
                  placeholder="Provide details about this resource"
                />
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={styles.submitButton}
                >
                  {loading ? "Saving..." : "Save Resource"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Resource Modal */}
      {showEditModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Edit Resource</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className={styles.closeButton}
              >
                <MdClose />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className={styles.modalForm}>
              <div className={styles.formRow}>
                <label className={styles.formLabel}>Resource Type</label>
                <select
                  name="resource_type"
                  value={formData.resource_type}
                  onChange={handleFormChange}
                  className={styles.formSelect}
                  required
                >
                  <option value="association">Association</option>
                  <option value="consultant">Consultant</option>
                </select>
              </div>

              <div className={styles.formRow}>
                <label className={styles.formLabel}>Resource Name</label>
                <input
                  type="text"
                  name="resource_name"
                  value={formData.resource_name}
                  onChange={handleFormChange}
                  className={styles.formInput}
                  required
                />
              </div>

              <div className={styles.formRow}>
                <label className={styles.formLabel}>Contact Information</label>
                <input
                  type="text"
                  name="resource_contact"
                  value={formData.resource_contact}
                  onChange={handleFormChange}
                  className={styles.formInput}
                  required
                />
              </div>

              <div className={styles.formRow}>
                <label className={styles.formLabel}>
                  Availability (Optional)
                </label>
                <input
                  type="text"
                  name="resource_time"
                  value={formData.resource_time}
                  onChange={handleFormChange}
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formRow}>
                <label className={styles.formLabel}>Description</label>
                <textarea
                  name="resource_details"
                  value={formData.resource_details}
                  onChange={handleFormChange}
                  className={styles.formTextarea}
                  required
                  rows="4"
                />
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={styles.submitButton}
                >
                  {loading ? "Updating..." : "Update Resource"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default ViewResources;
