import { useState, useEffect, useRef } from "react";
import { FaUserPlus } from "react-icons/fa";
import PropTypes from "prop-types";
import { supabase, signUpWithEmail } from "../supabase/supabase";
import { gsap } from "gsap";
import { toast } from "react-toastify";

const Register = ({ isLogin, setIsLogin }) => {
  const [userData, setUserData] = useState({ fullName: "", email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const formRef = useRef(null);
  const buttonRef = useRef(null);
  const imageRef = useRef(null);

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

    gsap.fromTo(
      imageRef.current,
      { opacity: 0, x: -100, scale: 0.5 },
      { opacity: 1, x: 0, duration: 1.2, ease: "power3.out", delay: 0.3 }
    );
  }, []);

  const handleChangeUserData = (e) => {
    const { name, value } = e.target;
    setUserData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleAuth = async () => {
    setIsLoading(true);
    setError(null);

    gsap.to(buttonRef.current, { scale: 0.95, duration: 0.3, ease: "power1.inOut" });

    try {
      const { id } = await signUpWithEmail(userData.email, userData.password, userData.fullName);

      await supabase
        .from("users")
        .insert({
          id,
          email: userData.email,
          username: userData.email.split("@")[0],
          full_name: userData.fullName,
          image: "",
        });

      gsap.to(formRef.current, {
        opacity: 0,
        y: -50,
        duration: 0.8,
        ease: "power3.in",
        onComplete: () => toast.success("Registration Successful"),
      });
    } catch (error) {
      console.error("Registration Error:", error.message);
      setError("Registration Failed! " + error.message);
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
    <section className="flex flex-col relative w-full lg:flex-row items-center justify-center min-h-screen p-4 bg-gradient-to-br background-image from-green-100 to-white">
      {/* Illustration */}
      <div className="absolute left-40 lg:w-[50%] mb-8 lg:mb-0">
        <img
          ref={imageRef}
          src="/assets/20250501_1251_Girl Texting App_remix_01jt5am0rsfwd9kzzkmprjknn8.png"
          alt="Register illustration"
          className="w-full h-[80rem] rounded-xl shadow-md object-contain"
        />
      </div>

      {/* Register Form */}
      <div
        ref={formRef}
        className="bg-white absolute right-80 h-[70%] w-[100rem] shadow-lg rounded-xl w-full lg:w-[22rem] p-6 flex flex-col items-center justify-center"
      >
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-[#008C72]">WhisperWave</h1>
          <p className="mt-1 text-sm text-gray-600">Welcome, Create an account to start chatting</p>
        </div>

        <div className="w-full flex flex-col gap-3">
          <input
            type="text"
            name="fullName"
            onChange={handleChangeUserData}
            className="input-field w-full p-2 border border-green-200 rounded-md bg-[#01aa851d] text-[#004939f3] font-medium outline-none placeholder:text-[#00493985] focus:border-green-400 focus:ring-1 focus:ring-green-200"
            placeholder="Full Name"
            required
          />
          <input
            type="email"
            name="email"
            onChange={handleChangeUserData}
            className="input-field w-full p-2 border border-green-200 rounded-md bg-[#01aa851d] text-[#004939f3] font-medium outline-none placeholder:text-[#00493985] focus:border-green-400 focus:ring-1 focus:ring-green-200"
            placeholder="Email"
            required
          />
          <input
            type="password"
            name="password"
            onChange={handleChangeUserData}
            className="input-field w-full p-2 border border-green-200 rounded-md bg-[#01aa851d] text-[#004939f3] font-medium outline-none placeholder:text-[#00493985] focus:border-green-400 focus:ring-1 focus:ring-green-200"
            placeholder="Password"
            required
          />
          {error && <p className="mb-3 text-sm text-red-500 text-center">{error}</p>}
          <button
            ref={buttonRef}
            disabled={isLoading}
            onClick={handleAuth}
            className={`w-full p-2 bg-[#01aa85] text-white font-bold rounded-md flex items-center justify-center gap-2 transition-colors ${
              isLoading ? "opacity-70 cursor-not-allowed" : "hover:bg-[#008970]"
            }`}
            onMouseEnter={() => handleButtonHover(true)}
            onMouseLeave={() => handleButtonHover(false)}
          >
            {isLoading ? (
              <>Processing...</>
            ) : (
              <>
                Register <FaUserPlus />
              </>
            )}
          </button>
        </div>

        <div className="mt-5 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-green-500 underline hover:text-green-600 transition-colors"
          >
            Already have an account? Sign In
          </button>
        </div>
      </div>
    </section>
  );
};

Register.propTypes = {
  isLogin: PropTypes.bool.isRequired,
  setIsLogin: PropTypes.func.isRequired,
};

export default Register;