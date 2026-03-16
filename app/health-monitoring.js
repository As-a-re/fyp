import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { healthAPI } from "../services/api";

export default function HealthMonitoringScreen({ navigation }) {
  const [formData, setFormData] = useState({
    blood_pressure: "",
    blood_sugar: "",
    heart_rate: "",
    temperature: "",
    weight: "",
    oxygen_level: "",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [healthHistory, setHealthHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadHealthHistory();
  }, []);

  const loadHealthHistory = async () => {
    try {
      setLoading(true);
      const response = await healthAPI.getHealthHistory({ limit: 10 });
      setHealthHistory(response.records || []);
    } catch (error) {
      console.error("Health history load error:", error);
      Alert.alert("Error", "Failed to load health history");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const {
      blood_pressure,
      blood_sugar,
      heart_rate,
      temperature,
      weight,
      oxygen_level,
    } = formData;

    // Check if at least one field is filled
    const hasData = Object.values(formData).some(
      (value) => value.trim() !== "",
    );
    if (!hasData) {
      Alert.alert("Error", "Please enter at least one health metric");
      return false;
    }

    // Validate blood pressure format
    if (blood_pressure && !blood_pressure.match(/^\d{2,3}\/\d{2,3}$/)) {
      Alert.alert("Error", "Blood pressure must be in format 120/80");
      return false;
    }

    // Validate numeric fields
    if (
      blood_sugar &&
      (isNaN(blood_sugar) || blood_sugar < 0 || blood_sugar > 500)
    ) {
      Alert.alert("Error", "Blood sugar must be between 0-500 mg/dL");
      return false;
    }

    if (
      heart_rate &&
      (isNaN(heart_rate) || heart_rate < 40 || heart_rate > 200)
    ) {
      Alert.alert("Error", "Heart rate must be between 40-200 bpm");
      return false;
    }

    if (
      temperature &&
      (isNaN(temperature) || temperature < 95 || temperature > 105)
    ) {
      Alert.alert("Error", "Temperature must be between 95-105°F");
      return false;
    }

    if (weight && (isNaN(weight) || weight < 50 || weight > 500)) {
      Alert.alert("Error", "Weight must be between 50-500 lbs");
      return false;
    }

    if (
      oxygen_level &&
      (isNaN(oxygen_level) || oxygen_level < 70 || oxygen_level > 100)
    ) {
      Alert.alert("Error", "Oxygen level must be between 70-100%");
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      // Clean form data - only include non-empty fields
      const cleanData = Object.fromEntries(
        Object.entries(formData).filter(([_, value]) => value.trim() !== ""),
      );

      // Convert string numbers to actual numbers
      const numericData = {};
      Object.entries(cleanData).forEach(([key, value]) => {
        if (key !== "blood_pressure") {
          numericData[key] = parseFloat(value);
        } else {
          numericData[key] = value;
        }
      });

      const response = await healthAPI.recordHealth(numericData);

      Alert.alert("Success", "Health data recorded successfully");

      // Clear form
      setFormData({
        blood_pressure: "",
        blood_sugar: "",
        heart_rate: "",
        temperature: "",
        weight: "",
        oxygen_level: "",
      });

      // Reload history
      loadHealthHistory();
    } catch (error) {
      console.error("Health data save error:", error);
      Alert.alert("Error", "Failed to save health data");
    } finally {
      setSaving(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadHealthHistory();
  };

  const renderInputField = (
    label,
    field,
    placeholder,
    keyboardType = "default",
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={formData[field]}
        onChangeText={(value) => handleInputChange(field, value)}
        placeholder={placeholder}
        keyboardType={keyboardType}
      />
    </View>
  );

  const renderHealthHistory = () => (
    <View style={styles.historyContainer}>
      <Text style={styles.historyTitle}>Recent Health Records</Text>
      {healthHistory.length > 0 ? (
        healthHistory.map((record, index) => (
          <View key={record.id} style={styles.historyItem}>
            <Text style={styles.historyDate}>
              {new Date(record.recorded_at).toLocaleDateString()}{" "}
              {new Date(record.recorded_at).toLocaleTimeString()}
            </Text>
            <View style={styles.historyMetrics}>
              {record.blood_pressure && (
                <Text style={styles.historyMetric}>
                  BP: {record.blood_pressure}
                </Text>
              )}
              {record.blood_sugar && (
                <Text style={styles.historyMetric}>
                  Sugar: {record.blood_sugar} mg/dL
                </Text>
              )}
              {record.heart_rate && (
                <Text style={styles.historyMetric}>
                  HR: {record.heart_rate} bpm
                </Text>
              )}
              {record.temperature && (
                <Text style={styles.historyMetric}>
                  Temp: {record.temperature}°F
                </Text>
              )}
              {record.weight && (
                <Text style={styles.historyMetric}>
                  Weight: {record.weight} lbs
                </Text>
              )}
              {record.oxygen_level && (
                <Text style={styles.historyMetric}>
                  O₂: {record.oxygen_level}%
                </Text>
              )}
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.noHistoryText}>No health records found</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Health Monitoring</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.formCard}>
          <Text style={styles.cardTitle}>Record Health Data</Text>
          <Text style={styles.cardSubtitle}>
            Enter your current health measurements
          </Text>

          {renderInputField(
            "Blood Pressure",
            "blood_pressure",
            "120/80",
            "default",
          )}
          {renderInputField(
            "Blood Sugar (mg/dL)",
            "blood_sugar",
            "95",
            "numeric",
          )}
          {renderInputField("Heart Rate (bpm)", "heart_rate", "75", "numeric")}
          {renderInputField(
            "Temperature (°F)",
            "temperature",
            "98.6",
            "numeric",
          )}
          {renderInputField("Weight (lbs)", "weight", "150", "numeric")}
          {renderInputField(
            "Oxygen Level (%)",
            "oxygen_level",
            "98",
            "numeric",
          )}

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.saveButtonText}>Save Health Data</Text>
            )}
          </TouchableOpacity>
        </View>

        {!loading && renderHealthHistory()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
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
  backButton: {
    fontSize: 16,
    color: "#3498db",
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  placeholder: {
    width: 60,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#7f8c8d",
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e1e8ed",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#f8f9fa",
  },
  saveButton: {
    backgroundColor: "#27ae60",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: "#bdc3c7",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  historyContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 16,
  },
  historyItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f3f4",
  },
  historyDate: {
    fontSize: 12,
    color: "#7f8c8d",
    marginBottom: 4,
  },
  historyMetrics: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  historyMetric: {
    fontSize: 14,
    color: "#2c3e50",
    marginRight: 12,
    marginBottom: 4,
    fontWeight: "500",
  },
  noHistoryText: {
    textAlign: "center",
    color: "#7f8c8d",
    fontStyle: "italic",
    paddingVertical: 20,
  },
});
