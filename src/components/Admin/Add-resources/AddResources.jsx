import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../../AuthContext";
import Header from "../../Common/Header";
import styles from "./AddResources.module.css";
import LoadingModal from "../../Common/LoadingModal";

function AddResources() {
  const { userProfile, addResource } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    resource_type: "association",
    resource_name: "",
    resource_details: "",
    resource_contact: "",
    resource_time: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await addResource({
        adminid: userProfile.adminid,
        resource_type: formData.resource_type,
        resource_name: formData.resource_name,
        resource_details: formData.resource_details,
        resource_contact: formData.resource_contact,
        resource_time: formData.resource_time,
      });
      navigate("/view-resources");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className={styles.container}>
        <div className={styles.topContainer}>
          <label className={styles.type}>Type:</label>
          <select
            name="resource_type"
            value={formData.resource_type}
            onChange={handleChange}
            className={styles.typeSelect}
          >
            <option value="association">Association</option>
            <option value="consultant">Consultant</option>
          </select>
        </div>

        {error && <div className={styles.error}>{error}</div>}
        {loading && <LoadingModal message="Saving..." />}

        <div className={styles.formContainer}>
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.details}>
              <div>
                <label className={styles.label}>Name:</label>
                <input
                  type="text"
                  name="resource_name"
                  value={formData.resource_name}
                  onChange={handleChange}
                  className={styles.input}
                  required
                />
              </div>
              <div>
                <label className={styles.label}>Contact:</label>
                <input
                  type="text"
                  name="resource_contact"
                  value={formData.resource_contact}
                  onChange={handleChange}
                  className={styles.input}
                  required
                />
              </div>
              <div>
                <label className={styles.label}>Time:</label>
                <input
                  type="text"
                  name="resource_time"
                  value={formData.resource_time}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="e.g., 9:00 AM - 5:00 PM"
                  required
                />
              </div>
            </div>

            <label className={styles.label}>Description:</label>
            <textarea
              name="resource_details"
              value={formData.resource_details}
              onChange={handleChange}
              className={styles.textarea}
              maxLength="1000"
              required
            />

            <div className={styles.btnContainer}>
              <button
                type="button"
                className={styles.backBtn}
                onClick={() => navigate(-1)}
                disabled={loading}
              >
                Back
              </button>
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={loading}
              >
                {loading ? "Submitting..." : "Submit"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default AddResources;
