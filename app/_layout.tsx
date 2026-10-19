import 'react-native-get-random-values';
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="tabs"
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="index" 
        options={{ 
          headerShown: false
        }} 
      />
      <Stack.Screen 
        name="registerPage" 
        options={{ 
          headerShown: false
        }} 
      />
      <Stack.Screen 
        name="notificationPage" 
        options={{ 
          title: "Powiadomienia",
          headerTitleAlign: 'center',
          headerBackTitle: "Wróć", 
        }} 
      />
      <Stack.Screen 
        name="searchUsers" 
        options={{ 
          title: "Dodaj znajomych do grupy",
          headerTitleAlign: 'center',
          headerBackTitle: "Wróć", 
        }} 
      />
      
    </Stack>
  );
}