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

import BottomNav from "../components/BottomNav";
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
    <View style={styles.welcomeContainer}>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name="robot"
            size={40}
            color={colors.primary}
          />
        </View>
        <Text style={[styles.welcomeTitle, { color: colors.text }]}>
          Start a video session with your AI maternal health assistant
        </Text>
        <TouchableOpacity
          style={[styles.startButton, { backgroundColor: colors.primary }]}
          onPress={handleStartSession}
          disabled={sessionLoading}
        >
          {sessionLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.startButtonText}>Start AI Session</Text>
          )}
        </TouchableOpacity>
      </View>
      <View
        style={[
          styles.infoBox,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          The AI assistant uses Tavus video AI to provide real-time maternal
          health guidance. It can answer questions about your pregnancy, explain
          test results, and offer wellness tips.
        </Text>
      </View>
    </View>
  );

  const renderActiveSession = () => (
    <View style={styles.activeSessionContainer}>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View
          style={[styles.listeningCircle, { backgroundColor: colors.primary }]}
        >
          <MaterialCommunityIcons name="robot" size={50} color="#fff" />
        </View>
        <Text style={[styles.listeningText, { color: colors.text }]}>
          AI Assistant is listening...
        </Text>
        <View style={styles.controlsContainer}>
          <TouchableOpacity style={styles.micButton}>
            <MaterialCommunityIcons
              name="microphone"
              size={30}
              color={colors.text}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.endButton, { backgroundColor: "#D9534F" }]}
            onPress={() => setSessionStarted(false)}
          >
            <Text style={styles.endButtonText}>End Session</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View
        style={[
          styles.infoBox,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          The AI assistant uses Tavus video AI to provide real-time maternal
          health guidance. It can answer questions about your pregnancy, explain
          test results, and offer wellness tips.
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <MaterialCommunityIcons
          name="robot-outline"
          size={28}
          color={colors.primary}
        />
        <Text style={[styles.title, { color: colors.text }]}>AI Assistant</Text>
      </View>
      {sessionStarted ? renderActiveSession() : renderWelcomeScreen()}
      <BottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginLeft: 10,
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  activeSessionContainer: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  card: {
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E0F5E9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 30,
  },
  startButton: {
    width: "100%",
    height: 50,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  startButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  infoBox: {
    marginTop: 20,
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
  },
  infoText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  listeningCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  listeningText: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 30,
  },
  controlsContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    justifyContent: "space-around",
  },
  micButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  endButton: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 15,
  },
  endButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
