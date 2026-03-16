import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../contexts/AuthContext";

export default function IndexScreen() {
  const router = useRouter();
  const { loading, isAuthenticated, checkAuthStatus } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    // Check authentication status when app starts
    checkAuthStatus();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Prenatal Care System</Text>
          <Text style={styles.subtitle}>Loading your health data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return null; // This will redirect immediately after loading
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
    padding: 20,
  },
  loadingText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2c3e50",
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: "#7f8c8d",
    marginTop: 8,
  },
});
