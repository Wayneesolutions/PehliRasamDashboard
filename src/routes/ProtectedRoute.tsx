import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = () => {
    // Check for token in URL hash (passed from timeline when opening in new tab)
    // Do this synchronously before checking localStorage
    const hash = window.location.hash;
    if (hash) {
        const tokenMatch = hash.match(/token=([^&]+)/);
        if (tokenMatch) {
            const tokenFromUrl = decodeURIComponent(tokenMatch[1]);
            // Store token in localStorage if it exists in URL and not already stored
            if (tokenFromUrl) {
                const existingToken = localStorage.getItem("token");
                if (!existingToken) {
                    localStorage.setItem("token", tokenFromUrl);
                }
                // Remove token from URL hash for security
                window.history.replaceState(null, '', window.location.pathname + window.location.search);
            }
        }
    }

    const token = localStorage.getItem("token");

    return token ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
