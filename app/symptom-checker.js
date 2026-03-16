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
import { aiAPI } from "../services/api";

export default function SymptomCheckerScreen({ navigation }) {
  const [symptomText, setSymptomText] = useState("");
  const [severity, setSeverity] = useState("Medium");
  const [analyzing, setAnalyzing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [symptomHistory, setSymptomHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const severityOptions = ["Low", "Medium", "High"];

  useEffect(() => {
    loadSymptomHistory();
  }, []);

  const loadSymptomHistory = async () => {
    try {
      setLoading(true);
      // This would need to be implemented in the backend
      // For now, we'll use a placeholder
      setSymptomHistory([]);
    } catch (error) {
      console.error("Symptom history load error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAnalyze = async () => {
    if (!symptomText.trim()) {
      Alert.alert("Error", "Please describe your symptoms");
      return;
    }

    if (symptomText.length < 5) {
      Alert.alert(
        "Error",
        "Please provide a more detailed symptom description",
      );
      return;
    }

    setAnalyzing(true);
    try {
      const response = await aiAPI.analyzeSymptom({
        symptom_text: symptomText.trim(),
        severity_level: severity,
      });

      showAnalysisResult(response.analysis, response.symptom);

      // Reload history if available
      loadSymptomHistory();
    } catch (error) {
      console.error("Symptom analysis error:", error);
      Alert.alert("Error", "Failed to analyze symptoms");
    } finally {
      setAnalyzing(false);
    }
  };

  const showAnalysisResult = (analysis, symptom) => {
    const riskColor = getRiskColor(analysis.prediction);
    const riskEmoji = getRiskEmoji(analysis.prediction);

    Alert.alert(
      `${riskEmoji} Symptom Analysis`,
      `Risk Level: ${analysis.prediction.toUpperCase()}\nConfidence: ${Math.round(analysis.confidence * 100)}%\n\nRecommendations:\n${analysis.recommendations.join("\n")}`,
      [
        { text: "OK", style: "default" },
        {
          text: "Contact Doctor",
          onPress: () => navigation.navigate("Messages"),
          style: analysis.prediction === "High" ? "destructive" : "default",
        },
      ],
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
    loadSymptomHistory();
  };

  const selectSeverity = (level) => {
    setSeverity(level);
  };

  const renderSeveritySelector = () => (
    <View style={styles.severityContainer}>
      <Text style={styles.severityLabel}>How severe are your symptoms?</Text>
      <View style={styles.severityButtons}>
        {severityOptions.map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.severityButton,
              severity === option && styles.severityButtonSelected,
              severity === option && {
                backgroundColor: getSeverityColor(option),
              },
            ]}
            onPress={() => selectSeverity(option)}
          >
            <Text
              style={[
                styles.severityButtonText,
                severity === option && styles.severityButtonTextSelected,
              ]}
            >
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const getSeverityColor = (level) => {
    switch (level) {
      case "High":
        return "#e74c3c";
      case "Medium":
        return "#f39c12";
      case "Low":
        return "#27ae60";
      default:
        return "#95a5a6";
    }
  };

  const renderCommonSymptoms = () => (
    <View style={styles.commonSymptomsContainer}>
      <Text style={styles.commonSymptomsTitle}>Common Pregnancy Symptoms</Text>
      <View style={styles.symptomsGrid}>
        {[
          "Headache",
          "Nausea",
          "Fatigue",
          "Swelling",
          "Back pain",
          "Dizziness",
          "Cramping",
          "Shortness of breath",
        ].map((symptom) => (
          <TouchableOpacity
            key={symptom}
            style={styles.symptomChip}
            onPress={() =>
              setSymptomText((prev) => (prev ? `${prev}, ${symptom}` : symptom))
            }
          >
            <Text style={styles.symptomChipText}>{symptom}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderEmergencyInfo = () => (
    <View style={styles.emergencyContainer}>
      <Text style={styles.emergencyTitle}>🚨 Emergency Symptoms</Text>
      <Text style={styles.emergencyText}>
        Seek immediate medical attention if you experience:
      </Text>
      <View style={styles.emergencyList}>
        <Text style={styles.emergencyItem}>• Severe abdominal pain</Text>
        <Text style={styles.emergencyItem}>• Vaginal bleeding</Text>
        <Text style={styles.emergencyItem}>
          • Severe headache with vision changes
        </Text>
        <Text style={styles.emergencyItem}>• Decreased fetal movement</Text>
        <Text style={styles.emergencyItem}>• Fever over 102°F (39°C)</Text>
        <Text style={styles.emergencyItem}>• Difficulty breathing</Text>
      </View>
      <TouchableOpacity
        style={styles.emergencyButton}
        onPress={() =>
          Alert.alert(
            "Emergency",
            "Please call 911 or go to the nearest emergency room immediately.",
          )
        }
      >
        <Text style={styles.emergencyButtonText}>Call Emergency Services</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Symptom Checker</Text>
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
          <Text style={styles.cardTitle}>AI Symptom Analysis</Text>
          <Text style={styles.cardSubtitle}>
            Describe your symptoms for AI-powered analysis and recommendations
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Describe your symptoms</Text>
            <TextInput
              style={styles.textInput}
              value={symptomText}
              onChangeText={setSymptomText}
              placeholder="e.g., I have been experiencing headaches and some swelling in my feet for the past two days..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={1000}
            />
            <Text style={styles.charCount}>{symptomText.length}/1000</Text>
          </View>

          {renderSeveritySelector()}

          <TouchableOpacity
            style={[styles.analyzeButton, analyzing && styles.buttonDisabled]}
            onPress={handleAnalyze}
            disabled={analyzing}
          >
            {analyzing ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.analyzeButtonText}>Analyze Symptoms</Text>
            )}
          </TouchableOpacity>
        </View>

        {renderCommonSymptoms()}
        {renderEmergencyInfo()}
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
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#e1e8ed",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#f8f9fa",
    minHeight: 100,
  },
  charCount: {
    fontSize: 12,
    color: "#7f8c8d",
    textAlign: "right",
    marginTop: 4,
  },
  severityContainer: {
    marginBottom: 20,
  },
  severityLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 12,
  },
  severityButtons: {
    flexDirection: "row",
    gap: 8,
  },
  severityButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e1e8ed",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  severityButtonSelected: {
    borderWidth: 2,
  },
  severityButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2c3e50",
  },
  severityButtonTextSelected: {
    color: "#fff",
  },
  analyzeButton: {
    backgroundColor: "#e67e22",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#bdc3c7",
  },
  analyzeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  commonSymptomsContainer: {
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
  commonSymptomsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 16,
  },
  symptomsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  symptomChip: {
    backgroundColor: "#ecf0f1",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#bdc3c7",
  },
  symptomChipText: {
    fontSize: 12,
    color: "#2c3e50",
    fontWeight: "500",
  },
  emergencyContainer: {
    backgroundColor: "#fdf2f2",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  emergencyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#dc2626",
    marginBottom: 8,
  },
  emergencyText: {
    fontSize: 14,
    color: "#7f1d1d",
    marginBottom: 12,
    fontWeight: "500",
  },
  emergencyList: {
    marginBottom: 16,
  },
  emergencyItem: {
    fontSize: 14,
    color: "#991b1b",
    marginBottom: 4,
  },
  emergencyButton: {
    backgroundColor: "#dc2626",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  emergencyButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
