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
    const setAuthState = useSetRecoilState(authState);
    const navigate = useNavigate();

    const validateForm = () => {
        const newErrors = { email: "", password: "" };
        let valid = true;

        if (!formData.email.trim()) {
            newErrors.email = "Email is required.";
            valid = false;
        }

        if (!formData.password.trim()) {
            newErrors.password = "Password is required.";
            valid = false;
        }

        setErrors(newErrors);
        return valid;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            const response = await apiClient.post("/adminLogin", formData);

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
        }
    };



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
                            className={`w-full p-3 mt-1 border rounded-lg focus:ring ${errors.email ? "border-red-500 ring-red-300" : "border-gray-400 focus:ring-black"}`}
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                        {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-800 font-medium">Password</label>
                        <input
                            type="password"
                            className={`w-full p-3 mt-1 border rounded-lg focus:ring ${errors.password ? "border-red-500 ring-red-300" : "border-gray-400 focus:ring-black"}`}
                            placeholder="Enter your password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                        {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password}</p>}
                    </div>

                    <button
                        type="submit"
                        className="w-full mt-4 p-3 text-white bg-gradient-to-r from-black to-gray-700 rounded-lg hover:opacity-90 shadow-lg transition"
                    >
                        Log in
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
