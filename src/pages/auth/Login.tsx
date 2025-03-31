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
        }
    };



    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-gray-300">
            <div className="w-full max-w-md p-8 bg-white border border-gray-300 shadow-lg rounded-2xl">
                <h1 className="text-4xl font-extrabold text-center text-transparent bg-gradient-to-r from-black to-gray-700 bg-clip-text">
                    Pehli Rasam
                </h1>
                <p className="mt-1 text-sm text-center text-gray-600">
                    Welcome! Please log in to continue.
                </p>

                <form className="mt-6" onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block font-medium text-gray-800">Email Address</label>
                        <input
                            type="email"
                            className={`w-full p-3 mt-1 border rounded-lg focus:ring ${errors.email ? "border-red-500 ring-red-300" : "border-gray-400 focus:ring-black"}`}
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                        {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
                    </div>

                    <div className="mb-4">
                        <label className="block font-medium text-gray-800">Password</label>
                        <input
                            type="password"
                            className={`w-full p-3 mt-1 border rounded-lg focus:ring ${errors.password ? "border-red-500 ring-red-300" : "border-gray-400 focus:ring-black"}`}
                            placeholder="Enter your password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                        {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
                    </div>

                    <button
                        type="submit"
                        className="w-full p-3 mt-4 text-white transition rounded-lg shadow-lg bg-gradient-to-r from-black to-gray-700 hover:opacity-90"
                    >
                        Log in
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
