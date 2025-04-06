import { useState, useEffect, useRef } from "react";
import { FaSignInAlt, FaSpinner } from "react-icons/fa";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db, doc, setDoc } from "../firebase/firebase";
import PropTypes from "prop-types";
import { gsap } from "gsap";

const Login = ({ isLogin, setIsLogin }) => {
  const [userData, setUserData] = useState({ email: "", 
                                             password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const formRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    gsap.set(formRef.current, { opacity: 1 });
    gsap.fromTo(
      formRef.current,
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 1, ease: "power3.out" }
    );

    gsap.fromTo(
      formRef.current.querySelectorAll(".input-field"),
      { opacity: 0, x: -20 },
      { opacity: 1, x: 0, duration: 0.8, stagger: 0.2, ease: "power2.out", delay: 0.5 }
    );

    gsap.fromTo(
      buttonRef.current,
      { opacity: 0, scale: 0.8 },
      { opacity: 1, scale: 1, duration: 0.8, ease: "elastic.out(1, 0.5)", delay: 1 }
    );
  }, []);

  const handleChangeUserData = (e) => {
    const { name, value } = e.target;
    setUserData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleLoginAuth = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    gsap.to(buttonRef.current, { scale: 0.95, duration: 0.3, ease: "power1.inOut" });

    try {
      const userCredential = await signInWithEmailAndPassword(auth, userData.email, userData.password);
      const loggedInUser = userCredential.user;

      const userDocRef = doc(db, "users", loggedInUser.uid);
      await setDoc(
        userDocRef,
        {
          uid: loggedInUser.uid,
          email: loggedInUser.email,
          username: loggedInUser.email.split("@")[0],
          fullName: loggedInUser.email.split("@")[0].charAt(0).toUpperCase() + loggedInUser.email.split("@")[0].slice(1),
          image: "",
        },
        { merge: true }
      );

      gsap.to(formRef.current, {
        opacity: 0,
        y: -50,
        duration: 0.8,
        ease: "power3.in",
        onComplete: () => alert("Login Successful"),
      });
    } catch (error) {
      console.error("Login Error:", error.message);
      setError(
        error.code === "auth/invalid-credential"
          ? "Invalid email or password. Please try again."
          : "Login Failed! " + error.message
      );
      gsap.to(formRef.current, {
        x: -10,
        duration: 0.1,
        repeat: 5,
        yoyo: true,
        ease: "power1.inOut",
      });
    } finally {
      setIsLoading(false);
      gsap.to(buttonRef.current, { scale: 1, duration: 0.3, ease: "power1.out" });
    }
  };

  const handleButtonHover = (enter) => {
    if (!isLoading) {
      gsap.to(buttonRef.current, {
        scale: enter ? 1.05 : 1,
        duration: 0.3,
        ease: "power2.out",
      });
    }
  };

  return (
    <section className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br background-image">
      <div
        ref={formRef}
        className="p-5 bg-white shadow-lg rounded-xl h-[27rem] w-[20rem] flex flex-col items-center justify-center"
      >
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-[#008C72]">Login to WhisperWave</h1>
          <p className="mt-1 text-sm text-gray-600">Welcome back, Login to continue</p>
        </div>

        <form onSubmit={handleLoginAuth} className="flex flex-col w-full gap-3">
          <input
            name="email"
            value={userData.email}
            onChange={handleChangeUserData}
            className="input-field w-full p-2 border border-green-200 rounded-md bg-[#01aa851d] text-[#004939f3] font-medium outline-none placeholder:text-[#004939858] focus:border-green-400 focus:ring-1 focus:ring-green-200"
            type="email"
            placeholder="Email"
            required
          />
          <input
            name="password"
            value={userData.password}
            onChange={handleChangeUserData}
            className="input-field w-full p-2 border border-green-200 rounded-md bg-[#01aa851d] text-[#004939f3] font-medium outline-none placeholder:text-[#004939858] focus:border-green-400 focus:ring-1 focus:ring-green-200"
            type="password"
            placeholder="Password"
            required
          />
          {error && <p className="mb-3 text-sm text-center text-red-500">{error}</p>}
          <button
            ref={buttonRef}
            type="submit"
            disabled={isLoading}
            className={`w-full p-2 bg-[#01aa85] text-white font-bold rounded-md flex items-center justify-center gap-2 transition-colors ${
              isLoading ? "opacity-70 cursor-not-allowed" : "hover:bg-[#008970]"
            }`}
            onMouseEnter={() => handleButtonHover(true)}
            onMouseLeave={() => handleButtonHover(false)}
          >
            {isLoading ? (
              <>
                Processing... <FaSpinner className="animate-spin" />
              </>
            ) : (
              <>
                Login <FaSignInAlt />
              </>
            )}
          </button>
        </form>

        <div className="mt-5 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-green-500 underline transition-colors hover:text-green-800"
          >
            Not have an account? Register
          </button>
        </div>
      </div>
    </section>
  );
};

Login.propTypes = {
  isLogin: PropTypes.bool.isRequired, 
  setIsLogin: PropTypes.func.isRequired,
};

export default Login;