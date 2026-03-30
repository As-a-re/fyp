import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TavusAIAssistant from "../components/TavusAIComponent";
import { Colors } from "../constants/theme";
import { aiAPI } from "../services/api";

export default function AIAssistantScreen() {
  const colors = Colors.light;
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);

  const handleStartSession = async () => {
    setSessionLoading(true);
    try {
      // Initialize conversation with backend
      const response = await aiAPI.createConversation({
        language: "en",
      });
      console.log("Session started:", response);
      setSessionStarted(true);
    } catch (error) {
      console.error("Error starting session:", error);
      // Still allow user to proceed even if session init fails
      setSessionStarted(true);
    } finally {
      setSessionLoading(false);
    }
  };

  const renderWelcomeScreen = () => (
    <View style={styles.sessionStartContainer}>
      <View style={styles.sessionStartContent}>
        {/* Decorative Background */}
        <View
          style={[
            styles.sessionStartBgCircle,
            { backgroundColor: colors.primary + "10" },
          ]}
        />

        {/* AI Avatar */}
        <View
          style={[
            styles.sessionStartAvatar,
            { backgroundColor: colors.primary },
          ]}
        >
          <MaterialCommunityIcons
            name="robot-happy"
            size={60}
            color="#ffffff"
          />
        </View>

        {/* Title */}
        <Text style={[styles.sessionStartTitle, { color: colors.foreground }]}>
          AI Health Assistant
        </Text>

        {/* Subtitle */}
        <Text style={[styles.sessionStartSubtitle, { color: colors.muted }]}>
          Your personal pregnancy health companion
        </Text>

        {/* Features List */}
        <View style={styles.sessionStartFeatures}>
          <View style={styles.featureItem}>
            <MaterialCommunityIcons
              name="check-circle"
              size={20}
              color={colors.primary}
            />
            <Text style={[styles.featureText, { color: colors.foreground }]}>
              24/7 Support
            </Text>
          </View>

          <View style={styles.featureItem}>
            <MaterialCommunityIcons
              name="check-circle"
              size={20}
              color={colors.primary}
            />
            <Text style={[styles.featureText, { color: colors.foreground }]}>
              Personalized Advice
            </Text>
          </View>

          <View style={styles.featureItem}>
            <MaterialCommunityIcons
              name="check-circle"
              size={20}
              color={colors.primary}
            />
            <Text style={[styles.featureText, { color: colors.foreground }]}>
              Confidential & Secure
            </Text>
          </View>
        </View>
      </View>

      {/* Start Button */}
      <View style={styles.sessionStartButtonContainer}>
        <TouchableOpacity
          style={[
            styles.sessionStartButton,
            { backgroundColor: colors.primary },
          ]}
          onPress={handleStartSession}
          disabled={sessionLoading}
        >
          {sessionLoading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <>
              <MaterialCommunityIcons
                name="chat-plus"
                size={20}
                color="#ffffff"
              />
              <Text style={styles.sessionStartButtonText}>
                Start Conversation
              </Text>
            </>
          )}
        </TouchableOpacity>
        <Text style={[styles.sessionStartPrivacy, { color: colors.muted }]}>
          Your conversations are kept private and secure
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {!sessionStarted ? renderWelcomeScreen() : <TavusAIAssistant />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // ========== Session Start Screen Styles ==========
  sessionStartContainer: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  sessionStartContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  sessionStartBgCircle: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    top: -40,
    opacity: 0.08,
  },
  sessionStartAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  sessionStartTitle: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  sessionStartSubtitle: {
    fontSize: 15,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 36,
    lineHeight: 22,
    opacity: 0.8,
  },
  sessionStartFeatures: {
    width: "100%",
    gap: 14,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  featureText: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
    lineHeight: 20,
  },
  sessionStartButtonContainer: {
    gap: 14,
    marginBottom: 20,
  },
  sessionStartButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  sessionStartButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  sessionStartPrivacy: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 16,
    opacity: 0.7,
  },
});
