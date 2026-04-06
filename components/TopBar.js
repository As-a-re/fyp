import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Colors } from "../constants/theme";
import { useAuth } from "../contexts/AuthContext";

export default function TopBar() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <Text style={styles.userName}>
          {user?.role === "doctor" ? "Dr. " : ""}
          {user?.name}
        </Text>
      </View>
      <TouchableOpacity
        onPress={handleLogout}
        style={styles.logoutButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <MaterialCommunityIcons name="logout" size={20} color="#94a3b8" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    zIndex: 10,
  },
  headerContent: {
    flex: 1,
  },
  subtext: {
    fontSize: 12,
    color: Colors.light.muted,
    fontWeight: "500",
  },
  userName: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.light.foreground,
    marginTop: 2,
  },
  logoutButton: {
    padding: 8,
  },
});
