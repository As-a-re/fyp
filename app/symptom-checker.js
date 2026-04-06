import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BottomNav from "../components/BottomNav";
import { Colors } from "../constants/theme";
import { useAuth } from "../contexts/AuthContext";

const SeverityOption = ({ label, selected, onPress, colors }) => (
  <TouchableOpacity
    style={[
      styles.severityOption,
      {
        backgroundColor: selected ? colors.primary : colors.card,
        borderColor: selected ? colors.primary : colors.border,
      },
    ]}
    onPress={onPress}
  >
    <Text
      style={[styles.severityLabel, { color: selected ? "#fff" : colors.text }]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

export default function SymptomCheckerScreen() {
  const { user } = useAuth();
  const colors = Colors.light;
  const [symptoms, setSymptoms] = useState("");
  const [duration, setDuration] = useState("");
  const [severity, setSeverity] = useState(null);
  const [image, setImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSubmit = () => {
    if (!symptoms || !duration || !severity) {
      Alert.alert("Missing Information", "Please fill out all fields.");
      return;
    }
    setSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setSubmitting(false);
      Alert.alert(
        "Submission Received",
        "A healthcare professional will review your symptoms and get back to you shortly.",
      );
      // Reset form
      setSymptoms("");
      setDuration("");
      setSeverity(null);
      setImage(null);
    }, 1500);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              Symptom Checker
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={[styles.label, { color: colors.text }]}>
              Describe your symptoms
            </Text>
            <TextInput
              style={[
                styles.textInput,
                styles.largeInput,
                {
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={symptoms}
              onChangeText={setSymptoms}
              placeholder="e.g., headache, nausea, fatigue"
              placeholderTextColor={colors.textSecondary}
              multiline
            />

            <Text style={[styles.label, { color: colors.text }]}>Duration</Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={duration}
              onChangeText={setDuration}
              placeholder="e.g., 2 days"
              placeholderTextColor={colors.textSecondary}
            />

            <Text style={[styles.label, { color: colors.text }]}>Severity</Text>
            <View style={styles.severityContainer}>
              {["Mild", "Moderate", "Severe"].map((level) => (
                <SeverityOption
                  key={level}
                  label={level}
                  selected={severity === level}
                  onPress={() => setSeverity(level)}
                  colors={colors}
                />
              ))}
            </View>

            <Text style={[styles.label, { color: colors.text }]}>
              Upload a photo (optional)
            </Text>
            <TouchableOpacity
              style={[
                styles.imagePicker,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
              onPress={pickImage}
            >
              {image ? (
                <Image source={{ uri: image }} style={styles.imagePreview} />
              ) : (
                <View style={styles.imagePickerContent}>
                  <MaterialCommunityIcons
                    name="camera-plus-outline"
                    size={32}
                    color={colors.textSecondary}
                  />
                  <Text style={{ color: colors.textSecondary }}>
                    Tap to upload
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: colors.primary },
                submitting && styles.submittingButton,
              ]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              <Text style={styles.submitButtonText}>
                {submitting ? "Submitting..." : "Submit for Review"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <BottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 80 },
  header: { padding: 20 },
  title: { fontSize: 24, fontWeight: "bold" },
  form: { paddingHorizontal: 20 },
  label: { fontSize: 16, fontWeight: "600", marginBottom: 10 },
  textInput: {
    height: 50,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
    borderWidth: 1,
  },
  largeInput: {
    height: 120,
    textAlignVertical: "top",
    paddingTop: 15,
  },
  severityContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  severityOption: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 5,
    borderWidth: 1,
  },
  severityLabel: { fontSize: 14, fontWeight: "600" },
  imagePicker: {
    height: 150,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  imagePickerContent: { alignItems: "center" },
  imagePreview: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  submitButton: {
    height: 50,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  submittingButton: { opacity: 0.7 },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
