import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSetRecoilState } from "recoil";
import { message } from "antd";
import apiClient from "../../config/apiClient";
import { authState } from "../../state/auth";
import axios from "axios";

const Login = () => {
    const [formData, setFormData] = useState({ email: "", password: "" });
    const [errors, setErrors] = useState({ email: "", password: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const setAuthState = useSetRecoilState(authState);
    const navigate = useNavigate();

    const validateForm = () => {
        const newErrors = { email: "", password: "" };
        let valid = true;

        if (!formData.email.trim()) {
            newErrors.email = "Email is required.";
            valid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Please enter a valid email address.";
            valid = false;
        }

        if (!formData.password.trim()) {
            newErrors.password = "Password is required.";
            valid = false;
        } else if (formData.password.length < 6) {
            newErrors.password = "Password must be at least 6 characters long.";
            valid = false;
        }

        setErrors(newErrors);
        return valid;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsLoading(true);
        try {
            const response = await apiClient.post("admin/adminLogin", formData);

            const { token, admin } = response.data;

            if (token && admin) {
                message.success("Login successful!");

                localStorage.setItem("token", token);
                localStorage.setItem("admin", JSON.stringify(admin));

                setAuthState({
                    accessToken: token,
                    ...admin,
                    isAuthenticated: true,
                });

                navigate("/");

            } else {
                message.error("Invalid server response.");
            }
        } catch (error: unknown) {
            console.error("Axios Error:", error);

            if (axios.isAxiosError(error)) {
                const errorMsg = error.response?.data?.error || "Login failed. Please try again.";
                message.error(errorMsg);
            } else {
                message.error("An unexpected error occurred.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const EyeIcon = ({ isVisible }: { isVisible: boolean }) => (
        <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-gray-500 hover:text-gray-700 cursor-pointer transition-colors"
        >
            {isVisible ? (
                // Eye open icon
                <>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                </>
            ) : (
                // Eye closed icon
                <>
                    <path d="m1 1 22 22" />
                    <path d="M6.71 6.71C4.31 8.56 2.53 10.53 2 12c1.74 2.25 4.9 6 10 6 1.59 0 3.04-.34 4.28-.97" />
                    <path d="M10 10a3 3 0 0 0 4.24 4.24" />
                    <path d="M17.29 17.29C19.69 15.44 21.47 13.47 22 12c-1.74-2.25-4.9-6-10-6a7.79 7.79 0 0 0-2.69.48" />
                </>
            )}
        </svg>
    );

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-gray-300">
            <div className="w-full max-w-md p-8 bg-white shadow-lg rounded-2xl border border-gray-300">
                <h1 className="text-4xl font-extrabold text-center bg-gradient-to-r from-black to-gray-700 text-transparent bg-clip-text">
                    Pehli Rasam
                </h1>
                <p className="text-sm text-gray-600 text-center mt-1">
                    Welcome! Please log in to continue.
                </p>

                <form className="mt-6" onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-800 font-medium">Email Address</label>
                        <input
                            type="email"
                            className={`w-full p-3 mt-1 border rounded-lg focus:ring transition-all ${
                                errors.email 
                                    ? "border-red-500 ring-red-300" 
                                    : "border-gray-400 focus:ring-black focus:border-black"
                            }`}
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={(e) => {
                                setFormData({ ...formData, email: e.target.value });
                                if (errors.email) {
                                    setErrors({ ...errors, email: "" });
                                }
                            }}
                            disabled={isLoading}
                        />
                        {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-800 font-medium">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                className={`w-full p-3 pr-12 mt-1 border rounded-lg focus:ring transition-all ${
                                    errors.password 
                                        ? "border-red-500 ring-red-300" 
                                        : "border-gray-400 focus:ring-black focus:border-black"
                                }`}
                                placeholder="Enter your password"
                                value={formData.password}
                                onChange={(e) => {
                                    setFormData({ ...formData, password: e.target.value });
                                    if (errors.password) {
                                        setErrors({ ...errors, password: "" });
                                    }
                                }}
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 focus:outline-none focus:ring-2 focus:ring-black focus:ring-opacity-20 rounded p-1"
                                onClick={togglePasswordVisibility}
                                disabled={isLoading}
                                tabIndex={-1}
                            >
                                <EyeIcon isVisible={showPassword} />
                            </button>
                        </div>
                        {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full mt-4 p-3 !text-white bg-gradient-to-r from-black to-gray-700 rounded-lg shadow-lg transition-all duration-200 ${
                            isLoading 
                                ? "opacity-70 cursor-not-allowed" 
                                : "hover:opacity-90 hover:shadow-xl transform hover:-translate-y-0.5"
                        }`}
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center">
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                Logging in...
                            </div>
                        ) : (
                            "Log in"
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-500">
                        Need help? Contact your administrator
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;