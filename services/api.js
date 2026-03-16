import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

const API_BASE_URL = __DEV__
  ? "http://localhost:5000/api"
  : "https://your-production-api.com/api";

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
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, clear it and redirect to login
          this.setToken(null);
          throw new Error("Session expired. Please login again.");
        }
        throw new Error(data.error || data.message || "Request failed");
      }

      return data;
    } catch (error) {
      console.error("API Error:", error);
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
  getHealthHistory: (params = {}) => apiClient.get("/health/history", params),
  getLatestHealth: () => apiClient.get("/health/latest"),
};

// AI Prediction API
export const predictionAPI = {
  predictRisk: (healthData) => apiClient.post("/predict/risk", healthData),
  getPredictionHistory: (params = {}) =>
    apiClient.get("/predict/history", params),
};

// AI Assistant API
export const aiAPI = {
  startSession: (data = {}) => apiClient.post("/ai/start-session", data),
  endSession: (sessionId) =>
    apiClient.post("/ai/end-session", { session_id: sessionId }),
  getSessions: (params = {}) => apiClient.get("/ai/sessions", params),
  getActiveSession: () => apiClient.get("/ai/active-session"),
  analyzeSymptom: (symptomData) =>
    apiClient.post("/ai/analyze-symptom", symptomData),
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
