export const validateEmail = (email: string) => {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(String(email).toLowerCase().trim());
};


export const validatePassword = (password: string) => {
  const hasUpperCase = /[A-Z]/.test(password);
  return password.length >= 8 && hasUpperCase;
};