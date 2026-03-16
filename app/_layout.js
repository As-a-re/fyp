import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../contexts/AuthContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="dashboard" options={{ headerShown: false }} />
        <Stack.Screen
          name="health-monitoring"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="risk-assessment" options={{ headerShown: false }} />
        <Stack.Screen name="ai-assistant" options={{ headerShown: false }} />
        <Stack.Screen name="messages" options={{ headerShown: false }} />
        <Stack.Screen name="symptom-checker" options={{ headerShown: false }} />
        <Stack.Screen
          name="pregnancy-profile"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="profile" options={{ headerShown: false }} />
        <Stack.Screen name="patients" options={{ headerShown: false }} />
      </Stack>
    </AuthProvider>
  );
}
