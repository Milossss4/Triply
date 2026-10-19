import { StyleSheet, Text, TextInput, View, Pressable, KeyboardAvoidingView, Platform } from 'react-native'
import React, {useState} from 'react'
import { logoTextStyle, boxStyle, buttonStyle, buttonTextStyle} from '../constants/theme';
import { useRouter } from 'expo-router';
import CustomModal from '@/components/CustomModal';
import { validateEmail, validatePassword } from '../utils/validation';
import apiClient from '../api/apiClient';

const registerPage = () => {
    const router = useRouter();
    const [name, setName] = useState('');
    const [surname, setSurname] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalMessage, setModalMessage] = useState('');

    const handleRegister = async () => {
      let registerData = {
          firstName: name,
          lastName: surname,
          email: email,
          password: password
      };

      if(!name.trim()){
          setModalTitle('Błąd rejestracji');
          setModalMessage('Podaj imię');
          setModalVisible(true);
          return;
      }

      if(!surname.trim()){
          setModalTitle('Błąd rejestracji');
          setModalMessage('Podaj nazwisko');
          setModalVisible(true);
          return;
      }

      if(!email.trim() || !validateEmail(email)){
          setModalTitle('Błąd rejestracji');
          setModalMessage('Podaj poprawny email');
          setModalVisible(true);
          return;
      }
      
      if(!password.trim() || !validatePassword(password)){
          setModalTitle('Błąd rejestracji');
          setModalMessage('Podaj poprawne hasło');
          setModalVisible(true);
          return;
      }

      try {
        const response = await apiClient.post('/auth/signup', registerData);

        setModalTitle('Rejestracja udana!');
        setModalMessage('Konto zostało pomyślnie utworzone. Możesz się teraz zalogować.');
        setModalVisible(true);

        setTimeout(() => {
          router.replace('/');
        }, 1000);
      }
      catch (error) {
        let errorMessage = 'Wystąpił błąd podczas rejestracji. Spróbuj ponownie później.';

        if(error instanceof Error)
        {
          errorMessage = error.message;
        }
        
        setModalTitle('Błąd rejestracji');
        setModalMessage(errorMessage);
        setModalVisible(true);
      }
    }

  return (
    <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.container}>
      
        <View>
            <Text style={logoTextStyle}>Triply</Text>
        </View>

        <View style={styles.formContainer}>
            <TextInput
                style={styles.credentialsInput}
                placeholder="Imię"
                placeholderTextColor={"gray"}
                onChangeText={text => setName(text)}
            />

            <TextInput
                style={styles.credentialsInput}
                placeholder="Nazwisko"
                placeholderTextColor={"gray"}
                onChangeText={text => setSurname(text)}
            />

            <TextInput
                style={styles.credentialsInput}
                placeholder="Email"
                placeholderTextColor={"gray"}
                onChangeText={text => setEmail(text)}
            />

            <TextInput
                style={styles.credentialsInput}
                placeholder="Password"
                placeholderTextColor={"gray"}
                onChangeText={text => setPassword(text)}
                secureTextEntry
            />

            <Pressable style={styles.registerButton} onPress={handleRegister}>
                <Text style={styles.registerButtonText}>Zarejestruj się</Text>
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

export default registerPage

const styles = StyleSheet.create({
    container:{
      flex: 1,
      alignContent: 'center',
      justifyContent: 'center',
    },

    formContainer: {
      width: '100%',
      alignItems: 'center',
    },

    credentialsInput:{
      ...boxStyle,
      marginBottom: 15,
      paddingLeft: 15,
      color: 'black',
    },

    registerButton:{
      ...buttonStyle,
      width: '90%',
      marginBottom: 20,
    },

    registerButtonText:{
      ...buttonTextStyle,
      fontSize: 20,
    },
})