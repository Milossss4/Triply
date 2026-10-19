import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, TextInput, Keyboard, ScrollView, ActivityIndicator, KeyboardAvoidingView, DeviceEventEmitter } from 'react-native';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '@/api/apiClient';
import { useFocusEffect } from 'expo-router';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
}

interface AiResponse {
  content: string;
  isUserMessage: boolean;
  sentAt: string;
}

interface HistoryItem {
  id?: string;
  content: string;
  isUserMessage: boolean;
  sentAt?: string;
}

export default function ChatPage() {
  const [listening, setListening] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);

  const insets = useSafeAreaInsets();
  const textBeforeListening = useRef('');
  const pulse = useRef(new Animated.Value(1)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  // Pobieranie historii czatu przy załadowaniu komponentu
  useFocusEffect(
    useCallback(() => {
      const fetchHistory = async () => {
        setIsHistoryLoading(true);
        try {
          const response = await apiClient.get<HistoryItem[]>('/ai/chat/history');
          const historyData = response.data;

          if (Array.isArray(historyData) && historyData.length > 0) {
            const mappedMessages: Message[] = historyData.map((item, index) => ({
              id: item.id || `history-${index}-${Date.now()}`,
              text: item.content,
              sender: item.isUserMessage ? 'user' : 'ai',
            }));
            setMessages(mappedMessages);
          } else {
            setMessages([]);
          }
        } catch (error) {
          console.log("Błąd pobierania historii czatu:", error);
        } finally {
          setIsHistoryLoading(false);
        }
      };

      fetchHistory();

      return () => { };
    }, [])
  );

  // Obsługa zdarzenia czyszczenia historii
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('event.chat.clearHistory', () => {
      setMessages([]);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Animacja przycisku mikrofonu
  useEffect(() => {
    if (listening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.2, duration: 600, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1.0, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulse.setValue(1);
    }
  }, [listening, pulse]);

  // Obsługa zdarzeń rozpoznawania mowy
  useEffect(() => {
    const startListener = ExpoSpeechRecognitionModule.addListener('start', () => {
      setListening(true);
      textBeforeListening.current = inputText;
    });
    const endListener = ExpoSpeechRecognitionModule.addListener('end', () => setListening(false));
    const resultListener = ExpoSpeechRecognitionModule.addListener('result', (event) => {
      const transcript = event.results?.[0]?.transcript ?? '';
      if (transcript) {
        const prefix = textBeforeListening.current ? textBeforeListening.current + ' ' : '';
        setInputText(prefix + transcript);
      }
    });
    const errorListener = ExpoSpeechRecognitionModule.addListener('error', () => setListening(false));

    return () => {
      startListener.remove();
      endListener.remove();
      resultListener.remove();
      errorListener.remove();
    };
  }, [inputText]);

  // Obsługa klawiatury
  useEffect(() => {
    const showListener = Keyboard.addListener('keyboardDidShow', () => setIsKeyboardVisible(true));
    const hideListener = Keyboard.addListener('keyboardDidHide', () => setIsKeyboardVisible(false));
    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  // Automatyczne przewijanie do dołu przy nowych wiadomościach
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, isLoading]);

  // Obsługa rozpoznawania mowy
  const toggleListening = async () => {
    try {
      if (listening) {
        ExpoSpeechRecognitionModule.stop();
        return;
      }
      const perms = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!perms.granted) return;

      textBeforeListening.current = inputText;
      ExpoSpeechRecognitionModule.start({ lang: 'pl-PL', interimResults: true, continuous: false });
    } catch (e) {
      console.warn('Speech error', e);
    }
  };

  //Wysyłanie wiadomości
  const handleSend = async () => {
    const textToSend = inputText.trim();
    if (textToSend.length === 0) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: textToSend,
      sender: 'user'
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await apiClient.post<AiResponse>('/ai/chat', { message: textToSend });
      const responseData = response.data;

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: responseData.content,
        sender: 'ai'
      };

      setMessages(prev => [...prev, aiMsg]);

    } catch (error) {
      console.error("Błąd API chat:", error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: "Nie udało się połączyć z serwerem.",
        sender: 'ai'
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };


  //Formatowanie tekstu zwrotnego
  const parseBold = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);

    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        const boldText = part.slice(2, -2);
        return (
          <Text key={index} style={{ fontWeight: "bold" }}>
            {boldText}
          </Text>
        );
      }
      return <Text key={index}>{part}</Text>;
    });
  };

  function replaceStarsWithBullets(text: string) {
    return text.replace(/^(\s*)\*\s+/gm, "$1• ");
  }



  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={(isKeyboardVisible ? 'padding' : undefined)}
      keyboardVerticalOffset={insets.bottom + 50}
    >
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {messages.length === 0 ? (
          <Text style={styles.prompt}>Cześć jestem Tipuś, twój asystent podróży. Jeśli masz jakieś pytania śmiało pytaj!</Text>
        ) : (
          messages.map((msg) => {
            const displayText = replaceStarsWithBullets(msg.text);
            return (
              <View
                key={msg.id}
                style={[
                  styles.bubbleContainer,
                  msg.sender === 'user' ? styles.bubbleRight : styles.bubbleLeft
                ]}
              >
                <Text style={msg.sender === 'user' ? styles.userText : styles.aiText}>
                  {parseBold(displayText)}
                </Text>

              </View>
            )
          })
        )}

        {isLoading && (
          <View style={[styles.bubbleContainer, styles.bubbleLeft]}>
            <ActivityIndicator size="small" color="#555" />
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        <Animated.View style={{ transform: [{ scale: pulse }] }}>
          <TouchableOpacity
            onPress={toggleListening}
            style={[styles.smallMicButton, listening && styles.smallMicButtonActive]}
            activeOpacity={0.7}
          >
            <Ionicons name={listening ? "mic" : "mic-outline"} size={24} color={listening ? "#fff" : "#555"} />
          </TouchableOpacity>
        </Animated.View>

        <TextInput
          style={styles.input}
          placeholder="Wpisz wiadomość..."
          placeholderTextColor="#999"
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
        />

        <TouchableOpacity
          onPress={handleSend}
          style={[styles.sendButton, (!inputText.trim() && !listening) && styles.sendButtonDisabled]}
          disabled={!inputText.trim() && !listening}
        >
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

    </KeyboardAvoidingView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 20,
  },

  prompt: {
    marginTop: 100,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    color: '#111',
    alignSelf: 'center',
  },

  bubbleContainer: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 18,
    marginBottom: 10,
    alignItems: 'flex-start',
  },

  bubbleRight: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },

  bubbleLeft: {
    alignSelf: 'flex-start',
    backgroundColor: '#F2F2F7',
    borderBottomLeftRadius: 4,
  },

  bubbleText: {
    fontSize: 16,
    lineHeight: 22,
  },

  textRight: {
    color: '#fff',
  },

  textLeft: {
    color: '#000',
  },

  bottomBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },

  smallMicButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },

  smallMicButtonActive: {
    backgroundColor: '#e53935',
    borderColor: '#e53935',
  },

  input: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    minHeight: 44,
    maxHeight: 120,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#eee',
  },

  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },

  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },

  userText: {
    color: "#fff",
    fontSize: 16,
    lineHeight: 22,
  },

  aiText: {
    color: "#000",
    fontSize: 16,
    lineHeight: 22,
  },

});