import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

// API Base URL - prioritize environment variables, then use defaults based on environment
const getApiBaseUrl = () => {
  // For production
  if (!__DEV__) {
    return (
      process.env.EXPO_PUBLIC_PROD_API_URL ||
      "https://your-production-api.com/api"
    );
  }

  // For development - try environment variable first
  const devUrl = process.env.EXPO_PUBLIC_DEV_API_URL;
  if (devUrl) {
    return devUrl;
  }

  // Fallback for local development
  // Use 10.0.2.2 for Android emulator (refers to host machine)
  // Use localhost for web
  // For physical devices, set EXPO_PUBLIC_DEV_API_URL to your machine IP
  return "http://localhost:5000/api";
};

const API_BASE_URL = getApiBaseUrl();

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = null;
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
    if (token) {
      AsyncStorage.setItem("authToken", token);
    } else {
      AsyncStorage.removeItem("authToken");
    }
  }

  // Get stored token
  async getToken() {
    if (!this.token) {
      this.token = await AsyncStorage.getItem("authToken");
    }
    return this.token;
  }

  // Make API request with proper headers
  async request(endpoint, options = {}) {
    const token = await this.getToken();
    const url = `${this.baseURL}${endpoint}`;

    const config = {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log(`API Request: ${options.method || "GET"} ${url}`);
      const response = await fetch(url, config);
      const data = await response.json();
      console.log(`API Response (${response.status}):`, data);

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, clear it and redirect to login
          this.setToken(null);
          throw new Error("Session expired. Please login again.");
        }
        console.error(`API Error (${response.status}):`, data);
        throw new Error(data.error || data.message || "Request failed");
      }

      return data;
    } catch (error) {
      console.error("API Fetch Error:", error);
      throw error;
    }
  }

  // HTTP methods
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url);
  }

  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, {
      method: "DELETE",
    });
  }

  // Handle file uploads
  async upload(endpoint, formData) {
    const token = await this.getToken();
    const url = `${this.baseURL}${endpoint}`;

    const config = {
      method: "POST",
      headers: {
        "Content-Type": "multipart/form-data",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || "Upload failed");
      }

      return data;
    } catch (error) {
      console.error("Upload Error:", error);
      throw error;
    }
  }
}

// Create API client instance
const apiClient = new ApiClient();

// Authentication API
export const authAPI = {
  register: (userData) => apiClient.post("/auth/register", userData),
  login: (credentials) => apiClient.post("/auth/login", credentials),
  getProfile: () => apiClient.get("/auth/profile"),
};

// Health Monitoring API
export const healthAPI = {
  recordHealth: (healthData) => apiClient.post("/health/record", healthData),
  addHealthRecord: (healthData) => apiClient.post("/health/record", healthData),
  getHealthHistory: (params = {}) => apiClient.get("/health/history", params),
  getLatestHealth: () => apiClient.get("/health/latest"),
};

// AI Prediction API
export const predictionAPI = {
  predictRisk: (healthData) => apiClient.post("/predict/risk", healthData),
  getPredictionHistory: (params = {}) =>
    apiClient.get("/predict/history", params),
};

// AI Conversation API
export const aiAPI = {
  createConversation: (data = {}) =>
    apiClient.post("/ai/create-conversation", data),
  startSession: (data = {}) => apiClient.post("/ai/start-session", data),
  analyzeSymptom: (symptomData) =>
    apiClient.post("/ai/analyze-symptom", symptomData),
  chat: (messageData) => apiClient.post("/ai/chat", messageData),
  getSessions: (params = {}) => apiClient.get("/ai/sessions", params),
  getConversationMessages: (conversationId) =>
    apiClient.get(`/ai/conversations/${conversationId}/messages`),
};

// Messaging API
export const messageAPI = {
  sendMessage: (messageData) => apiClient.post("/messages/send", messageData),
  getConversation: (userId, params = {}) =>
    apiClient.get(`/messages/conversation/${userId}`, params),
  getConversations: (params = {}) =>
    apiClient.get("/messages/conversations", params),
  getUnreadCount: () => apiClient.get("/messages/unread-count"),
  markAsRead: (messageId) => apiClient.post(`/messages/mark-read/${messageId}`),
  getPatients: () => apiClient.get("/messages/doctor/patients"),
};

// User Profile API
export const userAPI = {
  getProfile: () => apiClient.get("/auth/profile"),
  updateProfile: (profileData) => apiClient.put("/auth/profile", profileData),
  getPregnancyProfile: () => apiClient.get("/auth/pregnancy-profile"),
  updatePregnancyProfile: (profileData) =>
    apiClient.put("/auth/pregnancy-profile", profileData),
  updatePassword: (passwordData) =>
    apiClient.post("/auth/change-password", passwordData),
};

// Appointments API
export const appointmentAPI = {
  getAppointments: (params = {}) => apiClient.get("/appointments", params),
  bookAppointment: (appointmentData) =>
    apiClient.post("/appointments", appointmentData),
  cancelAppointment: (appointmentId) =>
    apiClient.delete(`/appointments/${appointmentId}`),
  getDoctorAppointments: (params = {}) =>
    apiClient.get("/appointments/doctor", params),
};

// Medical Records API
export const medicalAPI = {
  getTestResults: (params = {}) =>
    apiClient.get("/medical/test-results", params),
  getVaccinations: () => apiClient.get("/medical/vaccinations"),
  recordVaccination: (vaccinationData) =>
    apiClient.post("/medical/vaccinations", vaccinationData),
};

// Doctor-Patient API
export const doctorAPI = {
  getPatients: (params = {}) => apiClient.get("/doctor/patients", params),
  getPatientDetails: (patientId) =>
    apiClient.get(`/doctor/patients/${patientId}`),
  getPatientHistory: (patientId, params = {}) =>
    apiClient.get(`/doctor/patients/${patientId}/history`, params),
  addNote: (patientId, noteData) =>
    apiClient.post(`/doctor/patients/${patientId}/notes`, noteData),
  browseDoctors: (params = {}) => apiClient.get("/doctor/browse", params),
};

// Video/Voice Call API
export const callAPI = {
  initiateCall: (callData) => apiClient.post("/calls/initiate", callData),
  getCallToken: (channelName, callType = "audio") =>
    apiClient.post("/calls/get-token", { channelName, callType }),
  endCall: (callId) => apiClient.post(`/calls/${callId}/end`, {}),
  getCallHistory: (params = {}) => apiClient.get("/calls/history", params),
  rejectCall: (callId) => apiClient.post(`/calls/${callId}/reject`, {}),
  acceptCall: (callId) => apiClient.post(`/calls/${callId}/accept`, {}),
  getActiveCall: () => apiClient.get("/calls/active"),
};

// Utility function for error handling
export const handleApiError = (error, showMessage = true) => {
  console.error("API Error:", error);

  if (showMessage) {
    const message = error.message || "An unexpected error occurred";
    Alert.alert("Error", message);
  }

  throw error;
};

// Health check
export const checkApiHealth = () => apiClient.get("/health");

export default apiClient;
