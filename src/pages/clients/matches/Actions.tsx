import apiClient from "../../../config/apiClient";


  export const getAllPreferencesGroupFields = async () => {
    const res = await apiClient.get("/admin/getAllPreferencesGroupFields");
    return res.data.data;
  };
  
  export const getAllMatchGroups = async () => {
    const res = await apiClient.get("/admin/getAllMatchGroups");
    return res.data.data;
  };
  
  export const searchCustomerByName = async (name: string) => {
    const res = await apiClient.post("/admin/searchCustomerByName", { name });
    return res.data.data;
  };
  
  export const createMatchGroupValue = async (payload: {
    matchGroupId: string;
    customerId: string;
    matchCustomerId: string;
    matchingDescription: string;
  }) => {
    const res = await apiClient.post("/admin/createMatchGroupValue", payload);
    return res.data;
  };