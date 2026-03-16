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
import { healthAPI, predictionAPI } from "../services/api";

export default function RiskAssessmentScreen({ navigation }) {
  const [formData, setFormData] = useState({
    maternal_age: "",
    gestational_age: "",
    blood_pressure: "",
    blood_sugar: "",
    heart_rate: "",
    temperature: "",
  });
  const [loading, setLoading] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [predictionHistory, setPredictionHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [autoFillData, setAutoFillData] = useState({});

  useEffect(() => {
    loadPredictionHistory();
    loadLatestHealthData();
  }, []);

  const loadLatestHealthData = async () => {
    try {
      const response = await healthAPI.getLatestHealth();
      if (response.record) {
        const healthData = response.record;
        setAutoFillData({
          blood_pressure: healthData.blood_pressure || "",
          blood_sugar: healthData.blood_sugar?.toString() || "",
          heart_rate: healthData.heart_rate?.toString() || "",
          temperature: healthData.temperature?.toString() || "",
        });
      }
    } catch (error) {
      console.error("Failed to load latest health data:", error);
    }
  };

  const loadPredictionHistory = async () => {
    try {
      setLoading(true);
      const response = await predictionAPI.getPredictionHistory({ limit: 10 });
      setPredictionHistory(response.predictions || []);
    } catch (error) {
      console.error("Prediction history load error:", error);
      Alert.alert("Error", "Failed to load prediction history");
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
      maternal_age,
      gestational_age,
      blood_pressure,
      blood_sugar,
      heart_rate,
      temperature,
    } = formData;

    // Check if at least one field is filled
    const hasData = Object.values(formData).some(
      (value) => value.trim() !== "",
    );
    if (!hasData) {
      Alert.alert(
        "Error",
        "Please enter at least one health metric for assessment",
      );
      return false;
    }

    // Validate maternal age
    if (
      maternal_age &&
      (isNaN(maternal_age) || maternal_age < 12 || maternal_age > 55)
    ) {
      Alert.alert("Error", "Maternal age must be between 12-55 years");
      return false;
    }

    // Validate gestational age
    if (
      gestational_age &&
      (isNaN(gestational_age) || gestational_age < 0 || gestational_age > 42)
    ) {
      Alert.alert("Error", "Gestational age must be between 0-42 weeks");
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

    return true;
  };

  const handlePredict = async () => {
    if (!validateForm()) return;

    setPredicting(true);
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

      const response = await predictionAPI.predictRisk(numericData);

      // Show prediction result
      showPredictionResult(response.prediction);

      // Reload history
      loadPredictionHistory();
    } catch (error) {
      console.error("Risk prediction error:", error);
      Alert.alert("Error", "Failed to generate risk prediction");
    } finally {
      setPredicting(false);
    }
  };

  const showPredictionResult = (prediction) => {
    const { risk, confidence, recommendations } = prediction;
    const riskColor = getRiskColor(risk);
    const riskEmoji = getRiskEmoji(risk);

    Alert.alert(
      `${riskEmoji} Risk Assessment Result`,
      `Risk Level: ${risk.toUpperCase()}\nConfidence: ${Math.round(confidence * 100)}%\n\nRecommendations:\n${recommendations.join("\n")}`,
      [{ text: "OK", style: "default" }],
    );
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

  const getRiskEmoji = (risk) => {
    switch (risk?.toLowerCase()) {
      case "high":
        return "🚨";
      case "medium":
        return "⚠️";
      case "low":
        return "✅";
      default:
        return "❓";
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPredictionHistory();
    loadLatestHealthData();
  };

  const autoFillLatestData = () => {
    setFormData((prev) => ({ ...prev, ...autoFillData }));
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

  const renderPredictionHistory = () => (
    <View style={styles.historyContainer}>
      <Text style={styles.historyTitle}>Prediction History</Text>
      {predictionHistory.length > 0 ? (
        predictionHistory.map((prediction, index) => (
          <View key={prediction.id} style={styles.historyItem}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyDate}>
                {new Date(prediction.created_at).toLocaleDateString()}{" "}
                {new Date(prediction.created_at).toLocaleTimeString()}
              </Text>
              <View
                style={[
                  styles.riskBadge,
                  { backgroundColor: getRiskColor(prediction.prediction) },
                ]}
              >
                <Text style={styles.riskBadgeText}>
                  {prediction.prediction.toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={styles.confidenceText}>
              Confidence: {Math.round(prediction.confidence * 100)}%
            </Text>
            <Text style={styles.modelText}>
              Model: {prediction.model_version}
            </Text>
          </View>
        ))
      ) : (
        <Text style={styles.noHistoryText}>No predictions found</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Risk Assessment</Text>
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
          <Text style={styles.cardTitle}>AI Risk Assessment</Text>
          <Text style={styles.cardSubtitle}>
            Enter health data for pregnancy risk prediction
          </Text>

          {Object.keys(autoFillData).some((key) => autoFillData[key]) && (
            <TouchableOpacity
              style={styles.autoFillButton}
              onPress={autoFillLatestData}
            >
              <Text style={styles.autoFillButtonText}>
                Auto-fill Latest Data
              </Text>
            </TouchableOpacity>
          )}

          {renderInputField(
            "Maternal Age (years)",
            "maternal_age",
            "28",
            "numeric",
          )}
          {renderInputField(
            "Gestational Age (weeks)",
            "gestational_age",
            "20",
            "numeric",
          )}
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

          <TouchableOpacity
            style={[styles.predictButton, predicting && styles.buttonDisabled]}
            onPress={handlePredict}
            disabled={predicting}
          >
            {predicting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.predictButtonText}>
                Generate Risk Assessment
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {!loading && renderPredictionHistory()}
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
  autoFillButton: {
    backgroundColor: "#ecf0f1",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#bdc3c7",
  },
  autoFillButtonText: {
    color: "#2c3e50",
    fontSize: 14,
    fontWeight: "600",
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
  predictButton: {
    backgroundColor: "#9b59b6",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: "#bdc3c7",
  },
  predictButtonText: {
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
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  historyDate: {
    fontSize: 12,
    color: "#7f8c8d",
    flex: 1,
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  riskBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  confidenceText: {
    fontSize: 14,
    color: "#2c3e50",
    marginBottom: 4,
  },
  modelText: {
    fontSize: 12,
    color: "#7f8c8d",
  },
  noHistoryText: {
    textAlign: "center",
    color: "#7f8c8d",
    fontStyle: "italic",
    paddingVertical: 20,
  },
});
