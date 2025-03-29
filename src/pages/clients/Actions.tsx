import apiClient from "../../config/apiClient";

export const getCustomerProfile = async (customerId: string) => {
    try {
        const response = await apiClient.get(`/admin/customerProfile?customerId=${customerId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching customer profile:", error);
        throw error;
    }
};

export const getFormGroupList = async () => {
    try {
        const response = await apiClient.get(`/admin/getFromGroupList`);
        return response.data;
    } catch (error) {
        console.error("Error fetching form group list:", error);
        throw error;
    }
};

export const getCustomerList = async () => {
    try {
        const response = await apiClient.get(`/admin/allActiveCustomer`);
        return response.data;
    } catch (error) {
        console.error("Error fetching form group list:", error);
        throw error;
    }
};

export const getCustomerBasicDetail = async (customerId: string) => {
    try {
        const response = await apiClient.post(`/admin/getCustomerBasicDetail`, { customerId });
        return response.data;
    } catch (error) {
        console.error("Error fetching customer profile:", error);
        throw error;
    }
};
export const getCustomerProfileDetail = async (customerId: string) => {
    try {
        const response = await apiClient.post(`/admin/getCustomerProfileDetail`, { customerId });
        return response.data;
    } catch (error) {
        console.error("Error fetching customer profile:", error);
        throw error;
    }
};
export const getCustomerMatchPreferencesDetail = async (customerId: string) => {
    try {
        const response = await apiClient.post(`/admin/getCustomerMatchPreferencesDetail`, { customerId });
        return response.data;
    } catch (error) {
        console.error("Error fetching customer profile:", error);
        throw error;
    }
};