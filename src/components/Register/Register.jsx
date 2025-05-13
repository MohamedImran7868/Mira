import React, { useState, useEffect } from "react";
import Header from "../Common/Header";
import { useNavigate } from "react-router-dom";
import styles from "./Register.module.css";
import { useAuth } from "../../AuthContext";
import LoadingModal from "../Common/LoadingModal";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    birthday: "",
    age: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { registerStudent } = useAuth();
  const navigate = useNavigate();

  // Date calculations
  const currentYear = new Date().getFullYear();
  const maxDate = `${currentYear - 18}-12-31`;
  const minDate = `${currentYear - 30}-01-01`;

  // Calculate age from birthday
  useEffect(() => {
    if (formData.birthday) {
      const birthDate = new Date(formData.birthday);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();

      setFormData((prev) => ({ ...prev, age: calculatedAge.toString() }));
    }
  }, [formData.birthday]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (parseInt(formData.age) < 18) {
      setError("You must be at least 18 years old to register");
      return;
    }

    /*if (formData.password != formData.confirmPassword) {
      setError("Password does not match");
      return;
    }*/

    setError(null);
    setLoading(true);

    try {
      await registerStudent(formData.email, formData.password, {
        name: formData.name,
        age: parseInt(formData.age),
        birthday: formData.birthday,
      });

      // Redirect to login with success message
      navigate("/login", { state: { registrationSuccess: true } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading){
    return <LoadingModal message="Registering account..." />;
  }

  return (
    <>
      <Header />
      <div className={styles.container}>
        <div className={styles.innerContainer}>
          <h2>Student Registration</h2>
          {error && <div className={styles.error}>{error}</div>}

          <form className={styles.inputContainer} onSubmit={handleSubmit}>
            <label className={styles.label}>Full Name:</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={styles.input}
              required
              disabled={loading}
            />

            <div className={styles.rowContainer}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Birth Date:</label>
                <input
                  type="date"
                  name="birthday"
                  value={formData.birthday}
                  onChange={handleChange}
                  className={styles.input}
                  required
                  disabled={loading}
                  max={maxDate}
                  min={minDate}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Age:</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  className={styles.input}
                  required
                  readOnly
                  min="18"
                />
              </div>
            </div>

            <label className={styles.label}>Email:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={styles.input}
              required
              disabled={loading}
            />

            <label className={styles.label}>Password:</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={styles.input}
              required
              disabled={loading}
              minLength="8"
            />

            <button
              type="submit"
              className={styles.registerBtn}
              disabled={loading}
            >
              {loading ? "Registering..." : "Register as Student"}
            </button>
          </form>

          <div className={styles.loginContainer}>
            <button
              onClick={() => !loading && navigate("/login")}
              className={styles.loginBtn}
              disabled={loading}
            >
              Already have an account? Login
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;
