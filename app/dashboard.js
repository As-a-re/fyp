import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    Alert,
    Dimensions,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../contexts/AuthContext";
import { healthAPI, messageAPI, predictionAPI } from "../services/api";

const { width } = Dimensions.get("window");

export default function DashboardScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [healthData, setHealthData] = useState(null);
  const [latestPrediction, setLatestPrediction] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load latest health data
      const healthResponse = await healthAPI.getLatestHealth();
      setHealthData(healthResponse.record);

      // Load latest prediction
      const predictionResponse = await predictionAPI.getPredictionHistory({
        limit: 1,
      });
      if (
        predictionResponse.predictions &&
        predictionResponse.predictions.length > 0
      ) {
        setLatestPrediction(predictionResponse.predictions[0]);
      }

      // Load unread message count
      const messageResponse = await messageAPI.getUnreadCount();
      setUnreadCount(messageResponse.unreadCount || 0);
    } catch (error) {
      console.error("Dashboard data load error:", error);
      Alert.alert("Error", "Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const getRiskColor = (risk) => {
    switch (risk?.toLowerCase()) {
      case "high":
        return "#e74c3c";
      case "medium":
        return "#f39c12";
      case "low":
        return "#27ae60";
      default:
        return "#95a5a6";
    }
  };

  const getRiskMessage = (risk) => {
    switch (risk?.toLowerCase()) {
      case "high":
        return "High Risk - Immediate attention required";
      case "medium":
        return "Medium Risk - Monitor closely";
      case "low":
        return "Low Risk - Continue regular monitoring";
      default:
        return "No risk assessment available";
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", onPress: logout, style: "destructive" },
    ]);
  };

  const renderHealthCard = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Latest Health Data</Text>
      {healthData ? (
        <View style={styles.healthDataContainer}>
          <View style={styles.healthRow}>
            <Text style={styles.healthLabel}>Blood Pressure:</Text>
            <Text style={styles.healthValue}>
              {healthData.blood_pressure || "N/A"}
            </Text>
          </View>
          <View style={styles.healthRow}>
            <Text style={styles.healthLabel}>Blood Sugar:</Text>
            <Text style={styles.healthValue}>
              {healthData.blood_sugar
                ? `${healthData.blood_sugar} mg/dL`
                : "N/A"}
            </Text>
          </View>
          <View style={styles.healthRow}>
            <Text style={styles.healthLabel}>Heart Rate:</Text>
            <Text style={styles.healthValue}>
              {healthData.heart_rate ? `${healthData.heart_rate} bpm` : "N/A"}
            </Text>
          </View>
          <View style={styles.healthRow}>
            <Text style={styles.healthLabel}>Temperature:</Text>
            <Text style={styles.healthValue}>
              {healthData.temperature ? `${healthData.temperature}°F` : "N/A"}
            </Text>
          </View>
          <View style={styles.healthRow}>
            <Text style={styles.healthLabel}>Weight:</Text>
            <Text style={styles.healthValue}>
              {healthData.weight ? `${healthData.weight} lbs` : "N/A"}
            </Text>
          </View>
          <View style={styles.healthRow}>
            <Text style={styles.healthLabel}>Oxygen Level:</Text>
            <Text style={styles.healthValue}>
              {healthData.oxygen_level ? `${healthData.oxygen_level}%` : "N/A"}
            </Text>
          </View>
        </View>
      ) : (
        <Text style={styles.noDataText}>No health data recorded yet</Text>
      )}
      <TouchableOpacity
        style={styles.cardButton}
        onPress={() => router.push("/health-monitoring")}
      >
        <Text style={styles.cardButtonText}>Record Health Data</Text>
      </TouchableOpacity>
    </View>
  );

  const renderRiskCard = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Risk Assessment</Text>
      {latestPrediction ? (
        <View>
          <View
            style={[
              styles.riskIndicator,
              { backgroundColor: getRiskColor(latestPrediction.prediction) },
            ]}
          >
            <Text style={styles.riskLevel}>
              {latestPrediction.prediction.toUpperCase()}
            </Text>
            <Text style={styles.riskConfidence}>
              Confidence: {Math.round(latestPrediction.confidence * 100)}%
            </Text>
          </View>
          <Text style={styles.riskMessage}>
            {getRiskMessage(latestPrediction.prediction)}
          </Text>
          <Text style={styles.predictionDate}>
            Last assessed:{" "}
            {new Date(latestPrediction.created_at).toLocaleDateString()}
          </Text>
        </View>
      ) : (
        <Text style={styles.noDataText}>No risk assessment available</Text>
      )}
      <TouchableOpacity
        style={styles.cardButton}
        onPress={() => router.push("/risk-assessment")}
      >
        <Text style={styles.cardButtonText}>Get Risk Assessment</Text>
      </TouchableOpacity>
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Quick Actions</Text>
      <View style={styles.actionGrid}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push("/ai-assistant")}
        >
          <Text style={styles.actionButtonText}>AI Assistant</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push("/symptom-checker")}
        >
          <Text style={styles.actionButtonText}>Symptom Checker</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.messageButton]}
          onPress={() => router.push("/messages")}
        >
          <Text style={styles.actionButtonText}>Messages</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push("/pregnancy-profile")}
        >
          <Text style={styles.actionButtonText}>Pregnancy Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push("/profile")}
        >
          <Text style={styles.actionButtonText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.name}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {user?.role === "Mother" && renderHealthCard()}
        {user?.role === "Mother" && renderRiskCard()}
        {renderQuickActions()}

        {user?.role === "Doctor" && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Doctor Dashboard</Text>
            <Text style={styles.doctorInfo}>
              View patient health records and provide consultations
            </Text>
            <TouchableOpacity
              style={styles.cardButton}
              onPress={() => router.push("/patients")}
            >
              <Text style={styles.cardButtonText}>View Patients</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e1e8ed",
  },
  greeting: {
    fontSize: 14,
    color: "#7f8c8d",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#e74c3c",
    borderRadius: 6,
  },
  logoutText: {
    color: "#fff",
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 16,
  },
  healthDataContainer: {
    marginBottom: 16,
  },
  healthRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f3f4",
  },
  healthLabel: {
    fontSize: 14,
    color: "#7f8c8d",
  },
  healthValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2c3e50",
  },
  noDataText: {
    textAlign: "center",
    color: "#7f8c8d",
    fontStyle: "italic",
    marginBottom: 16,
  },
  cardButton: {
    backgroundColor: "#3498db",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  cardButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  riskIndicator: {
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  riskLevel: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  riskConfidence: {
    fontSize: 14,
    color: "#fff",
  },
  riskMessage: {
    fontSize: 14,
    color: "#2c3e50",
    textAlign: "center",
    marginBottom: 8,
  },
  predictionDate: {
    fontSize: 12,
    color: "#7f8c8d",
    textAlign: "center",
  },
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  actionButton: {
    width: (width - 72) / 2,
    backgroundColor: "#3498db",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  messageButton: {
    position: "relative",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  badge: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#e74c3c",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  doctorInfo: {
    fontSize: 14,
    color: "#7f8c8d",
    textAlign: "center",
    marginBottom: 16,
  },
});
