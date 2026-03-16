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
import { useAuth } from "../contexts/AuthContext";

export default function PregnancyProfileScreen({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [profileData, setProfileData] = useState({
    due_date: "",
    last_menstrual_period: "",
    conception_date: "",
    first_trimester_screening: "",
    second_trimester_scan: "",
    third_trimester_scan: "",
    blood_type: "",
    rh_factor: "",
    allergies: "",
    medications: "",
    previous_pregnancies: "",
    complications: "",
  });

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    // This would load from backend API
    // For now, using placeholder data
    setLoading(false);
  };

  const handleInputChange = (field, value) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!profileData.due_date) {
      Alert.alert("Error", "Please enter your due date");
      return false;
    }

    // Validate date format (simple validation)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (profileData.due_date && !dateRegex.test(profileData.due_date)) {
      Alert.alert("Error", "Please enter date in YYYY-MM-DD format");
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      // This would save to backend API
      Alert.alert("Success", "Pregnancy profile updated successfully");
    } catch (error) {
      console.error("Profile save error:", error);
      Alert.alert("Error", "Failed to save pregnancy profile");
    } finally {
      setSaving(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProfileData();
  };

  const calculateGestationalAge = () => {
    if (!profileData.last_menstrual_period) return "Not calculated";

    const lmp = new Date(profileData.last_menstrual_period);
    const today = new Date();
    const diffTime = Math.abs(today - lmp);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(diffDays / 7);
    const days = diffDays % 7;

    return `${weeks} weeks, ${days} days`;
  };

  const calculateTrimester = () => {
    if (!profileData.last_menstrual_period) return "Unknown";

    const lmp = new Date(profileData.last_menstrual_period);
    const today = new Date();
    const diffTime = Math.abs(today - lmp);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(diffDays / 7);

    if (weeks <= 13) return "First Trimester";
    if (weeks <= 27) return "Second Trimester";
    return "Third Trimester";
  };

  const renderInputField = (
    label,
    field,
    placeholder,
    keyboardType = "default",
    multiline = false,
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.textArea]}
        value={profileData[field]}
        onChangeText={(value) => handleInputChange(field, value)}
        placeholder={placeholder}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
      />
    </View>
  );

  const renderProgressIndicator = () => (
    <View style={styles.progressCard}>
      <Text style={styles.cardTitle}>Pregnancy Progress</Text>
      <View style={styles.progressInfo}>
        <View style={styles.progressItem}>
          <Text style={styles.progressLabel}>Gestational Age:</Text>
          <Text style={styles.progressValue}>{calculateGestationalAge()}</Text>
        </View>
        <View style={styles.progressItem}>
          <Text style={styles.progressLabel}>Current Trimester:</Text>
          <Text style={styles.progressValue}>{calculateTrimester()}</Text>
        </View>
        <View style={styles.progressItem}>
          <Text style={styles.progressLabel}>Due Date:</Text>
          <Text style={styles.progressValue}>
            {profileData.due_date || "Not set"}
          </Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Loading pregnancy profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pregnancy Profile</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderProgressIndicator()}

        <View style={styles.formCard}>
          <Text style={styles.cardTitle}>Pregnancy Information</Text>

          {renderInputField(
            "Due Date (YYYY-MM-DD)",
            "due_date",
            "2024-12-15",
            "default",
          )}
          {renderInputField(
            "Last Menstrual Period (YYYY-MM-DD)",
            "last_menstrual_period",
            "2024-03-15",
            "default",
          )}
          {renderInputField(
            "Conception Date (YYYY-MM-DD)",
            "conception_date",
            "2024-03-30",
            "default",
          )}

          <Text style={styles.sectionTitle}>Important Dates & Scans</Text>
          {renderInputField(
            "First Trimester Screening Date",
            "first_trimester_screening",
            "2024-05-15",
            "default",
          )}
          {renderInputField(
            "Second Trimester Scan Date",
            "second_trimester_scan",
            "2024-07-15",
            "default",
          )}
          {renderInputField(
            "Third Trimester Scan Date",
            "third_trimester_scan",
            "2024-09-15",
            "default",
          )}
        </View>

        <View style={styles.formCard}>
          <Text style={styles.cardTitle}>Medical Information</Text>

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              {renderInputField("Blood Type", "blood_type", "O+", "default")}
            </View>
            <View style={styles.halfWidth}>
              {renderInputField(
                "RH Factor",
                "rh_factor",
                "Positive",
                "default",
              )}
            </View>
          </View>

          {renderInputField(
            "Allergies",
            "allergies",
            "Enter any known allergies",
            "default",
            true,
          )}
          {renderInputField(
            "Current Medications",
            "medications",
            "List current medications",
            "default",
            true,
          )}
        </View>

        <View style={styles.formCard}>
          <Text style={styles.cardTitle}>Pregnancy History</Text>

          {renderInputField(
            "Previous Pregnancies",
            "previous_pregnancies",
            "Number and outcomes of previous pregnancies",
            "default",
            true,
          )}
          {renderInputField(
            "Complications",
            "complications",
            "Any previous or current complications",
            "default",
            true,
          )}
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Save Profile</Text>
          )}
        </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#7f8c8d",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  progressCard: {
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
    marginBottom: 16,
  },
  progressInfo: {
    gap: 12,
  },
  progressItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f3f4",
  },
  progressLabel: {
    fontSize: 16,
    color: "#7f8c8d",
    fontWeight: "500",
  },
  progressValue: {
    fontSize: 16,
    color: "#2c3e50",
    fontWeight: "600",
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
    marginTop: 20,
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfWidth: {
    flex: 1,
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
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  saveButton: {
    backgroundColor: "#27ae60",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: "#bdc3c7",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
