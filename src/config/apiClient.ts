import axios from 'axios';
import { authState } from '../state/auth';
import { setRecoil } from 'recoil-nexus';
import { AddClientFormData } from '../schema/customernew';
import { ClientList, CustomerUpdate, PreferencesField } from '../pages/clientsForm/types/clientTypes';

const baseURL = import.meta.env.VITE_APP_BASE_URL;

const apiClient = axios.create({
  baseURL,
});
interface Error {
  response?: {
      data?: {
          message: string,
      }
  }
}
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      setRecoil(authState, {
        accessToken: '',
        firstName: '',
        lastName: '',
        email: '',
        role: '',
        id: '',
        permissions: {},
      });

      localStorage.removeItem('token');
      window.location.href = '/admin/adminLogin';
    }

    return Promise.reject(error);
  }
);

export default apiClient;

export const addCustomerByAdmin =async(data:AddClientFormData)=>{
  try {
    const response = await apiClient.post('admin/addCustomerByAdmin',data)
    console.log('res fro add cli',response);
    
    return response?.data
  } catch (error) {
    return (error as Error).response?.data;
  }
}
export const allActiveCustomer = async()=>{
  try {
    const response = await apiClient.get('admin/allActiveCustomer',)
    return response?.data
  } catch (error) {
    return (error as Error).response?.data;
  }
}
export const getCustomerBasicDetail = async (customerId:string)=>{
  try {
    const response = await apiClient.post('admin/getCustomerBasicDetail',{customerId:customerId})
    return response?.data
  } catch (error) {
    return (error as Error).response?.data;
  }
}
export const getCustomerProfileDetail = async (customerId:string)=>{
  try {
    const response = await apiClient.post('admin/getCustomerProfileDetail',{customerId:customerId})
    return response?.data
  } catch (error) {
    return (error as Error).response?.data;
  }
}
export const getFromGroupList = async ()  =>{
  try {
    const response = await apiClient.get('admin/getFromGroupList')
    return response?.data
  } catch (error) {
    return (error as Error).response?.data;
  }
}

export const getCustomerMatchPreferencesDetail = async (customerId:string)  =>{
  try {
    const response = await apiClient.post('admin/getCustomerMatchPreferencesDetail',{customerId:customerId})
    return response?.data
  } catch (error) {
    return (error as Error).response?.data;
  }
}

export const updateCustomerBasicDetail = async (updatedData:CustomerUpdate)  =>{
  try {
    const response = await apiClient.post('admin/updateCustomerBasicDetail',updatedData)
    return response?.data
  } catch (error) {
    return (error as Error).response?.data;
  }
}

export const uploadFile = async (file:FormData)  =>{
  try {
    const response = await apiClient.post('admin/upload',file)
    return response?.data
  } catch (error) {
    return (error as Error).response?.data;
  }
}

export const updateCustomerProfile = async (data:any)  =>{
  try {
    const response = await apiClient.post('admin/updateCustomerProfile',data)
    return response?.data
  } catch (error) {
    return (error as Error).response?.data;
  }
}

export const getAllPreferencesGroupFields = async ()  =>{
  try {
    const response = await apiClient.get('admin/getAllPreferencesGroupFields')
    return response?.data
  } catch (error) {
    return (error as Error).response?.data;
  }
}

export const createPreferencesField = async (data:PreferencesField)  =>{
  try {
    const response = await apiClient.post('admin/createPreferencesField',data)
    return response?.data
  } catch (error) {
    return (error as Error).response?.data;
  }
}
export const updatePreferencesField = async (data:PreferencesField)  =>{
  try {
    const response = await apiClient.post('admin/updatePreferencesField',data)
    return response?.data
  } catch (error) {
    return (error as Error).response?.data;
  }
}
export const deletePreferencesField = async (data:string)  =>{
  try {
    const response = await apiClient.post('admin/deletePreferencesField',{fieldId:data})
    return response?.data
  } catch (error) {
    return (error as Error).response?.data;
  }
}
export const createClientList = async (data:ClientList)  =>{
  try {
    const response = await apiClient.post('admin/createClientList',data)
    return response?.data
  } catch (error) {
    return (error as Error).response?.data;
  }
}

export const getAllClientLists = async ()  =>{
  try {
    const response = await apiClient.get('admin/getAllClientLists')
    return response?.data
  } catch (error) {
    return (error as Error).response?.data;
  }
}

export const editClientList = async (data:ClientList)  =>{
  console.log('da======================',data)
  try {
    const response = await apiClient.post('admin/editClientList',data)
    return response?.data
  } catch (error) {
    return (error as Error).response?.data;
  }
}


