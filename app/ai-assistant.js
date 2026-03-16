import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { aiAPI } from "../services/api";

export default function AIAssistantScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [startingSession, setStartingSession] = useState(false);
  const [endingSession, setEndingSession] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showWebView, setShowWebView] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const webViewRef = useRef(null);

  const languages = [
    { code: "en", name: "English", flag: "🇬🇧" },
    { code: "tw", name: "Twi", flag: "🇬🇭" },
  ];

  useEffect(() => {
    loadSessionData();
  }, []);

  const loadSessionData = async () => {
    try {
      setLoading(true);

      // Load active session
      const activeResponse = await aiAPI.getActiveSession();
      setActiveSession(activeResponse.session);

      // Load session history
      const historyResponse = await aiAPI.getSessions({ limit: 10 });
      setSessionHistory(historyResponse.sessions || []);
    } catch (error) {
      console.error("Session data load error:", error);
      Alert.alert("Error", "Failed to load session data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const startSession = async () => {
    setStartingSession(true);
    try {
      const response = await aiAPI.startSession({ language: selectedLanguage });
      setActiveSession(response.session);
      setShowWebView(true);

      if (response.warning) {
        Alert.alert("Demo Mode", response.warning);
      }
    } catch (error) {
      console.error("Start session error:", error);
      Alert.alert("Error", "Failed to start AI session");
    } finally {
      setStartingSession(false);
    }
  };

  const endSession = async () => {
    if (!activeSession) return;

    setEndingSession(true);
    try {
      await aiAPI.endSession(activeSession.session_id);
      setActiveSession(null);
      setShowWebView(false);
      loadSessionData(); // Reload session history
      Alert.alert("Success", "AI session ended successfully");
    } catch (error) {
      console.error("End session error:", error);
      Alert.alert("Error", "Failed to end AI session");
    } finally {
      setEndingSession(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadSessionData();
  };

  const handleWebViewMessage = (event) => {
    const data = JSON.parse(event.nativeEvent.data);

    if (data.type === "session_ended") {
      setShowWebView(false);
      setActiveSession(null);
      loadSessionData();
    }
  };

  const renderWebView = () => (
    <View style={styles.webViewContainer}>
      <View style={styles.webViewHeader}>
        <TouchableOpacity
          onPress={() => setShowWebView(false)}
          style={styles.webViewCloseButton}
        >
          <Text style={styles.webViewCloseText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.webViewTitle}>AI Assistant</Text>
        <TouchableOpacity onPress={endSession} style={styles.endSessionButton}>
          <Text style={styles.endSessionText}>End Session</Text>
        </TouchableOpacity>
      </View>

      <WebView
        ref={webViewRef}
        source={{ uri: activeSession.session_url }}
        style={styles.webView}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback={true}
        onMessage={handleWebViewMessage}
        onLoadStart={() => console.log("WebView loading started")}
        onLoadEnd={() => console.log("WebView loading ended")}
        onError={(error) => {
          console.error("WebView error:", error);
          Alert.alert("Error", "Failed to load AI assistant");
        }}
      />
    </View>
  );

  const renderSessionControls = () => (
    <View style={styles.sessionCard}>
      <Text style={styles.cardTitle}>AI Assistant Session</Text>
      <Text style={styles.cardSubtitle}>
        Connect with our AI-powered prenatal care assistant for personalized
        guidance
      </Text>

      {/* Language Selector */}
      <View style={styles.languageSelector}>
        <Text style={styles.languageLabel}>Preferred Language:</Text>
        <TouchableOpacity
          style={styles.languageButton}
          onPress={() => setShowLanguageModal(true)}
        >
          <Text style={styles.languageFlag}>
            {languages.find((lang) => lang.code === selectedLanguage)?.flag}
          </Text>
          <Text style={styles.languageText}>
            {languages.find((lang) => lang.code === selectedLanguage)?.name}
          </Text>
          <Text style={styles.languageDropdown}>▼</Text>
        </TouchableOpacity>
      </View>

      {activeSession ? (
        <View>
          <View style={styles.activeSessionInfo}>
            <Text style={styles.activeSessionText}>Session Active</Text>
            <Text style={styles.sessionTime}>
              Started: {new Date(activeSession.started_at).toLocaleTimeString()}
            </Text>
          </View>

          <View style={styles.sessionButtons}>
            <TouchableOpacity
              style={[styles.sessionButton, styles.resumeButton]}
              onPress={() => setShowWebView(true)}
            >
              <Text style={styles.sessionButtonText}>Resume Session</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sessionButton, styles.endButton]}
              onPress={endSession}
              disabled={endingSession}
            >
              {endingSession ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.sessionButtonText}>End Session</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.sessionButton, styles.startButton]}
          onPress={startSession}
          disabled={startingSession}
        >
          {startingSession ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.sessionButtonText}>Start AI Session</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );

  const renderSessionHistory = () => (
    <View style={styles.historyCard}>
      <Text style={styles.cardTitle}>Session History</Text>
      {sessionHistory.length > 0 ? (
        sessionHistory.map((session, index) => (
          <View key={session.id} style={styles.historyItem}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyDate}>
                {new Date(session.started_at).toLocaleDateString()}{" "}
                {new Date(session.started_at).toLocaleTimeString()}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      session.session_status === "active"
                        ? "#27ae60"
                        : "#95a5a6",
                  },
                ]}
              >
                <Text style={styles.statusText}>{session.session_status}</Text>
              </View>
            </View>
            {session.ended_at && (
              <Text style={styles.durationText}>
                Duration:{" "}
                {Math.round(
                  (new Date(session.ended_at) - new Date(session.started_at)) /
                    60000,
                )}{" "}
                minutes
              </Text>
            )}
          </View>
        ))
      ) : (
        <Text style={styles.noHistoryText}>No previous sessions found</Text>
      )}
    </View>
  );

  const renderFeatures = () => (
    <View style={styles.featuresCard}>
      <Text style={styles.cardTitle}>AI Assistant Features</Text>
      <View style={styles.featureList}>
        <View style={styles.featureItem}>
          <Text style={styles.featureEmoji}>🤰</Text>
          <Text style={styles.featureText}>Personalized prenatal guidance</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureEmoji}>💬</Text>
          <Text style={styles.featureText}>Real-time conversation support</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureEmoji}>🩺</Text>
          <Text style={styles.featureText}>
            Symptom analysis and explanation
          </Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureEmoji}>🌍</Text>
          <Text style={styles.featureText}>
            Multilingual support (English, Twi)
          </Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureEmoji}>📊</Text>
          <Text style={styles.featureText}>Health data interpretation</Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Loading AI Assistant...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (showWebView && activeSession) {
    return renderWebView();
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Assistant</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderSessionControls()}
        {renderFeatures()}
        {renderSessionHistory()}
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Language</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowLanguageModal(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {languages.map((language) => (
              <TouchableOpacity
                key={language.code}
                style={[
                  styles.languageOption,
                  selectedLanguage === language.code &&
                    styles.selectedLanguageOption,
                ]}
                onPress={() => {
                  setSelectedLanguage(language.code);
                  setShowLanguageModal(false);
                }}
              >
                <Text style={styles.languageOptionFlag}>{language.flag}</Text>
                <Text style={styles.languageOptionName}>{language.name}</Text>
                {selectedLanguage === language.code && (
                  <Text style={styles.selectedCheck}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
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
  sessionCard: {
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
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#7f8c8d",
    marginBottom: 20,
    lineHeight: 20,
  },
  activeSessionInfo: {
    backgroundColor: "#d5f4e6",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  activeSessionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#27ae60",
    marginBottom: 4,
  },
  sessionTime: {
    fontSize: 14,
    color: "#2c3e50",
  },
  sessionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  sessionButton: {
    flex: 1,
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  startButton: {
    backgroundColor: "#3498db",
  },
  resumeButton: {
    backgroundColor: "#27ae60",
  },
  endButton: {
    backgroundColor: "#e74c3c",
  },
  sessionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  featuresCard: {
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
  featureList: {
    marginTop: 16,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f3f4",
  },
  featureEmoji: {
    fontSize: 24,
    marginRight: 16,
  },
  featureText: {
    fontSize: 16,
    color: "#2c3e50",
    flex: 1,
  },
  historyCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    fontSize: 14,
    color: "#2c3e50",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  durationText: {
    fontSize: 12,
    color: "#7f8c8d",
  },
  noHistoryText: {
    textAlign: "center",
    color: "#7f8c8d",
    fontStyle: "italic",
    paddingVertical: 20,
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  webViewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e1e8ed",
  },
  webViewCloseButton: {
    padding: 8,
  },
  webViewCloseText: {
    fontSize: 20,
    color: "#7f8c8d",
  },
  webViewTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  endSessionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#e74c3c",
    borderRadius: 6,
  },
  endSessionText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  webView: {
    flex: 1,
  },
});
