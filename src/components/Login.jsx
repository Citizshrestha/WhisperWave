import { useState } from "react";
import { FaSignInAlt, FaSpinner } from "react-icons/fa";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db, doc, setDoc } from "../firebase/firebase";
import PropTypes from "prop-types";

const Login = ({ isLogin, setIsLogin }) => {
  const [userData, setUserData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

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
    try {
      const userCredential = await signInWithEmailAndPassword(auth, userData.email, userData.password);
      const loggedInUser = userCredential.user;

      const userDocRef = doc(db, "users", loggedInUser.uid);
      await setDoc(userDocRef, {
        uid: loggedInUser.uid,
        email: loggedInUser.email,
        username: loggedInUser.email.split("@")[0],
        fullName: loggedInUser.email.split("@")[0].charAt(0).toUpperCase() + loggedInUser.email.split("@")[0].slice(1),
        image: "",
      }, { merge: true });

      alert("Login Successful");
    } catch (error) {
      console.error("Login Error:", error.message);
      setError(error.code === "auth/invalid-credential"
        ? "Invalid email or password. Please try again."
        : "Login Failed! " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="flex flex-col items-center justify-center h-[100vh] background-image">
      <div className="p-5 bg-white shadow-lg rounded-xl h-[27rem] w-[20rem] flex flex-col items-center justify-center">
        <div className="mb-10">
          <h1 className="text-center text-[1.8rem] font-bold">Login</h1>
          <p className="text-sm text-center text-gray-400">Welcome back, Login to continue</p>
        </div>

        <form onSubmit={handleLoginAuth} className="w-full">
          <input
            name="email"
            value={userData.email}
            onChange={handleChangeUserData}
            className="w-full p-2 border border-green-200 rounded-md bg-[#01aa851d] text-[#004939f3] mb-3 font-medium outline-none placeholder:text-[#004939858]"
            type="email"
            id="email"
            placeholder="Email"
            required
          />
          <input
            name="password"
            value={userData.password}
            onChange={handleChangeUserData}
            className="w-full p-2 border border-green-200 rounded-md bg-[#01aa851d] text-[#004939f3] mb-3 font-medium outline-none placeholder:text-[#004939858]"
            type="password"
            id="password"
            placeholder="Password"
            required
          />
          {error && <p className="mb-3 text-sm text-red-500">{error}</p>}
          <div className="w-full">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-[#01aa85] text-white font-bold w-full p-2 rounded-md flex items-center gap-2 justify-center"
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
          </div>
        </form>

        <div className="mt-5 text-sm text-center text-gray-400">
          <button onClick={() => setIsLogin(!isLogin)}>Not have an account? Register</button>
        </div>
      </div>
    </section>
  );
};

Login.propTypes = {
    isLogin: PropTypes.func.isRequired,
    setIsLogin: PropTypes.func.isRequired,
};
export default Login;