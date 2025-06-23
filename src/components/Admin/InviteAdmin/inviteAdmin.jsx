import { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useInvitationsSubscription } from "../../../realtime/invitations";
import Header from "../../Common/Header";
import styles from "./inviteAdmin.module.css";
import {
  FaEnvelope,
  FaSearch,
  FaPaperPlane,
  FaCheckCircle,
  FaClock,
  FaExclamationCircle,
  FaSpinner,
  FaSort,
  FaSortUp,
  FaSortDown,
} from "react-icons/fa";

const InviteAdmin = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState({ text: "", isError: false });
  const [isLoading, setIsLoading] = useState(false);
  const [invitations, setInvitations] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { inviteAdmin, fetchInvitations, user } = useAuth();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    user?.super_admin !== "yes" && window.location.replace("/401-unauthorized");
  });

  // Sorting state
  const [sortConfig, setSortConfig] = useState({
    field: "sent_at",
    order: "desc",
  });

  const loadInvitations = async () => {
    setIsLoading(true);
    try {
      const { invitations: data, totalCount: count } = await fetchInvitations(
        currentPage,
        sortConfig.field,
        sortConfig.order
      );
      setInvitations(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error("Error fetching invitations:", error);
      setMessage({
        text: "Failed to load invitations. Please try again later.",
        isError: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle real-time updates
  useInvitationsSubscription(loadInvitations);

  // Load invitations when page, sort, or search changes
  useEffect(() => {
    loadInvitations();
  }, [currentPage, sortConfig, searchTerm]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: "", isError: false });

    if (!email) {
      setMessage({ text: "Please enter an email", isError: true });
      setIsLoading(false);
      return;
    }

    const { error } = await inviteAdmin(email);

    if (error) {
      setMessage({
        text: "An invitation has already been sent to this email. Please inform the owner to check their email.",
        isError: true,
      });
    } else {
      setMessage({
        text: "Admin invited successfully! An invitation has been sent to the email.",
        isError: false,
      });
      setEmail("");
      // Refresh the first page after new invitation
      setCurrentPage(1);
      loadInvitations();
    }

    setIsLoading(false);
  };

  const requestSort = (field) => {
    const order =
      sortConfig.field === field && sortConfig.order === "asc" ? "desc" : "asc";
    setSortConfig({ field, order });
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  const getStatusBadge = (status) => {
    const statusIcons = {
      sent: <FaPaperPlane className={styles.statusIcon} />,
      registered: <FaCheckCircle className={styles.statusIcon} />,
      expired: <FaExclamationCircle className={styles.statusIcon} />,
    };

    const statusClasses = {
      sent: styles.statusSent,
      registered: styles.statusRegistered,
      expired: styles.statusExpired,
    };

    const statusName = {
      sent: "Sent",
      registered: "Registered",
      expired: "Expired",
    };

    return (
      <div className={`${styles.statusBadge} ${statusClasses[status] || ""}`}>
        {statusIcons[status]}
        <span>{statusName[status]}</span>
      </div>
    );
  };

  const getSortIcon = (field) => {
    if (sortConfig.field !== field)
      return <FaSort className={styles.sortIcon} />;
    return sortConfig.order === "asc" ? (
      <FaSortUp className={styles.sortIcon} />
    ) : (
      <FaSortDown className={styles.sortIcon} />
    );
  };

  // Filter locally for search (since we're fetching only 10 at a time)
  const filteredInvitations = invitations.filter((invite) =>
    invite.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <>
      <Header />
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h2>Invite New Administrator</h2>
            <p className={styles.subtitle}>
              Send an invitation to grant admin privileges to a new user
            </p>
          </div>

          {message.text && (
            <div
              className={`${styles.message} ${message.isError ? styles.error : styles.success}`}
            >
              <div className={styles.messageIcon}>
                {message.isError ? <FaExclamationCircle /> : <FaCheckCircle />}
              </div>
              <div>{message.text}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>
                <FaEnvelope className={styles.inputIcon} />
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter admin email address"
                required
                className={styles.input}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={styles.button}
            >
              <FaPaperPlane className={styles.buttonIcon} />
              Send Admin Invite
            </button>
          </form>
        </div>

        <div className={styles.tableSection}>
          <div className={styles.tableHeader}>
            <h3>Sent Invitations</h3>
            <div className={styles.searchContainer}>
              <FaSearch className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search invitations by email..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className={styles.searchInput}
              />
            </div>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.invitationsTable}>
              <thead>
                <tr>
                  <th onClick={() => requestSort("email")}>
                    <div className={styles.sortableHeader}>
                      Email
                      {getSortIcon("email")}
                    </div>
                  </th>
                  <th onClick={() => requestSort("status")}>
                    <div className={styles.sortableHeader}>
                      Status
                      {getSortIcon("status")}
                    </div>
                  </th>
                  <th onClick={() => requestSort("sent_at")}>
                    <div className={styles.sortableHeader}>
                      Sent At
                      {getSortIcon("sent_at")}
                    </div>
                  </th>
                  <th onClick={() => requestSort("accepted_at")}>
                    <div className={styles.sortableHeader}>
                      Accepted At
                      {getSortIcon("accepted_at")}
                    </div>
                  </th>
                  <th onClick={() => requestSort("expires_at")}>
                    <div className={styles.sortableHeader}>
                      Expires At
                      {getSortIcon("expires_at")}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="5" className={styles.loadingRow}>
                      <FaSpinner className={styles.spinner} />
                      Loading invitations...
                    </td>
                  </tr>
                ) : filteredInvitations.length > 0 ? (
                  filteredInvitations.map((invite) => (
                    <tr key={invite.id}>
                      <td className={styles.emailCell}>{invite.email}</td>
                      <td>{getStatusBadge(invite.status)}</td>
                      <td>
                        <div className={styles.dateCell}>
                          <FaClock className={styles.dateIcon} />
                          {formatDate(invite.sent_at)}
                        </div>
                      </td>
                      <td>
                        <div className={styles.dateCell}>
                          {invite.accepted_at ? (
                            <>
                              <FaClock className={styles.dateIcon} />
                              {formatDate(invite.accepted_at)}
                            </>
                          ) : (
                            "N/A"
                          )}
                        </div>
                      </td>
                      <td>
                        <div className={styles.dateCell}>
                          <FaClock className={styles.dateIcon} />
                          {formatDate(invite.expires_at)}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className={styles.noResults}>
                      <div className={styles.noResultsContent}>
                        <FaEnvelope className={styles.noResultsIcon} />
                        <h4>No invitations found</h4>
                        <p>
                          {searchTerm
                            ? "Try a different search term"
                            : "Invitations you send will appear here"}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className={styles.paginationControls}>
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || isLoading}
                className={styles.paginationButton}
              >
                Previous
              </button>

              <span className={styles.pageInfo}>
                Page {currentPage} of {totalPages} • {totalCount} total
                invitations
              </span>

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages || isLoading}
                className={styles.paginationButton}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default InviteAdmin;
