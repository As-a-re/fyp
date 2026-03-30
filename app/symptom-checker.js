import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../constants/theme";
import { aiAPI } from "../services/api";

export default function SymptomCheckerScreen() {
  const router = useRouter();
  const colors = Colors.light;
  const [symptomText, setSymptomText] = useState("");
  const [severity, setSeverity] = useState("medium");
  const [analyzing, setAnalyzing] = useState(false);

  const severityOptions = [
    { label: "Low", value: "low", icon: "emoticon-happy", color: "#3db870" },
    {
      label: "Medium",
      value: "medium",
      icon: "emoticon-neutral",
      color: "#ffa500",
    },
    { label: "High", value: "high", icon: "emoticon-sad", color: "#dc2626" },
  ];

  const handleAnalyze = async () => {
    if (!symptomText.trim()) {
      Alert.alert("Error", "Please describe your symptoms");
      return;
    }

    if (symptomText.length < 5) {
      Alert.alert("Error", "Please provide more details about your symptoms");
      return;
    }

    setAnalyzing(true);
    try {
      const response = await aiAPI.analyzeSymptom({
        symptom_text: symptomText.trim(),
        severity_level: severity,
      });

      showAnalysisResult(response.analysis, response.symptom);
      setSymptomText("");
    } catch (error) {
      console.error("Symptom analysis error:", error);
      Alert.alert("Error", "Failed to analyze symptoms. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const showAnalysisResult = (analysis, symptom) => {
    const riskLevel = analysis.prediction?.toLowerCase() || "low";
    const riskEmoji = getRiskEmoji(riskLevel);

    Alert.alert(
      `${riskEmoji} Analysis Result`,
      `Risk Level: ${riskLevel.toUpperCase()}\nConfidence: ${Math.round(analysis.confidence * 100)}%\n\n${analysis.recommendations?.join("\n") || "Monitor your symptoms"}`,
      [
        { text: "OK", style: "default" },
        {
          text: "Contact Doctor",
          onPress: () => router.push("/messages"),
          style: riskLevel === "high" ? "destructive" : "default",
        },
      ],
    );
  };

  const getRiskEmoji = (risk) => {
    switch (risk) {
      case "high":
        return "🚨";
      case "medium":
        return "⚠️";
      case "low":
      default:
        return "✅";
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Symptom Checker
          </Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Describe your symptoms for analysis
          </Text>
        </View>

        {/* Symptom Input */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
            Describe Your Symptoms
          </Text>
          <TextInput
            style={[
              styles.textArea,
              {
                borderColor: colors.border,
                backgroundColor: colors.background,
                color: colors.foreground,
              },
            ]}
            placeholder="e.g., I have been experiencing mild nausea and dizziness..."
            placeholderTextColor={colors.muted}
            multiline
            numberOfLines={5}
            value={symptomText}
            onChangeText={setSymptomText}
            editable={!analyzing}
            textAlignVertical="top"
          />
          <Text style={[styles.characterCount, { color: colors.muted }]}>
            {symptomText.length} characters
          </Text>
        </View>

        {/* Severity Selector */}
        <View style={styles.severitySection}>
          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
            Symptom Severity
          </Text>
          <View style={styles.severityGrid}>
            {severityOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.severityButton,
                  {
                    backgroundColor:
                      severity === option.value
                        ? option.color + "20"
                        : colors.background,
                    borderColor:
                      severity === option.value ? option.color : colors.border,
                  },
                ]}
                onPress={() => setSeverity(option.value)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name={option.icon}
                  size={24}
                  color={option.color}
                />
                <Text style={[styles.severityLabel, { color: option.color }]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Analysis Button */}
        <TouchableOpacity
          style={[
            styles.analyzeButton,
            analyzing && styles.analyzeButtonDisabled,
          ]}
          onPress={handleAnalyze}
          disabled={analyzing}
          activeOpacity={0.8}
        >
          {analyzing ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <>
              <MaterialCommunityIcons
                name="magnify"
                size={18}
                color="#ffffff"
              />
              <Text style={styles.analyzeButtonText}>Analyze Symptoms</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Info Section */}
        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <View style={styles.infoHeader}>
            <MaterialCommunityIcons
              name="information"
              size={20}
              color={colors.primary}
            />
            <Text style={[styles.infoTitle, { color: colors.foreground }]}>
              About This Tool
            </Text>
          </View>
          <Text style={[styles.infoText, { color: colors.muted }]}>
            This symptom checker is designed to provide general health
            information and help you understand potential concerns. It is not a
            substitute for professional medical advice.
          </Text>
          <Text style={[styles.infoText, { color: colors.muted }]}>
            If you experience severe symptoms or have concerns, please contact
            your doctor immediately.
          </Text>
        </View>

        {/* Emergency Alert */}
        <View style={[styles.emergencyCard, { backgroundColor: "#dc262610" }]}>
          <View style={styles.emergencyHeader}>
            <MaterialCommunityIcons
              name="alert-circle"
              size={20}
              color="#dc2626"
            />
            <Text style={[styles.emergencyTitle, { color: "#dc2626" }]}>
              Emergency Signs
            </Text>
          </View>
          <Text style={[styles.emergencyText, { color: "#7f1d1d" }]}>
            Seek immediate medical attention if you experience:
          </Text>
          <View style={styles.emergencyList}>
            {[
              "Severe vaginal bleeding",
              "Abdominal pain or cramping",
              "Loss of consciousness",
              "Difficulty breathing",
              "Chest pain",
            ].map((item, idx) => (
              <View key={idx} style={styles.emergencyItem}>
                <MaterialCommunityIcons
                  name="circle-small"
                  size={14}
                  color="#dc2626"
                />
                <Text style={[styles.emergencyItemText, { color: "#7f1d1d" }]}>
                  {item}
                </Text>
              </View>
            ))}
          </View>
        </View>
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
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "500",
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 120,
  },
  characterCount: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 8,
    textAlign: "right",
  },
  severitySection: {
    marginBottom: 20,
  },
  severityGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  severityButton: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  severityLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  analyzeButton: {
    backgroundColor: "#2d9d78",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 8,
    paddingVertical: 14,
    marginBottom: 20,
  },
  analyzeButtonDisabled: {
    backgroundColor: "#cbd5e1",
  },
  analyzeButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
  },
  infoCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#2d9d78",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  infoText: {
    fontSize: 12,
    fontWeight: "400",
    lineHeight: 16,
    marginBottom: 8,
  },
  emergencyCard: {
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: "#dc2626",
  },
  emergencyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  emergencyTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  emergencyText: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 10,
  },
  emergencyList: {
    gap: 6,
  },
  emergencyItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  emergencyItemText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
