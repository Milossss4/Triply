import { Link } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { boxStyle, logoTextStyle, mainBlue, buttonStyle, buttonTextStyle, loadingIndicatorStyle } from '../constants/theme';
import CustomModal from '../components/CustomModal';
import { validateEmail, validatePassword } from '../utils/validation';
import { useRouter } from 'expo-router';
import apiClient from '../api/apiClient';
import { tokenService } from '../api/tokenService';
import { GoogleSignin, statusCodes, isErrorWithCode } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_WEBCLIENTID, 
  scopes: ['profile', 'email'],
});

const LoginPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    const checkTokens = async () => {
      try {
        const accessToken = await tokenService.getAccessToken();

        if (accessToken) {
          router.replace('./tabs/groupsPage');
        }
        else {
          setIsLoading(false);
        }
      }
      catch (error) {
        console.error('Błąd sprawdzanie tokenu: ', error);
        setIsLoading(false);
      }
    };
    checkTokens();
  }, [router]);

  const handleGoogleLogin = async () => {
    setIsSigningIn(true);
    try {
      await GoogleSignin.hasPlayServices();
      
      await GoogleSignin.signIn();
      
      const { idToken } = await GoogleSignin.getTokens();

      if (idToken) {
        const response = await apiClient.post('/auth/google', {
          idToken: idToken
        });

        const { accessToken, refreshToken } = response.data;

        await tokenService.saveTokens(accessToken, refreshToken);

        setModalTitle('Logowanie udane!');
        setModalMessage('Zalogowano pomyślnie przez Google.');
        setModalVisible(true);

        setTimeout(() => {
          router.replace('./tabs/groupsPage');
        }, 1000);
      } else {
        throw new Error('Nie udało się pobrać tokenu Google ID.');
      }

    } catch (error : any) {
      if (isErrorWithCode(error)) {
        if (error.code === statusCodes.SIGN_IN_CANCELLED) {
          console.log('Użytkownik anulował logowanie');
          setIsSigningIn(false); 
          return;
        } else if (error.code === statusCodes.IN_PROGRESS) {
          console.log('Logowanie już trwa');
          return;
        } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          setModalTitle('Błąd Google');
          setModalMessage('Usługi Google Play są niedostępne lub nieaktualne.');
          setModalVisible(true);
          setIsSigningIn(false);
          return;
        }
      }

      let errorMessage = 'Wystąpił błąd podczas logowania przez Google.';
      if (error.response && error.response.data && error.response.data.message) {
         errorMessage = error.response.data.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      console.error("Google Login Error:", error);
      setModalTitle('Błąd logowania');
      setModalMessage(errorMessage);
      setModalVisible(true);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleLogin = async () => {
    let loginData = {
      email: email,
      password: password
    };

    if (!email.trim() || !validateEmail(email)) {
      setModalTitle('Błąd logowania');
      setModalMessage('Podaj poprawny email');
      setModalVisible(true);
      return;
    }

    if (!password.trim() || !validatePassword(password)) {
      setModalTitle('Błąd logowania');
      setModalMessage('Podaj poprawne hasło');
      setModalVisible(true);
      return;
    }

    setIsSigningIn(true);

    try {
      const response = await apiClient.post('/auth/signin', loginData);
      const { accessToken, refreshToken } = response.data;

      await tokenService.saveTokens(accessToken, refreshToken);;

      setIsSigningIn(false);

      setModalTitle('Logowanie udane!');
      setModalMessage('Zalogowano pomyślnie.');
      setModalVisible(true);

      setTimeout(() => {
        router.replace('./tabs/groupsPage');
      }, 1000);

    } catch (error : any) {
      setIsSigningIn(false);

      let errorMessage = 'Wystąpił błąd podczas logowania. Spróbuj ponownie później.';

      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      setModalTitle('Błąd logowania');
      setModalMessage(errorMessage);
      setModalVisible(true);
    }
  }

  if (isLoading) {
    return (
      <View style={loadingIndicatorStyle}>
        <ActivityIndicator size="large" color={mainBlue} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.container}>
        <View>
          <Text style={logoTextStyle}>Triply</Text>
        </View>

        <View style={styles.formContainer}>
          <TextInput
            style={styles.credentialsInput}
            placeholder="Email"
            placeholderTextColor={"gray"}
            value={email}
            onChangeText={text => setEmail(text)} 
            editable={!isSigningIn} />

          <TextInput
            style={styles.credentialsInput}
            placeholder="Password"
            placeholderTextColor={"gray"}
            value={password}
            onChangeText={text => setPassword(text)}
            secureTextEntry 
            editable={!isSigningIn} />

          <Pressable 
            style={[styles.loginButton, isSigningIn && { opacity: 0.7 }]} 
            onPress={handleLogin}
            disabled={isSigningIn} 
          >
            {isSigningIn ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Zaloguj się</Text>
            )}
          </Pressable>


          <Link href="../registerPage">
            <Text style={styles.registerText}>Nie masz konta? Zarejestruj się</Text>
          </Link>

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>lub</Text>
            <View style={styles.dividerLine} />
          </View>


          <Pressable 
            style={[styles.googleButton, isSigningIn && { opacity: 0.7 }]} 
            onPress={handleGoogleLogin}
            disabled={isSigningIn}
          >
            <Image
              source={require('../assets/images/google_logo.jpg')}
              style={{ width: 20, height: 20, marginRight: 10 }}
            />
            <Text style={{ fontWeight: 'bold' }}>Zaloguj się z Google</Text>
          </Pressable>
        </View>

        <CustomModal
          visible={modalVisible}
          title={modalTitle}
          message={modalMessage}
          onClose={() => setModalVisible(false)}
        />
      </View>
    </KeyboardAvoidingView>
  )
}

export default LoginPage

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignContent: 'center',
    justifyContent: 'center',
  },

  formContainer: {
    width: '100%',
    alignItems: 'center',
  },

  credentialsInput: {
    ...boxStyle,
    marginBottom: 20,
    paddingLeft: 15,
    color: 'black',
  },

  loginButton: {
    ...buttonStyle,
    width: '90%',
    marginBottom: 20,
    justifyContent: 'center', 
    alignItems: 'center',
  },

  loginButtonText: {
    ...buttonTextStyle,
    fontSize: 20,
  },

  registerText: {
    color: mainBlue,
  },

  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '90%',
    marginVertical: 30,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'lightgray',
  },

  dividerText: {
    marginHorizontal: 10,
    color: 'gray',
    fontWeight: '500',
  },

  googleButton: {
    ...boxStyle,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
})