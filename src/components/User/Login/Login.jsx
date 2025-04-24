import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../Header";
import styles from "./Login.module.css";
import { auth, signInWithGooglePopup } from "../../../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import googleImage from "../../../assets/google.png";

const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    //Firebase Authentication
    await signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        navigate("/chat");
        console.log(user);
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorCode, errorMessage);
        document.getElementById("errorMessage").style.display = "block";
      });
  };

  const logGoogleUser = async () => {
    await signInWithGooglePopup()
    .then((userCredential) => {
      const user = userCredential.user;
      navigate("/chat");
      console.log(user);
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.log(errorCode, errorMessage);
      document.getElementById("errorMessage").style.display = "block";
    });;
  };

  return (
    <>
      <Header />
      <div className={styles.container}>
        <div className={styles.formContainer}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <h2>Enter Your Information</h2>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span id="errorMessage" style={{ display: "none" }}>
              Wrong email or password
            </span>
            <button type="submit">Login</button>
          </form>
          <p className={styles.or}>or</p>
          <button onClick={logGoogleUser} className={styles.googlebtn}>
            <img src={googleImage} alt="google img" />
            Sign In With Google
          </button>
          <p className={styles.register}>
            Don't have an account?{" "}
            <span onClick={() => navigate("/register")}>Register</span>
          </p>
        </div>
      </div>
    </>
  );
};

export default LoginScreen;
