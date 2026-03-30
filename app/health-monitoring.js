import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../constants/theme";
import { healthAPI } from "../services/api";

export default function HealthMonitoringScreen() {
  const colors = Colors.light;

  // Form states
  const [bloodPressure, setBloodPressure] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [bloodSugar, setBloodSugar] = useState("");
  const [temperature, setTemperature] = useState("");
  const [weight, setWeight] = useState("");
  const [oxygenLevel, setOxygenLevel] = useState("");
  const [formActive, setFormActive] = useState(false);
  const [saving, setSaving] = useState(false);

  // History states
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Memoized load function to prevent re-creation on each render
  const loadHealthHistory = useCallback(async () => {
    try {
      setLoading(true);
      const response = await healthAPI.getHealthHistory({ limit: 20 });
      if (response?.records) {
        setHistory(response.records);
      }
    } catch (error) {
      console.error("Failed to load health history:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Load history on mount
  React.useEffect(() => {
    loadHealthHistory();
  }, [loadHealthHistory]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadHealthHistory();
  }, [loadHealthHistory]);

  const validateForm = () => {
    const hasAtLeastOne =
      bloodPressure ||
      heartRate ||
      bloodSugar ||
      temperature ||
      weight ||
      oxygenLevel;

    if (!hasAtLeastOne) {
      Alert.alert("Error", "Please enter at least one vital sign");
      return false;
    }

    // Validate formats
    if (bloodPressure && !/^\d{2,3}\/\d{2,3}$/.test(bloodPressure)) {
      Alert.alert("Error", "Blood pressure format: 120/80");
      return false;
    }

    if (heartRate && (isNaN(heartRate) || heartRate < 40 || heartRate > 200)) {
      Alert.alert("Error", "Heart rate must be 40-200 bpm");
      return false;
    }

    if (
      bloodSugar &&
      (isNaN(bloodSugar) || bloodSugar < 0 || bloodSugar > 500)
    ) {
      Alert.alert("Error", "Blood sugar must be 0-500 mg/dL");
      return false;
    }

    if (
      temperature &&
      (isNaN(temperature) || temperature < 95 || temperature > 105)
    ) {
      Alert.alert("Error", "Temperature must be 95-105°F");
      return false;
    }

    if (weight && (isNaN(weight) || weight < 50 || weight > 500)) {
      Alert.alert("Error", "Weight must be 50-500 lbs");
      return false;
    }

    if (
      oxygenLevel &&
      (isNaN(oxygenLevel) || oxygenLevel < 70 || oxygenLevel > 100)
    ) {
      Alert.alert("Error", "Oxygen level must be 70-100%");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const data = {};
      if (bloodPressure) data.blood_pressure = bloodPressure;
      if (heartRate) data.heart_rate = parseInt(heartRate);
      if (bloodSugar) data.blood_sugar = parseFloat(bloodSugar);
      if (temperature) data.temperature = parseFloat(temperature);
      if (weight) data.weight = parseFloat(weight);
      if (oxygenLevel) data.oxygen_level = parseInt(oxygenLevel);

      await healthAPI.recordHealth(data);

      Alert.alert("Success", "Health data recorded successfully");
      resetForm();
      loadHealthHistory();
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to save health data");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setBloodPressure("");
    setHeartRate("");
    setBloodSugar("");
    setTemperature("");
    setWeight("");
    setOxygenLevel("");
    setFormActive(false);
  };

  // Memoized FormField component to prevent unnecessary re-renders
  const FormField = React.memo(
    ({
      icon,
      label,
      value,
      onChangeText,
      placeholder,
      unit,
      keyboardType = "decimal-pad",
    }) => (
      <View style={styles.fieldContainer}>
        <View
          style={[styles.fieldIcon, { backgroundColor: colors.primary + "15" }]}
        >
          <MaterialCommunityIcons
            name={icon}
            size={20}
            color={colors.primary}
          />
        </View>
        <View style={styles.fieldInput}>
          <Text style={[styles.fieldLabel, { color: colors.muted }]}>
            {label}
          </Text>
          <View
            style={[
              styles.inputWrapper,
              {
                borderColor: colors.border,
                backgroundColor: colors.background,
              },
            ]}
          >
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              placeholder={placeholder}
              placeholderTextColor={colors.muted + "80"}
              value={value}
              onChangeText={onChangeText}
              keyboardType={keyboardType}
              maxLength={10}
              editable={true}
              selectTextOnFocus={false}
            />
            {unit && (
              <Text style={[styles.unit, { color: colors.muted }]}>{unit}</Text>
            )}
          </View>
        </View>
      </View>
    ),
  );

  FormField.displayName = "FormField";

  // Memoized HistoryItem component to prevent unnecessary re-renders
  const HistoryItem = React.memo(({ item }) => (
    <View
      style={[
        styles.historyCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.historyHeader}>
        <Text style={[styles.historyDate, { color: colors.foreground }]}>
          {new Date(item.recorded_at).toLocaleDateString()}
        </Text>
        <Text style={[styles.historyTime, { color: colors.muted }]}>
          {new Date(item.recorded_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>

      <View style={styles.historyGrid}>
        {item.blood_pressure && (
          <View style={styles.historyItem}>
            <MaterialCommunityIcons
              name="heart-pulse"
              size={16}
              color={colors.primary}
            />
            <Text style={[styles.historyLabel, { color: colors.muted }]}>
              BP
            </Text>
            <Text style={[styles.historyValue, { color: colors.foreground }]}>
              {item.blood_pressure}
            </Text>
          </View>
        )}
        {item.heart_rate && (
          <View style={styles.historyItem}>
            <MaterialCommunityIcons
              name="heart"
              size={16}
              color={colors.primary}
            />
            <Text style={[styles.historyLabel, { color: colors.muted }]}>
              HR
            </Text>
            <Text style={[styles.historyValue, { color: colors.foreground }]}>
              {item.heart_rate} bpm
            </Text>
          </View>
        )}
        {item.blood_sugar && (
          <View style={styles.historyItem}>
            <MaterialCommunityIcons
              name="water"
              size={16}
              color={colors.primary}
            />
            <Text style={[styles.historyLabel, { color: colors.muted }]}>
              Sugar
            </Text>
            <Text style={[styles.historyValue, { color: colors.foreground }]}>
              {item.blood_sugar} mg/dL
            </Text>
          </View>
        )}
        {item.temperature && (
          <View style={styles.historyItem}>
            <MaterialCommunityIcons
              name="thermometer"
              size={16}
              color={colors.primary}
            />
            <Text style={[styles.historyLabel, { color: colors.muted }]}>
              Temp
            </Text>
            <Text style={[styles.historyValue, { color: colors.foreground }]}>
              {item.temperature}°F
            </Text>
          </View>
        )}
        {item.weight && (
          <View style={styles.historyItem}>
            <MaterialCommunityIcons
              name="weight"
              size={16}
              color={colors.primary}
            />
            <Text style={[styles.historyLabel, { color: colors.muted }]}>
              Weight
            </Text>
            <Text style={[styles.historyValue, { color: colors.foreground }]}>
              {item.weight} lbs
            </Text>
          </View>
        )}
        {item.oxygen_level && (
          <View style={styles.historyItem}>
            <MaterialCommunityIcons
              name="lungs"
              size={16}
              color={colors.primary}
            />
            <Text style={[styles.historyLabel, { color: colors.muted }]}>
              O2
            </Text>
            <Text style={[styles.historyValue, { color: colors.foreground }]}>
              {item.oxygen_level}%
            </Text>
          </View>
        )}
      </View>
    </View>
  ));

  HistoryItem.displayName = "HistoryItem";

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Form Section - Scrollable independently */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEnabled={formActive}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Health Monitoring
          </Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Track your vital signs
          </Text>
        </View>

        {/* Form Toggle */}
        <TouchableOpacity
          style={[
            styles.toggleButton,
            {
              backgroundColor: formActive ? colors.primary : colors.background,
              borderColor: colors.primary,
            },
          ]}
          onPress={() => setFormActive(!formActive)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name={formActive ? "check-circle" : "plus-circle"}
            size={20}
            color={formActive ? "#fff" : colors.primary}
          />
          <Text
            style={[
              styles.toggleText,
              {
                color: formActive ? "#fff" : colors.primary,
              },
            ]}
          >
            {formActive ? "Recording Mode" : "Record New Data"}
          </Text>
        </TouchableOpacity>

        {/* Form */}
        {formActive && (
          <View style={styles.formSection}>
            <FormField
              icon="heart-pulse"
              label="Blood Pressure"
              value={bloodPressure}
              onChangeText={setBloodPressure}
              placeholder="120/80"
              keyboardType="number-pad"
            />
            <FormField
              icon="heart"
              label="Heart Rate"
              value={heartRate}
              onChangeText={setHeartRate}
              placeholder="72"
              unit="bpm"
              keyboardType="number-pad"
            />
            <FormField
              icon="water"
              label="Blood Sugar"
              value={bloodSugar}
              onChangeText={setBloodSugar}
              placeholder="100"
              unit="mg/dL"
              keyboardType="decimal-pad"
            />
            <FormField
              icon="thermometer"
              label="Temperature"
              value={temperature}
              onChangeText={setTemperature}
              placeholder="98.6"
              unit="°F"
              keyboardType="decimal-pad"
            />
            <FormField
              icon="weight"
              label="Weight"
              value={weight}
              onChangeText={setWeight}
              placeholder="150"
              unit="lbs"
              keyboardType="decimal-pad"
            />
            <FormField
              icon="lungs"
              label="Oxygen Level"
              value={oxygenLevel}
              onChangeText={setOxygenLevel}
              placeholder="98"
              unit="%"
              keyboardType="number-pad"
            />

            <View style={styles.formButtons}>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={handleSubmit}
                disabled={saving}
                activeOpacity={0.8}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <MaterialCommunityIcons
                      name="check"
                      size={18}
                      color="#fff"
                    />
                    <Text style={styles.submitButtonText}>Save Data</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: colors.primary }]}
                onPress={resetForm}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={18}
                  color={colors.primary}
                />
                <Text
                  style={[styles.cancelButtonText, { color: colors.primary }]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* History Section Title - Always visible */}
        {!formActive && (
          <Text style={[styles.historyTitle, { color: colors.foreground }]}>
            Recent Records
          </Text>
        )}
      </ScrollView>

      {/* History List Section - Scrollable independently */}
      {!formActive && (
        <View style={styles.listContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : history.length > 0 ? (
            <FlatList
              data={history}
              renderItem={({ item }) => <HistoryItem item={item} />}
              keyExtractor={(item) => item.id?.toString() || item.recorded_at}
              contentContainerStyle={styles.listContent}
              scrollEnabled={true}
              nestedScrollEnabled={true}
              removeClippedSubviews={true}
              maxToRenderPerBatch={10}
              updateCellsBatchingPeriod={50}
              initialNumToRender={10}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={colors.primary}
                />
              }
            />
          ) : (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="heart-outline"
                size={48}
                color={colors.muted}
              />
              <Text style={[styles.emptyText, { color: colors.muted }]}>
                No health records yet
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.muted }]}>
                Start recording your vitals
              </Text>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 24,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  listContent: {
    paddingVertical: 12,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "400",
  },
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
    borderWidth: 1.5,
    gap: 10,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "700",
  },
  formSection: {
    marginBottom: 24,
    gap: 12,
  },
  fieldContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  fieldIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  fieldInput: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
  },
  unit: {
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 8,
  },
  formButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  submitButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    paddingVertical: 12,
    gap: 6,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  cancelButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    paddingVertical: 12,
    borderWidth: 1.5,
    gap: 6,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 12,
  },
  historyCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  historyDate: {
    fontSize: 13,
    fontWeight: "700",
  },
  historyTime: {
    fontSize: 12,
    fontWeight: "400",
  },
  historyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  historyItem: {
    alignItems: "center",
    width: "30%",
  },
  historyLabel: {
    fontSize: 10,
    fontWeight: "500",
    marginTop: 4,
  },
  historyValue: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    fontWeight: "400",
    marginTop: 4,
  },
});
