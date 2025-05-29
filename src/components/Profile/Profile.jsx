import React, { useState, useEffect } from "react";
import { useAuth } from "../../AuthContext";
import Header from "../Common/Header";
import styles from "./Profile.module.css";
import LoadingModal from "../Common/LoadingModal";
import { FaEye, FaEyeSlash, FaUser, FaEnvelope, FaLock, FaEdit, FaTimes, FaSave, FaCamera, FaIdCard } from "react-icons/fa";

const Profile = () => {
  const {
    updateProfile,
    updatePassword,
    uploadProfileImage,
    getImageUrl,
    userProfile,
  } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [imageUrl, setImageUrl] = useState(null);
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  // Password Change Handle
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    specialChar: false,
  });
  const [passwordsMatch, setPasswordsMatch] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Messages State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Fetch user profile on mount
  useEffect(() => {
    if (userProfile) {
      setEditData({
        name: userProfile.user_name,
        email: userProfile.user_email,
        id: userProfile.id,
      });
      setImageUrl(getImageUrl(userProfile.user_image));
    }
  }, [userProfile]);

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (isEditing) {
      setPasswordData({
        newPassword: "",
        confirmPassword: "",
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Validate ID field to only accept digits and limit to 10 characters
    if (name === "id") {
      if (value === "" || (/^\d+$/.test(value) && value.length <= 10)) {
        setEditData(prev => ({ ...prev, [name]: value }));
      }
      return;
    }
    
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));

    if (name === "newPassword") {
      setPasswordRequirements({
        length: value.length >= 8,
        uppercase: /[A-Z]/.test(value),
        lowercase: /[a-z]/.test(value),
        number: /[0-9]/.test(value),
        specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(value),
      });
    }

    if (
      name === "confirmPassword" ||
      (name === "newPassword" && passwordData.confirmPassword)
    ) {
      setPasswordsMatch(value === passwordData.newPassword);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.match("image.*")) {
      setError("Please select a valid image file (JPEG, PNG, etc.)");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Image size must be less than 2MB");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const imageUrl = await uploadProfileImage(file);
      setImageUrl(getImageUrl(imageUrl));
      setSuccess("Profile image updated successfully!");
    } catch (err) {
      setError(err.message || "Failed to upload image");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Validate ID length if editing
      if (isEditing && editData.id?.length !== 10) {
        throw new Error("ID must be exactly 10 digits");
      }

      await updateProfile(editData);

      if (passwordData.newPassword) {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
          throw new Error("Passwords do not match");
        }
        await updatePassword(passwordData.newPassword);
      }

      setSuccess("Profile updated successfully");
      setIsEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!userProfile) {
    return <LoadingModal message="Loading Profile..." />;
  }

  if (loading) {
    return <LoadingModal message="Updating Profile..." />;
  }

  return (
    <>
      <Header />
      <div className={styles.container}>
        <div className={styles.profileCard}>
          <div className={styles.profileHeader}>
            <div className={styles.imageContainer}>
              <div className={styles.imageWrapper}>
                <img
                  src={imageUrl}
                  alt="Profile"
                  className={styles.profileImage}
                />
                {isEditing && (
                  <div className={styles.imageUploadOverlay}>
                    <input
                      type="file"
                      id="profileImage"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ display: "none" }}
                    />
                    <label htmlFor="profileImage" className={styles.uploadBtn}>
                      <FaCamera className={styles.cameraIcon} />
                      Update Photo
                    </label>
                  </div>
                )}
              </div>
            </div>
            {isEditing ? (
              <div className={styles.editNameContainer}>
                <div className={styles.inputWithIcon}>
                  <FaUser className={styles.inputIcon} />
                  <input
                    type="text"
                    name="name"
                    value={editData.name}
                    onChange={handleInputChange}
                    className={styles.editName}
                    placeholder="Your name"
                  />
                </div>
              </div>
            ) : (
              <div className={styles.nameContainer}>
                <h2 className={styles.profileName}>{userProfile?.user_name}</h2>
                <span className={styles.profileEmail}>
                  <FaEnvelope className={styles.emailIcon} />
                  {userProfile?.user_email}
                </span>
              </div>
            )}
          </div>

          <div className={styles.profileContent}>
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>
                <FaUser className={styles.sectionIcon} />
                Personal Information
              </h3>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <label className={styles.infoLabel}>
                    <FaIdCard className={styles.fieldIcon} />
                    ID Number
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="id"
                      value={editData.id}
                      onChange={handleInputChange}
                      className={styles.editField}
                      placeholder="10-digit ID"
                      maxLength="10"
                      pattern="\d{10}"
                      inputMode="numeric"
                    />
                  ) : (
                    <span className={styles.infoValue}>
                      {userProfile?.id}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {isEditing && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  <FaLock className={styles.sectionIcon} />
                  Change Password
                </h3>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <label className={styles.infoLabel}>New Password</label>
                    <div className={styles.passwordInputContainer}>
                      <input
                        type={showPassword ? "text" : "password"}
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        className={styles.editField}
                        placeholder="Leave blank to keep current"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className={styles.toggleBtn}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>

                  <div className={styles.infoItem}>
                    <label className={styles.infoLabel}>Confirm Password</label>
                    <div className={styles.passwordInputContainer}>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        className={`${styles.editField} ${
                          passwordData.confirmPassword && !passwordsMatch
                            ? styles.invalid
                            : ""
                        }`}
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className={styles.toggleBtn}
                        aria-label={
                          showConfirmPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>
                </div>

                {passwordData.newPassword && (
                  <div className={styles.passwordRequirements}>
                    <h4>Password Requirements:</h4>
                    <ul className={styles.requirementsList}>
                      <li
                        className={
                          passwordRequirements.length ? styles.valid : ""
                        }
                      >
                        <span className={styles.checkmark}>
                          {passwordRequirements.length ? "✓" : "✗"}
                        </span>
                        At least 8 characters
                      </li>
                      <li
                        className={
                          passwordRequirements.uppercase ? styles.valid : ""
                        }
                      >
                        <span className={styles.checkmark}>
                          {passwordRequirements.uppercase ? "✓" : "✗"}
                        </span>
                        At least one uppercase letter
                      </li>
                      <li
                        className={
                          passwordRequirements.lowercase ? styles.valid : ""
                        }
                      >
                        <span className={styles.checkmark}>
                          {passwordRequirements.lowercase ? "✓" : "✗"}
                        </span>
                        At least one lowercase letter
                      </li>
                      <li
                        className={
                          passwordRequirements.number ? styles.valid : ""
                        }
                      >
                        <span className={styles.checkmark}>
                          {passwordRequirements.number ? "✓" : "✗"}
                        </span>
                        At least one number
                      </li>
                      <li
                        className={
                          passwordRequirements.specialChar ? styles.valid : ""
                        }
                      >
                        <span className={styles.checkmark}>
                          {passwordRequirements.specialChar ? "✓" : "✗"}
                        </span>
                        At least one special character
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className={styles.feedbackContainer}>
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
            {success && (
              <div className={styles.successMessage}>
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
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                {success}
              </div>
            )}
          </div>

          <div className={styles.buttonGroup}>
            <button
              className={`${styles.actionBtn} ${styles.editBtn}`}
              onClick={handleEditToggle}
              disabled={loading}
            >
              {isEditing ? (
                <>
                  <FaTimes className={styles.buttonIcon} />
                  Cancel
                </>
              ) : (
                <>
                  <FaEdit className={styles.buttonIcon} />
                  Edit Profile
                </>
              )}
            </button>

            {isEditing && (
              <button
                className={`${styles.actionBtn} ${styles.saveBtn}`}
                onClick={handleSubmit}
                disabled={loading}
              >
                <FaSave className={styles.buttonIcon} />
                {loading ? "Saving..." : "Save Changes"}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;