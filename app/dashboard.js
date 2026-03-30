import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../constants/theme";
import { useAuth } from "../contexts/AuthContext";
import { healthAPI, predictionAPI } from "../services/api";

const { width } = Dimensions.get("window");

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const colors = Colors.light;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [healthData, setHealthData] = useState(null);
  const [latestPrediction, setLatestPrediction] = useState(null);
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const isMother = user?.role?.toLowerCase() === "mother";

      if (isMother) {
        // Load mother dashboard data
        const healthResponse = await healthAPI.getLatestHealth();
        if (healthResponse?.record) {
          setHealthData(healthResponse.record);
        }

        try {
          const predictionResponse = await predictionAPI.getPredictionHistory({
            limit: 1,
          });
          if (
            predictionResponse?.predictions &&
            predictionResponse.predictions.length > 0
          ) {
            setLatestPrediction(predictionResponse.predictions[0]);
          }
        } catch (_e) {
          console.log("Prediction not available");
        }
      } else {
        // Load doctor dashboard data (patients list)
        try {
          // This would come from a patients API endpoint
          setPatients([]);
        } catch (_e) {
          console.log("Patients data not available");
        }
      }
    } catch (error) {
      console.error("Dashboard data load error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const isMother = user?.role?.toLowerCase() === "mother";

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Greeting */}
        <View style={styles.greeting}>
          <Text style={[styles.greetingText, { color: colors.foreground }]}>
            Good morning,
          </Text>
          <Text style={[styles.greetingName, { color: colors.foreground }]}>
            {user?.name || "User"} 👋
          </Text>
        </View>

        {isMother ? (
          <>
            {/* Pregnancy Summary Card */}
            {healthData && (
              <LinearGradient
                colors={["#2d9d78", "#3eaf8f"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.pregnancyCard}
              >
                <View style={styles.pregnancyHeader}>
                  <View>
                    <Text style={styles.pregnancyLabel}>Pregnancy Summary</Text>
                    <Text style={styles.gestationalAge}>
                      {healthData.gestational_age || "?"}
                      <Text style={styles.weeksText}> weeks</Text>
                    </Text>
                  </View>
                  <MaterialCommunityIcons
                    name="baby"
                    size={40}
                    color="rgba(255, 255, 255, 0.7)"
                  />
                </View>
                <View style={styles.pregnancyFooter}>
                  <View style={styles.dueDate}>
                    <MaterialCommunityIcons
                      name="calendar"
                      size={14}
                      color="rgba(255, 255, 255, 0.8)"
                    />
                    <Text style={styles.dueDateText}>
                      Due: {healthData.due_date || "N/A"}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.riskBadge,
                      {
                        backgroundColor:
                          latestPrediction?.prediction === "high"
                            ? "rgba(220, 38, 38, 0.2)"
                            : "rgba(255, 255, 255, 0.2)",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.riskBadgeText,
                        {
                          color: "#ffffff",
                        },
                      ]}
                    >
                      {latestPrediction?.prediction?.toUpperCase() || "LOW"}{" "}
                      RISK
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            )}

            {/* Latest Vitals Grid */}
            {healthData && (
              <View>
                <Text
                  style={[styles.sectionTitle, { color: colors.foreground }]}
                >
                  Latest Vitals
                </Text>
                <View style={styles.vitalsGrid}>
                  {[
                    {
                      label: "BP",
                      icon: "heart",
                      value: healthData.blood_pressure || "N/A",
                      unit: "mmHg",
                    },
                    {
                      label: "HR",
                      icon: "heart-pulse",
                      value: healthData.heart_rate || "N/A",
                      unit: "bpm",
                    },
                    {
                      label: "SpO₂",
                      icon: "lung",
                      value: healthData.oxygen_level || "N/A",
                      unit: "%",
                    },
                    {
                      label: "Sugar",
                      icon: "water",
                      value: healthData.blood_sugar || "N/A",
                      unit: "mg/dL",
                    },
                    {
                      label: "Temp",
                      icon: "thermometer",
                      value: healthData.temperature || "N/A",
                      unit: "°C",
                    },
                    {
                      label: "Weight",
                      icon: "scale",
                      value: healthData.weight || "N/A",
                      unit: "kg",
                    },
                  ].map((vital, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.vitalCard,
                        { backgroundColor: colors.card },
                      ]}
                    >
                      <View
                        style={[
                          styles.vitalIconContainer,
                          { backgroundColor: colors.primary + "15" },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={vital.icon}
                          size={18}
                          color={colors.primary}
                        />
                      </View>
                      <Text
                        style={[styles.vitalLabel, { color: colors.muted }]}
                      >
                        {vital.label}
                      </Text>
                      <Text
                        style={[
                          styles.vitalValue,
                          { color: colors.foreground },
                        ]}
                      >
                        {vital.value}
                      </Text>
                      <Text style={[styles.vitalUnit, { color: colors.muted }]}>
                        {vital.unit}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Quick Actions */}
            <View>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Quick Actions
              </Text>
              <View style={styles.quickActionsGrid}>
                {[
                  {
                    label: "Record Health",
                    icon: "heart-pulse",
                    path: "/health-monitoring",
                  },
                  {
                    label: "Report Symptoms",
                    icon: "stethoscope",
                    path: "/symptom-checker",
                  },
                  {
                    label: "Talk to AI",
                    icon: "robot",
                    path: "/ai-assistant",
                  },
                  {
                    label: "Chat Doctor",
                    icon: "chat",
                    path: "/messages",
                  },
                ].map((action, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.quickActionCard,
                      { backgroundColor: colors.card },
                    ]}
                    onPress={() => router.push(action.path)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.actionIconContainer,
                        { backgroundColor: colors.primary + "15" },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={action.icon}
                        size={20}
                        color={colors.primary}
                      />
                    </View>
                    <Text
                      style={[styles.actionLabel, { color: colors.foreground }]}
                      numberOfLines={2}
                    >
                      {action.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        ) : (
          <>
            {/* Doctor Dashboard */}
            <View>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Today&apos;s Schedule
              </Text>
              {patients.length === 0 ? (
                <View
                  style={[styles.emptyState, { backgroundColor: colors.card }]}
                >
                  <MaterialCommunityIcons
                    name="clipboard-list"
                    size={40}
                    color={colors.muted}
                  />
                  <Text
                    style={[styles.emptyStateText, { color: colors.muted }]}
                  >
                    No appointments today
                  </Text>
                </View>
              ) : (
                <View>
                  {patients.map((patient) => (
                    <View
                      key={patient.id}
                      style={[
                        styles.appointmentCard,
                        {
                          backgroundColor: colors.card,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.patientAvatar,
                          { backgroundColor: colors.primary },
                        ]}
                      >
                        <Text style={styles.avatarText}>
                          {patient.name?.charAt(0)}
                        </Text>
                      </View>
                      <View style={styles.patientInfo}>
                        <Text
                          style={[
                            styles.patientName,
                            { color: colors.foreground },
                          ]}
                        >
                          {patient.name}
                        </Text>
                        <Text
                          style={[
                            styles.patientDetails,
                            { color: colors.muted },
                          ]}
                        >
                          {patient.gestational_age}w • Last seen:{" "}
                          {patient.last_checkup}
                        </Text>
                      </View>
                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={20}
                        color={colors.muted}
                      />
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Doctor Stats */}
            <View>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Statistics
              </Text>
              <View style={styles.statsGrid}>
                {[
                  {
                    label: "Total Patients",
                    value: "0",
                    icon: "account-multiple",
                  },
                  {
                    label: "High Risk",
                    value: "0",
                    icon: "alert-circle",
                  },
                  {
                    label: "Today's Visits",
                    value: "0",
                    icon: "calendar-check",
                  },
                ].map((stat, idx) => (
                  <View
                    key={idx}
                    style={[styles.statCard, { backgroundColor: colors.card }]}
                  >
                    <View
                      style={[
                        styles.statIconContainer,
                        { backgroundColor: colors.primary + "15" },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={stat.icon}
                        size={20}
                        color={colors.primary}
                      />
                    </View>
                    <Text
                      style={[styles.statValue, { color: colors.foreground }]}
                    >
                      {stat.value}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.muted }]}>
                      {stat.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  greeting: {
    marginBottom: 24,
  },
  greetingText: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 4,
  },
  greetingName: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  pregnancyCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  pregnancyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  pregnancyLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 6,
  },
  gestationalAge: {
    fontSize: 28,
    fontWeight: "700",
    color: "#ffffff",
  },
  weeksText: {
    fontSize: 16,
    fontWeight: "500",
  },
  pregnancyFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dueDate: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dueDateText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
  },
  riskBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  riskBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  vitalsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  vitalCard: {
    width: (width - 64) / 3,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  vitalIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  vitalLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 4,
  },
  vitalValue: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  vitalUnit: {
    fontSize: 9,
    fontWeight: "500",
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  quickActionCard: {
    width: (width - 64) / 2,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 16,
  },
  emptyState: {
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
    marginBottom: 24,
  },
  emptyStateText: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 12,
  },
  appointmentCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  patientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  patientDetails: {
    fontSize: 11,
    fontWeight: "400",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "500",
    textAlign: "center",
  },
});
