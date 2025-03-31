import axios from 'axios';
import { authState } from '../state/auth';
import { setRecoil } from 'recoil-nexus';
import { AddClientFormData } from '../schema/customernew';

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
    const response = await apiClient.post('/addCustomerByAdmin',data)
    console.log('res fro add cli',response);
    
    return response?.data
  } catch (error) {
    return (error as Error).response?.data;
  }
}
export const allActiveCustomer = async()=>{
  try {
    const response = await apiClient.get('/allActiveCustomer',)
    return response?.data
  } catch (error) {
    return (error as Error).response?.data;
  }
}
export const getCustomerBasicDetail = async (customerId:string)=>{
  try {
    const response = await apiClient.post('/getCustomerBasicDetail',{customerId:customerId})
    return response?.data
  } catch (error) {
    return (error as Error).response?.data;
  }
}
export const getCustomerProfileDetail = async (customerId:string)=>{
  try {
    const response = await apiClient.post('/getCustomerProfileDetail',{customerId:customerId})
    return response?.data
  } catch (error) {
    return (error as Error).response?.data;
  }
}
export const getFromGroupList = async ()  =>{
  try {
    const response = await apiClient.get('/getFromGroupList')
    return response?.data
  } catch (error) {
    return (error as Error).response?.data;
  }
}

