import { Platform } from 'react-native';

export const mainBlue = '#2783d3';
export const lightblue = '#d0e7fd';
export const ACCESS_TOKEN_KEY = 'accessToken';
export const REFRESH_TOKEN_KEY = 'refreshToken';

export const boxStyle = {
  height: 50,
  width: '90%',
  borderWidth: 1,
  borderColor: 'lightgray',
  borderRadius: 10
} as const;

export const buttonStyle = {
  backgroundColor: mainBlue,
  borderRadius: 10,
  height: 50,
  justifyContent: 'center',
  alignItems: 'center',
} as const;

export const buttonTextStyle = {
  color: 'white',
  fontWeight: 'bold',
} as const;

export const logoTextStyle = {
  fontFamily: 'Poppins',
  fontSize: 100,
  fontWeight: 'bold',
  fontStyle: 'italic',
  color: '#000000',
  textAlign: 'center',
  top: '25%',
  marginBottom: 50,
} as const;

export const modalContainerStyle = {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'rgba(0,0,0,0.5)',
} as const;


export const modalViewStyle = {
  margin: 10,
  backgroundColor: 'white',
  borderRadius: 20,
  padding: 20,
  alignItems: 'center',
  shadowColor: '#000',
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.25,
  shadowRadius: 4,
  elevation: 5,
  width: '80%',
} as const;

export const modalTitleStyle = {
  fontSize: 24,
  fontWeight: 'bold',
  marginBottom: 15,
  textAlign: 'center',
} as const;

export const modalTextStyle = {
  marginBottom: 20,
  textAlign: 'center',
  fontSize: 16,
} as const;

export const loadingIndicatorStyle = {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
} as const;

export const fabStyle = {
  position: 'absolute',
  width: 55,
  height: 55,
  borderRadius: 30,
  backgroundColor: mainBlue,
  justifyContent: 'center',
  alignItems: 'center',
  right: 20,
  bottom: 20,
} as const;