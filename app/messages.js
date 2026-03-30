import { MaterialCommunityIcons } from "@expo/vector-icons";
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
import { Colors } from "../constants/theme";
import { useAuth } from "../contexts/AuthContext";
import { messageAPI } from "../services/api";

export default function MessagesScreen() {
  const { user } = useAuth();
  const colors = Colors.light;
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.user.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(
        () => flatListRef.current?.scrollToEnd({ animated: true }),
        100,
      );
    }
  }, [messages]);

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
    } catch (error) {
      console.error("Messages load error:", error);
      Alert.alert("Error", "Failed to load messages");
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const messageContent = newMessage.trim();
    setNewMessage("");
    setSending(true);

    // Add message optimistically
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender_id: user.id,
        message: messageContent,
        created_at: new Date().toISOString(),
      },
    ]);

    try {
      await messageAPI.sendMessage({
        recipient_id: selectedConversation.user.id,
        message: messageContent,
      });
      // Reload messages to get server confirmation
      loadMessages(selectedConversation.user.id);
    } catch (error) {
      console.error("Send message error:", error);
      Alert.alert("Error", "Failed to send message");
      // Remove optimistic message on error
      setMessages((prev) => prev.slice(0, -1));
      setNewMessage(messageContent);
    } finally {
      setSending(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };

  const renderMessage = (message) => {
    const isOwn = message.sender_id === user.id;

    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          isOwn ? styles.ownMessage : styles.otherMessage,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isOwn
              ? [styles.ownBubble, { backgroundColor: colors.primary }]
              : [
                  styles.otherBubble,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ],
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isOwn
                ? styles.ownMessageText
                : [styles.otherMessageText, { color: colors.foreground }],
            ]}
          >
            {message.content}
          </Text>
          <Text
            style={[
              styles.messageTime,
              isOwn ? styles.ownMessageTime : { color: colors.muted },
            ]}
          >
            {new Date(message.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      </View>
    );
  };

  const renderConversationItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.conversationItem,
        { backgroundColor: colors.card, borderColor: colors.border },
        selectedConversation?.id === item.id && {
          backgroundColor: colors.primary + "10",
          borderColor: colors.primary,
        },
      ]}
      onPress={() => setSelectedConversation(item)}
    >
      <View
        style={[styles.conversationAvatar, { backgroundColor: colors.primary }]}
      >
        <MaterialCommunityIcons
          name={item.user.role === "doctor" ? "stethoscope" : "baby-carriage"}
          size={24}
          color="#ffffff"
        />
      </View>
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={[styles.conversationName, { color: colors.foreground }]}>
            {item.user.name}
          </Text>
          <Text style={[styles.conversationTime, { color: colors.muted }]}>
            {new Date(item.last_message_at).toLocaleDateString()}
          </Text>
        </View>
        <Text
          numberOfLines={1}
          style={[styles.conversationPreview, { color: colors.muted }]}
        >
          {item.last_message}
        </Text>
      </View>
      {item.unread_count > 0 && (
        <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
          <Text style={styles.unreadText}>{item.unread_count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (selectedConversation) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View
          style={[
            styles.chatHeader,
            { backgroundColor: colors.card, borderBottomColor: colors.border },
          ]}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedConversation(null)}
          >
            <MaterialCommunityIcons
              name="chevron-left"
              size={28}
              color={colors.primary}
            />
          </TouchableOpacity>
          <View style={styles.chatHeaderContent}>
            <Text style={[styles.chatHeaderName, { color: colors.foreground }]}>
              {selectedConversation.user.name}
            </Text>
            <Text style={[styles.chatHeaderRole, { color: colors.muted }]}>
              {selectedConversation.user.role === "doctor"
                ? "Healthcare Provider"
                : "Patient"}
            </Text>
          </View>
          <View style={styles.chatHeaderPlaceholder} />
        </View>

        <KeyboardAvoidingView
          style={[styles.chatContainer, { backgroundColor: colors.background }]}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={100}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <MaterialCommunityIcons
                name="message-outline"
                size={48}
                color={colors.muted}
                style={{ marginBottom: 12 }}
              />
              <Text
                style={[styles.emptyStateTitle, { color: colors.foreground }]}
              >
                No messages yet
              </Text>
              <Text style={[styles.emptyStateText, { color: colors.muted }]}>
                Start the conversation by sending a message
              </Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={({ item }) => renderMessage(item)}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.messagesContent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={colors.primary}
                />
              }
              onContentSizeChange={() =>
                flatListRef.current?.scrollToEnd({ animated: true })
              }
            />
          )}

          <View
            style={[
              styles.inputContainer,
              { backgroundColor: colors.card, borderTopColor: colors.border },
            ]}
          >
            <View style={styles.inputWrapper}>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                    color: colors.foreground,
                  },
                ]}
                placeholder="Type a message..."
                placeholderTextColor={colors.muted}
                value={newMessage}
                onChangeText={setNewMessage}
                editable={!sending}
                multiline
                maxLength={1000}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  { backgroundColor: colors.primary },
                  (!newMessage.trim() || sending) && styles.sendButtonDisabled,
                ]}
                onPress={sendMessage}
                disabled={!newMessage.trim() || sending}
              >
                <MaterialCommunityIcons name="send" size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View
        style={[
          styles.header,
          { backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons
            name="chat-multiple"
            size={28}
            color={colors.primary}
          />
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Messages
          </Text>
        </View>
      </View>

      {conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="message-outline"
            size={48}
            color={colors.muted}
            style={{ marginBottom: 12 }}
          />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            No conversations yet
          </Text>
          <Text style={[styles.emptyText, { color: colors.muted }]}>
            Messages from your healthcare provider will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversationItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.conversationsList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingTop: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
  conversationsList: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  conversationItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginVertical: 6,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  conversationAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 14,
    fontWeight: "700",
  },
  conversationTime: {
    fontSize: 12,
  },
  conversationPreview: {
    fontSize: 13,
    fontWeight: "400",
  },
  unreadBadge: {
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  unreadText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingTop: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  chatHeaderContent: {
    flex: 1,
    marginLeft: 12,
  },
  chatHeaderName: {
    fontSize: 16,
    fontWeight: "700",
  },
  chatHeaderRole: {
    fontSize: 12,
    fontWeight: "500",
  },
  chatHeaderPlaceholder: {
    width: 40,
  },
  chatContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  messageContainer: {
    marginBottom: 12,
    flexDirection: "row",
  },
  ownMessage: {
    justifyContent: "flex-end",
  },
  otherMessage: {
    justifyContent: "flex-start",
  },
  messageBubble: {
    maxWidth: "85%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  ownBubble: {
    // backgroundColor set dynamically
  },
  otherBubble: {
    borderWidth: 1,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 4,
  },
  ownMessageText: {
    color: "#ffffff",
    fontWeight: "500",
  },
  otherMessageText: {
    fontWeight: "500",
  },
  messageTime: {
    fontSize: 11,
    opacity: 0.6,
    marginTop: 4,
  },
  ownMessageTime: {
    color: "#ffffff",
    fontSize: 11,
    opacity: 0.6,
    marginTop: 4,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: "center",
  },
  inputContainer: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },
  textInput: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    borderRadius: 10,
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2d9d78",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  sendButtonDisabled: {
    backgroundColor: "#cbd5e1",
    shadowOpacity: 0,
  },
});
