import apiClient from "../../../config/apiClient";


export const getMatchGroupDetails = async (customerId: string) => {
  const res = await apiClient.post("/admin/getMatchGroupDetails", { customerId });
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