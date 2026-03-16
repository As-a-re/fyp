import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../contexts/AuthContext";
import { messageAPI } from "../services/api";

export default function MessagesScreen({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const flatListRef = useRef(null);

  useEffect(() => {
    loadConversations();
    loadUnreadCount();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.user.id);
    }
  }, [selectedConversation]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await messageAPI.getConversations();
      setConversations(response.conversations || []);
    } catch (error) {
      console.error("Conversations load error:", error);
      Alert.alert("Error", "Failed to load conversations");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadMessages = async (userId) => {
    try {
      const response = await messageAPI.getConversation(userId);
      setMessages(response.messages || []);

      // Scroll to bottom when messages load
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error("Messages load error:", error);
      Alert.alert("Error", "Failed to load messages");
    }
  };

  const loadUnreadCount = async () => {
    try {
      const response = await messageAPI.getUnreadCount();
      setUnreadCount(response.unreadCount || 0);
    } catch (error) {
      console.error("Unread count load error:", error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    setSending(true);
    try {
      const response = await messageAPI.sendMessage({
        recipient_id: selectedConversation.user.id,
        message: newMessage.trim(),
        message_type: "text",
      });

      // Add new message to local state
      const newMsg = {
        ...response.data,
        is_from_me: true,
        sender: { name: user.name, role: user.role },
        recipient: selectedConversation.user,
      };

      setMessages((prev) => [...prev, newMsg]);
      setNewMessage("");

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error("Send message error:", error);
      Alert.alert("Error", "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadConversations();
    loadUnreadCount();
  };

  const selectConversation = (conversation) => {
    setSelectedConversation(conversation);
  };

  const backToConversations = () => {
    setSelectedConversation(null);
    loadConversations(); // Refresh conversations
  };

  const markAsRead = async (messageId) => {
    try {
      await messageAPI.markAsRead(messageId);
    } catch (error) {
      console.error("Mark as read error:", error);
    }
  };

  const renderConversationItem = ({ item }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => selectConversation(item)}
    >
      <View style={styles.conversationHeader}>
        <View style={styles.conversationInfo}>
          <Text style={styles.conversationName}>{item.user.name}</Text>
          <Text style={styles.conversationRole}>{item.user.role}</Text>
        </View>
        <View style={styles.conversationMeta}>
          <Text style={styles.conversationTime}>
            {new Date(item.lastMessage.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
      <Text style={styles.lastMessage} numberOfLines={2}>
        {item.lastMessage.is_from_me
          ? `You: ${item.lastMessage.message}`
          : item.lastMessage.message}
      </Text>
    </TouchableOpacity>
  );

  const renderMessageItem = ({ item }) => {
    const isFromMe = item.sender_id === user.id;

    return (
      <View
        style={[
          styles.messageItem,
          isFromMe ? styles.myMessage : styles.theirMessage,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isFromMe ? styles.myBubble : styles.theirBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isFromMe ? styles.myMessageText : styles.theirMessageText,
            ]}
          >
            {item.message}
          </Text>
          <Text
            style={[
              styles.messageTime,
              isFromMe ? styles.myMessageTime : styles.theirMessageTime,
            ]}
          >
            {new Date(item.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      </View>
    );
  };

  const renderConversationsList = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.placeholder} />
        <Text style={styles.headerTitle}>Messages</Text>
        <View style={styles.headerRight}>
          {unreadCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversationItem}
          keyExtractor={(item) => item.user.id}
          contentContainerStyle={styles.conversationsList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No conversations yet</Text>
              <Text style={styles.emptySubtext}>
                {user?.role === "Mother"
                  ? "Start a conversation with your doctor"
                  : "Wait for patients to message you"}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );

  const renderChatView = () => (
    <View style={styles.container}>
      <View style={styles.chatHeader}>
        <TouchableOpacity
          onPress={backToConversations}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.chatHeaderInfo}>
          <Text style={styles.chatHeaderName}>
            {selectedConversation.user.name}
          </Text>
          <Text style={styles.chatHeaderRole}>
            {selectedConversation.user.role}
          </Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessageItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.inputContainer}
      >
        <View style={styles.inputRow}>
          <TextInput
            style={styles.messageInput}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!newMessage.trim() || sending) && styles.sendButtonDisabled,
            ]}
            onPress={sendMessage}
            disabled={!newMessage.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.sendButtonText}>Send</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeContainer}>
      {selectedConversation ? renderChatView() : renderConversationsList()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  placeholder: {
    width: 40,
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  headerRight: {
    width: 40,
    alignItems: "flex-end",
  },
  headerBadge: {
    backgroundColor: "#e74c3c",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  headerBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  conversationsList: {
    padding: 16,
  },
  conversationItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  conversationRole: {
    fontSize: 12,
    color: "#7f8c8d",
    marginTop: 2,
  },
  conversationMeta: {
    alignItems: "flex-end",
  },
  conversationTime: {
    fontSize: 12,
    color: "#7f8c8d",
    marginBottom: 4,
  },
  unreadBadge: {
    backgroundColor: "#e74c3c",
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  unreadText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  lastMessage: {
    fontSize: 14,
    color: "#2c3e50",
    lineHeight: 18,
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
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e1e8ed",
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 20,
    color: "#3498db",
    fontWeight: "bold",
  },
  chatHeaderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  chatHeaderName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  chatHeaderRole: {
    fontSize: 12,
    color: "#7f8c8d",
    marginTop: 2,
  },
  messagesList: {
    padding: 16,
  },
  messageItem: {
    marginBottom: 12,
  },
  myMessage: {
    alignItems: "flex-end",
  },
  theirMessage: {
    alignItems: "flex-start",
  },
  messageBubble: {
    maxWidth: "80%",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  myBubble: {
    backgroundColor: "#3498db",
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#e1e8ed",
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  myMessageText: {
    color: "#fff",
  },
  theirMessageText: {
    color: "#2c3e50",
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  myMessageTime: {
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "right",
  },
  theirMessageTime: {
    color: "#7f8c8d",
  },
  inputContainer: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e1e8ed",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 16,
    gap: 12,
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e1e8ed",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    backgroundColor: "#f8f9fa",
  },
  sendButton: {
    backgroundColor: "#3498db",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#bdc3c7",
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
