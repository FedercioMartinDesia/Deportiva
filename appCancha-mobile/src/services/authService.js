import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

export const authService = {
  // Registro de usuario
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      if (response.data.success && response.data.data.token) {
        await AsyncStorage.setItem('token', response.data.data.token);
        await AsyncStorage.setItem('user', JSON.stringify(response.data.data.usuario));
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Registro con teléfono verificado
  registerWithVerification: async (userData) => {
    try {
      const response = await api.post('/auth/register/verified', userData);
      if (response.data.success && response.data.data.token) {
        await AsyncStorage.setItem('token', response.data.data.token);
        await AsyncStorage.setItem('user', JSON.stringify(response.data.data.usuario));
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Login
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      console.log('📥 Login response:', response.data.success ? 'SUCCESS' : 'FAILED');
      if (response.data.success && response.data.data.token) {
        const token = response.data.data.token;
        console.log('💾 Saving token to AsyncStorage:', token.substring(0, 20) + '...');
        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('user', JSON.stringify(response.data.data.usuario));
        console.log('✅ Token saved successfully');
        
        // Verificar que se guardó correctamente
        const savedToken = await AsyncStorage.getItem('token');
        console.log('🔍 Verification - Token retrieved:', savedToken ? savedToken.substring(0, 20) + '...' : 'NO TOKEN');
      }
      return response.data;
    } catch (error) {
      console.log('❌ Login error:', error.response?.data?.message || error.message);
      throw error.response?.data || error;
    }
  },

  // Logout
  logout: async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
  },

  // Obtener perfil
  getProfile: async () => {
    try {
      const response = await api.get('/auth/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Actualizar perfil
  updateProfile: async (userData) => {
    try {
      const response = await api.put('/auth/profile', userData);
      if (response.data.success) {
        await AsyncStorage.setItem('user', JSON.stringify(response.data.data));
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Obtener usuario guardado
  getStoredUser: async () => {
    const userStr = await AsyncStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Verificar si hay sesión activa
  isAuthenticated: async () => {
    const token = await AsyncStorage.getItem('token');
    return !!token;
  },

  // Login con Google
  googleLogin: async (googleUser) => {
    try {
      const response = await api.post('/auth/google-login', {
        email: googleUser.user.email,
        nombre: googleUser.user.givenName,
        apellido: googleUser.user.familyName,
        foto: googleUser.user.photo,
        idToken: googleUser.idToken
      });
      
      if (response.data.success && response.data.data.token) {
        await AsyncStorage.setItem('token', response.data.data.token);
        await AsyncStorage.setItem('user', JSON.stringify(response.data.data.usuario));
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};
