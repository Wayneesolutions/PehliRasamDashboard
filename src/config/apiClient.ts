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

// Notes API
export const createNote = async (data: { customerId: string; noteDate: string; content: string }) => {
  try {
    const response = await apiClient.post('admin/notes', data)
    return response?.data
  } catch (error) {
    return (error as Error).response?.data;
  }
}

export const getNotes = async (customerId: string) => {
  try {
    const response = await apiClient.get(`admin/notes?customerId=${customerId}`)
    return response?.data
  } catch (error) {
    return (error as Error).response?.data;
  }
}

export const updateNote = async (noteId: string, data: { noteDate?: string; content?: string }) => {
  try {
    const response = await apiClient.put(`admin/notes/${noteId}`, data)
    return response?.data
  } catch (error) {
    return (error as Error).response?.data;
  }
}

export const deleteNote = async (noteId: string) => {
  try {
    const response = await apiClient.delete(`admin/notes/${noteId}`)
    return response?.data
  } catch (error) {
    return (error as Error).response?.data;
  }
}

// Pin/Unpin customer
export const togglePinCustomer = async (customerId: string) => {
  try {
    const response = await apiClient.post('admin/togglePinCustomer', { customerId })
    return response?.data
  } catch (error) {
    return (error as Error).response?.data;
  }
}

export default apiClient;



//submission form for client
export const submissionFormById = async (submissionFormId: string) => {
  try {
    const response = await apiClient.post('admin/SubmissionFormById', { submissionFormId: submissionFormId })
    return response?.data
  } catch (error) {
    return (error as Error).response?.data;
  }
}

//submit form by client
export const submitSubmissionForm = async (payload: any) => {
  try {
    const response = await apiClient.post('/client/SubmissionFormDetail', payload);
    return response?.data;
  } catch (error) {
    return (error as any).response?.data;
  }
};


export const addCustomerByAdmin = async (data: AddClientFormData) => {
  try {
    const response = await apiClient.post('admin/addCustomerByAdmin', data)

    return response?.data
  } catch (error) {
    return (error as Error).response?.data;
  }
}
export const allActiveCustomer = async (listIds?: string[]) => {
  try {
    const params: any = {};
    if (listIds && listIds.length > 0) {
      params.listIds = listIds.join(',');
    }
    const response = await apiClient.get('admin/allActiveCustomer', { params })
    return response?.data
  } catch (error) {
    return (error as Error).response?.data;
  }
}
export const advancedSearchCustomers = async (searchCriteria: any[]) => {
  try {
    const response = await apiClient.post('admin/advancedSearchCustomers', { searchCriteria })
    return response?.data
  } catch (error) {
    return (error as Error).response?.data;
  }
}
export const getCustomerBasicDetail = async (customerId: string) => {
  try {
    const response = await apiClient.post('admin/getCustomerBasicDetail', { customerId: customerId })
    return response?.data
  } catch (error) {
    return (error as Error).response?.data;
  }
}

export const deleteMatchGroupValue = async (id: string) => {
  try {
    const response = await apiClient.post('admin/deleteMatchGroupValue', { id: id })
    return response?.data
  } catch (error) {
    return (error as Error).response?.data;
  }
}
export const getCustomerProfileDetail = async (customerId: string) => {
  try {
    const response = await apiClient.post('admin/getCustomerProfileDetail', { customerId: customerId })
    return response?.data
  } catch (error) {
    return (error as Error).response?.data;
  }
}
export const getFromGroupList = async () => {
  try {
    const response = await apiClient.get('admin/getFromGroupList')
    return response?.data
  } catch (error) {
    return (error as Error).response?.data;
  }
}
export const uploadImage = async (file: File) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post("/admin/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response?.data;
  } catch (error) {
    return (error as any).response?.data;
  }
};
export const addCustomerPhoto = async ({
  customerId,
  url,
}: {
  customerId: string;
  url: string | string[];
}) => {
  try {
    const photoUrls = Array.isArray(url) ? url : [url];
    const res = await apiClient.post("/admin/addCustomerPhoto", {
      customerId,
      url: photoUrls,
    });
    return res?.data;
  } catch (error) {
    return (error as any).response?.data;
  }
};

export const addCustomerToClientList = async (payload: { clientListId: string; customerId: string }) => {
  try {
    const response = await apiClient.post("/admin/addCustomerToClientList", payload);
    return response?.data;
  }
  catch (error: any) {
    return error.response?.data;
  }
};

export const removeCustomerToClientList = async (payload: { clientListId: string; customerId: string }) => {
  try {
    const response = await apiClient.post("/admin/removeCustomerFromClientList", payload);
    return response?.data;
  }
  catch (error: any) {
    return error.response?.data;
  }
};

export const getCustomerMatchPreferencesDetail = async (payload: { customerId: string }) => {
  try {
    const response = await apiClient.post('admin/getCustomerMatchPreferencesDetail', payload);
    return response?.data;
  } catch (error: any) {
    return error.response?.data;
  }
};

export const updateCustomerMatchPreferencesDetail = async (payload: {
  customerId: string;
  matchPreferences: {
    preferencesGroupId: string;
    groupFields: {
      fieldId: string;
      fieldValue: string;
    }[];
  }[];
}) => {
  try {
    const response = await apiClient.post('admin/updateCustomerMatchPreferences', payload);
    return response?.data;
  } catch (error: any) {
    return error.response?.data;
  }
};


export const updateCustomerBasicDetail = async (updatedData: CustomerUpdate) => {
  try {
    const response = await apiClient.post('admin/updateCustomerBasicDetail', updatedData)
    return response?.data
  } catch (error) {
    return (error as Error).response?.data;
  }
}

export const uploadFile = async (file: FormData) => {
  try {
    const response = await apiClient.post('admin/upload', file)
    return response?.data
  } catch (error) {
    return (error as Error).response?.data;
  }
}
export const uploadMultipleFiles = async (files: File[]) => {
  const formData = new FormData();
  files.forEach(file => formData.append("file", file)); 

  try {
    const response = await apiClient.post('admin/upload', formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });
    return response?.data;
  } catch (error) {
    return (error as any).response?.data;
  }
}


export const updateCustomerProfile = async (data: any) => {
  try {
    const response = await apiClient.post('admin/updateCustomerProfile', data)
    return response?.data
  } catch (error) {
    return (error as Error).response?.data;
  }
}

export const getAllPreferencesGroupFields = async () => {
  try {
    const response = await apiClient.get('admin/getAllPreferencesGroupFields')
    return response?.data
  } catch (error) {
    return (error as Error).response?.data;
  }
}

export const createPreferencesField = async (data: PreferencesField) => {
  try {
    const response = await apiClient.post('admin/createPreferencesField', data)
    return response?.data
  } catch (error) {
    return (error as Error).response?.data;
  }
}
export const updatePreferencesField = async (data: PreferencesField) => {
  try {
    const response = await apiClient.post('admin/updatePreferencesField', data)
    return response?.data
  } catch (error) {
    return (error as Error).response?.data;
  }
}
export const deletePreferencesField = async (data: string) => {
  try {
    const response = await apiClient.post('admin/deletePreferencesField', { fieldId: data })
    return response?.data
  } catch (error) {
    return (error as Error).response?.data;
  }
}
export const createClientList = async (data: ClientList) => {
  try {
    const response = await apiClient.post('admin/createClientList', data)
    return response?.data
  } catch (error) {
    return (error as Error).response?.data;
  }
}

export const getAllClientLists = async () => {
  try {
    const response = await apiClient.get('admin/getAllClientLists')
    return response?.data
  } catch (error) {
    return (error as Error).response?.data;
  }
}

export const editClientList = async (data: ClientList) => {
  console.log('da======================', data)
  try {
    const response = await apiClient.post('admin/editClientList', data)
    return response?.data
  } catch (error) {
    return (error as Error).response?.data;
  }
}


export const getMatchGroupDetails = async (customerId: string) => {
  const res = await apiClient.post("/admin/getMatchGroupDetails", { customerId });
  return res.data.data;
};

export const getMatchSuggestions = async (customerId: string) => {
  const res = await apiClient.post("/admin/matchingSuggestions", { customerId });
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

export const updateMatchGroupValue = async (payload: {
  matchGroupId: string;
  id: string;
  customerId: string;
  matchingDescription: string;
}) => {
  const res = await apiClient.post("/admin/updateMatchGroupValue", payload);
  return res.data;
};



interface CreateEmailTemplateData {
  subject: string;
  body: string;
}

export const createEmailTemplate = async (data: CreateEmailTemplateData) => {
  try {
    const response = await apiClient.post('admin/createEmailTemplate', data);
    return response?.data;
  } catch (error) {
    return (error as Error).response?.data;
  }
};


export const getAllEmailTemplates = async () => {
  try {
    const response = await apiClient.get('admin/getAllEmailTemplates')
    return response?.data
  } catch (error) {
    return (error as Error).response?.data;
  }
}

export const deleteEmailTemplate = async (id: string) => {
  try {
    const response = await apiClient.post('admin/deleteEmailTemplate', { id });
    return response?.data
  } catch (error) {
    return (error as Error).response?.data;
  }
}

interface MailLogParams {
  search?: string;
}

export const mailLogs = async (params?: MailLogParams) => {
  try {
    const response = await apiClient.post('admin/mailLogs', params || {});
    return response?.data;
  } catch (error) {
    return (error as any)?.response?.data;
  }
};


export const recentlySubmittedClients = async () => {
  try {
    const response = await apiClient.get('admin/recentlySubmittedClients')
    return response?.data
  } catch (error) {
    return (error as Error).response?.data;
  }
}

export const getTodayStatsCount = async () => {
  try {
    const response = await apiClient.get('admin/getTodayStatsCount')
    return response?.data
  } catch (error) {
    return (error as Error).response?.data;
  }
}

export const clientSubm = async () => {
  try {
    const response = await apiClient.get('admin/getCustomerCountLastFiveDays')
    return response?.data
  } catch (error) {
    return (error as Error).response?.data;
  }
}

export const updateEmailTemplate = async (data: {
  id: string;
  subject: string;
  body: string;
}) => {
  try {
    const response = await apiClient.post('/admin/updateEmailTemplate', data);
    return response?.data;
  } catch (error) {
    return (error as Error)?.response?.data;
  }
};

export const getEmailTemplateById = async (id: string) => {
  try {
    const response = await apiClient.post('/admin/getEmailTemplateById', { id });
    return response?.data;
  } catch (error) {
    return (error as Error)?.response?.data;
  }
};

interface SendCustomerMailData {
  customerId: string;
  subject: string;
  body: string;
}

export const sendCustomerMail = async (data: SendCustomerMailData) => {
  try {
    const response = await apiClient.post('admin/sendCustomerMail', data);
    return response?.data;
  } catch (error) {
    return (error as Error).response?.data;
  }
};


interface ActivityLogPayload {
  customer: string; 
}

export const getActivityLogs = async (payload: ActivityLogPayload) => {
  try {
    const response = await apiClient.post("/admin/getActivityLogs", payload);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch activity logs", error);
    throw error;
  }
};

interface CustomerActivityLogPayload {
  customer: string; 
}

export const getCustomerActivityLogs = async (payload: CustomerActivityLogPayload) => {
  try {
    const response = await apiClient.post("/admin/getMonthlyActivitySummary", payload);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch activity logs", error);
    throw error;
  }
};

interface ActivityLogPayloadCustomer {
  customer: string; 
}

export const getActivityLogsCustomer = async (payload: ActivityLogPayloadCustomer) => {
  try {
    const response = await apiClient.post("/admin/getActivityLogs", payload);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch activity logs", error);
    throw error;
  }
};

interface CustomerActivityLogPayloadId {
  customer: string; 
}

export const getCustomerActivityLogsID = async (payload: CustomerActivityLogPayloadId) => {
  try {
    const response = await apiClient.post("/admin/getMonthlyActivitySummary", payload);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch activity logs", error);
    throw error;
  }
};

export const deleteCustomer = async (id: string) => {
  try {
    const response = await apiClient.delete(`admin/delete-customer/${id}`);
    return response?.data;
  } catch (error) {
    return (error as any)?.response?.data;
  }
};
