import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { messageAPI } from "../services/api";

export default function PatientsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const response = await messageAPI.getPatients();
      setPatients(response.patients || []);
    } catch (error) {
      console.error("Patients load error:", error);
      Alert.alert("Error", "Failed to load patients");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPatients();
  };

  const selectPatient = (patient) => {
    navigation.navigate("Messages", { selectedPatient: patient });
  };

  const renderPatientItem = ({ item }) => (
    <TouchableOpacity
      style={styles.patientItem}
      onPress={() => selectPatient(item)}
    >
      <View style={styles.patientInfo}>
        <Text style={styles.patientName}>{item.name}</Text>
        <Text style={styles.patientEmail}>{item.email}</Text>
        {item.phone && <Text style={styles.patientPhone}>{item.phone}</Text>}
      </View>
      <TouchableOpacity
        style={styles.messageButton}
        onPress={() => selectPatient(item)}
      >
        <Text style={styles.messageButtonText}>Message</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Loading patients...</Text>
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
        <Text style={styles.headerTitle}>My Patients</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={patients}
        renderItem={renderPatientItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.patientsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No patients found</Text>
            <Text style={styles.emptySubtext}>
              Patients will appear here once they send you messages
            </Text>
          </View>
        }
      />
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
  patientsList: {
    padding: 16,
  },
  patientItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 4,
  },
  patientEmail: {
    fontSize: 14,
    color: "#7f8c8d",
    marginBottom: 2,
  },
  patientPhone: {
    fontSize: 14,
    color: "#7f8c8d",
  },
  messageButton: {
    backgroundColor: "#3498db",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  messageButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: "#7f8c8d",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#95a5a6",
    textAlign: "center",
  },
});
