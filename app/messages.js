import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
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
import { messageAPI } from "../services/api";

const ConversationItem = ({ item, onPress, colors }) => {
  // Handle both mock and real data formats
  const displayName = item.userName || item.user_name || item.name || "Unknown";
  const lastMsg = item.lastMessage || item.last_message || "No messages yet";
  const time = item.timestamp || "";
  const avatar =
    item.avatar ||
    "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=200";

  return (
    <TouchableOpacity
      style={[styles.conversationItem, { borderBottomColor: colors.border }]}
      onPress={onPress}
    >
      <Image source={{ uri: avatar }} style={styles.avatar} />
      <View style={styles.conversationText}>
        <Text style={[styles.userName, { color: colors.text }]}>
          {displayName}
        </Text>
        <Text style={[styles.lastMessage, { color: colors.textSecondary }]}>
          {lastMsg}
        </Text>
      </View>
      {time && (
        <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
          {time}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const MessageBubble = ({ message, colors, isSender }) => (
  <View
    style={[
      styles.messageBubble,
      isSender
        ? { backgroundColor: colors.primary, alignSelf: "flex-end" }
        : { backgroundColor: colors.card, alignSelf: "flex-start" },
    ]}
  >
    <Text
      style={[styles.messageText, { color: isSender ? "#fff" : colors.text }]}
    >
      {message.text}
    </Text>
  </View>
);

export default function MessagesScreen() {
  const { user } = useAuth();
  const colors = Colors.light;
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, []),
  );

  const loadConversations = async () => {
    setLoading(true);
    try {
      const response = await messageAPI.getConversations({ limit: 50 });
      const convList = response.conversations || [];
      setConversations(convList);
    } catch (error) {
      console.error("Error loading conversations:", error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = async (conversation) => {
    setSelectedConversation(conversation);
    try {
      const response = await messageAPI.getConversation(
        conversation.user_id || conversation.id,
      );
      setMessages(response.messages || []);
    } catch (error) {
      console.error("Error loading messages:", error);
      setMessages([]);
    }
  };

  const handleSendMessage = async () => {
    if (inputText.trim().length > 0) {
      setSending(true);
      try {
        await messageAPI.sendMessage({
          receiver_id: selectedConversation.user_id || selectedConversation.id,
          content: inputText,
        });
        // Reload messages after sending
        const response = await messageAPI.getConversation(
          selectedConversation.user_id || selectedConversation.id,
        );
        setMessages(response.messages || []);
        setInputText("");
      } catch (error) {
        console.error("Error sending message:", error);
      } finally {
        setSending(false);
      }
    }
  };

  if (selectedConversation) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
        >
          <View
            style={[styles.chatHeader, { borderBottomColor: colors.border }]}
          >
            <TouchableOpacity onPress={() => setSelectedConversation(null)}>
              <MaterialCommunityIcons
                name="arrow-left"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
            <Image
              source={{ uri: selectedConversation.avatar }}
              style={styles.chatAvatar}
            />
            <Text style={[styles.chatUserName, { color: colors.text }]}>
              {selectedConversation.userName}
            </Text>
          </View>

          <FlatList
            data={messages}
            renderItem={({ item }) => (
              <MessageBubble
                message={item}
                colors={colors}
                isSender={item.sender === "user"}
              />
            )}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesContainer}
            inverted
          />

          <View
            style={[styles.inputContainer, { backgroundColor: colors.card }]}
          >
            <TextInput
              style={[styles.textInput, { color: colors.text }]}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message..."
              placeholderTextColor={colors.textSecondary}
            />
            <TouchableOpacity
              onPress={handleSendMessage}
              disabled={sending}
              style={[
                styles.sendButton,
                { backgroundColor: colors.primary, opacity: sending ? 0.6 : 1 },
              ]}
            >
              <MaterialCommunityIcons name="send" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Messages</Text>
      </View>
      {conversations.length > 0 ? (
        <FlatList
          data={conversations}
          renderItem={({ item }) => (
            <ConversationItem
              item={item}
              onPress={() => handleSelectConversation(item)}
              colors={colors}
            />
          )}
          keyExtractor={(item) => item.id?.toString()}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No conversations yet
          </Text>
        </View>
      )}
      <BottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20 },
  title: { fontSize: 24, fontWeight: "bold" },
  conversationItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
  },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 15 },
  conversationText: { flex: 1 },
  userName: { fontSize: 16, fontWeight: "bold" },
  lastMessage: { fontSize: 14, marginTop: 2 },
  timestamp: { fontSize: 12 },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
  },
  chatAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginHorizontal: 10,
  },
  chatUserName: { fontSize: 18, fontWeight: "bold" },
  messagesContainer: { padding: 10, flexDirection: "column-reverse" },
  messageBubble: {
    padding: 12,
    borderRadius: 20,
    marginVertical: 5,
    maxWidth: "80%",
  },
  messageText: { fontSize: 16 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderTopWidth: 1,
  },
  textInput: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 15,
    backgroundColor: "#f0f0f0",
  },
  sendButton: {
    marginLeft: 10,
    padding: 10,
    borderRadius: 25,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
  },
});
