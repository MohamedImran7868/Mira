import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import pp from '../../assets/imran.jpg'
import Header from '../Header';
import styles from './Profile.module.css';

const Profile = () => {
  const { getUserProfile, updateProfile, updatePassword, uploadProfileImage } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    specialChar: false
  });
  const [passwordsMatch, setPasswordsMatch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Fetch user profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await getUserProfile();
        setProfile(data);
        setEditData({
          name: data.user_name,
          email: data.user_email,
          birthday: data.student_birthday,
          age: data.student_age
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [getUserProfile]);

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (isEditing) {
      // Reset password fields when exiting edit mode
      setPasswordData({
        newPassword: '',
        confirmPassword: ''
      });
    }
  };

  // Handle Input Change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  // Handle Password Change
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));

    // Check password requirements
    if (name === 'newPassword') {
      setPasswordRequirements({
        length: value.length >= 8,
        uppercase: /[A-Z]/.test(value),
        lowercase: /[a-z]/.test(value),
        number: /[0-9]/.test(value),
        specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(value)
      });
    }

    // Check if passwords match
    if (name === 'confirmPassword' || (name === 'newPassword' && passwordData.confirmPassword)) {
      setPasswordsMatch(value === (name === 'newPassword' ? passwordData.confirmPassword : passwordData.newPassword));
    }
  };

  // handle Image Upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.match('image.*')) {
      setError('Please select an image file');
      return;
    }

    try {
      setLoading(true);
      const imageUrl = await uploadProfileImage(file);
      setProfile(prev => ({ ...prev, user_image: imageUrl }));
      setSuccess('Profile image updated successfully');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Submit the form
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Update profile data
      await updateProfile(editData);

      // Update password if provided
      if (passwordData.newPassword) {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
          throw new Error('Passwords do not match');
        }
        await updatePassword(passwordData.newPassword);
      }

      setSuccess('Profile updated successfully');
      setIsEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !profile) {
    return <div>Loading profile...</div>;
  }

  if (!profile) {
    return <div>No profile data available</div>;
  }

  return (
    <>
      <Header />
      <div className={styles.container}>
        <div className={styles.profileCard}>
          <div className={styles.profileHeader}>
            <div className={styles.imageContainer}>
              <img 
                src={pp} 
                alt="Profile" 
                className={styles.profileImage} 
              />
              {isEditing && (
                <div className={styles.imageUpload}>
                  <input
                    type="file"
                    id="profileImage"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="profileImage" className={styles.uploadBtn}>
                    Upload Image
                  </label>
                </div>
              )}
            </div>
            {isEditing ? (
              <input
                type="text"
                name="name"
                value={editData.name}
                onChange={handleInputChange}
                className={styles.editName}
              />
            ) : (
              <h2 className={styles.profileName}>{profile.user_name}</h2>
            )}
          </div>
          
          <div className={styles.profileInfo}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Birthday:</span>
              {isEditing ? (
                <input
                  type="date"
                  name="birthday"
                  value={editData.birthday}
                  onChange={handleInputChange}
                  className={styles.editField}
                />
              ) : (
                <span className={styles.infoValue}>
                  {new Date(profile.student_birthday).toLocaleDateString()}
                </span>
              )}
            </div>

            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Age:</span>
              {isEditing ? (
                <input
                  type="number"
                  name="age"
                  value={editData.age}
                  onChange={handleInputChange}
                  className={styles.editField}
                />
              ) : (
                <span className={styles.infoValue}>{profile.student_age}</span>
              )}
            </div>
            
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Email:</span>
              {isEditing ? (
                <input
                  type="email"
                  name="email"
                  value={editData.email}
                  onChange={handleInputChange}
                  className={styles.editField}
                />
              ) : (
                <span className={styles.infoValue}>{profile.user_email}</span>
              )}
            </div>

            {isEditing && (
              <>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>New Password:</span>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className={styles.editField}
                    placeholder="Leave blank to keep current"
                  />
                </div>

                {passwordData.newPassword && (
                  <div className={styles.passwordRequirements}>
                    <p>Password must contain:</p>
                    <ul>
                      <li className={passwordRequirements.length ? styles.valid : ''}>
                        At least 8 characters
                      </li>
                      <li className={passwordRequirements.uppercase ? styles.valid : ''}>
                        At least one uppercase letter
                      </li>
                      <li className={passwordRequirements.lowercase ? styles.valid : ''}>
                        At least one lowercase letter
                      </li>
                      <li className={passwordRequirements.number ? styles.valid : ''}>
                        At least one number
                      </li>
                      <li className={passwordRequirements.specialChar ? styles.valid : ''}>
                        At least one special character
                      </li>
                    </ul>
                  </div>
                )}

                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Confirm Password:</span>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className={`${styles.editField} ${passwordData.confirmPassword && !passwordsMatch ? styles.invalid : ''}`}
                    placeholder="Confirm new password"
                  />
                </div>
              </>
            )}
          </div>
          
          {error && <div className={styles.errorMessage}>{error}</div>}
          {success && <div className={styles.successMessage}>{success}</div>}

          <div className={styles.buttonGroup}>
            <button 
              className={styles.editBtn}
              onClick={handleEditToggle}
              disabled={loading}
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
            
            {isEditing && (
              <button 
                className={styles.saveBtn}
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;