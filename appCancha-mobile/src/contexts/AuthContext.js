import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/authService';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const isAuth = await authService.isAuthenticated();
      
      if (isAuth) {
        const userData = await authService.getStoredUser();
        if (userData) {
          setUser(userData);
          setIsAuthenticated(true);
          
          // Verificar si es usuario nuevo (pendiente de ver bienvenida)
          const pendingWelcome = await AsyncStorage.getItem('pendingWelcome');
          if (pendingWelcome === 'true') {
            setIsNewUser(true);
          }
        }
      }
    } catch (error) {
      console.log('Error checking auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      if (response.success) {
        setUser(response.data.usuario);
        setIsAuthenticated(true);
        return { success: true };
      }
      return { success: false, message: response.message };
    } catch (error) {
      return { success: false, message: error.message || 'Error al iniciar sesión' };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      if (response.success) {
        // Limpiar datos viejos primero (por si es re-registro)
        await AsyncStorage.removeItem('pendingWelcome');
        await AsyncStorage.removeItem('welcomePhoto');
        
        // Guardar flag de bienvenida pendiente
        await AsyncStorage.setItem('pendingWelcome', 'true');
        // Guardar foto si existe para mostrar en bienvenida
        if (userData.foto) {
          await AsyncStorage.setItem('welcomePhoto', userData.foto);
        }
        setUser(response.data.usuario);
        setIsNewUser(true);
        setIsAuthenticated(true);
        return { success: true, usuario: response.data.usuario };
      }
      return { success: false, message: response.message };
    } catch (error) {
      return { success: false, message: error.message || 'Error al registrarse' };
    }
  };

  const registerWithVerification = async (userData) => {
    try {
      const response = await authService.registerWithVerification(userData);
      if (response.success) {
        // Limpiar datos viejos primero
        await AsyncStorage.removeItem('pendingWelcome');
        await AsyncStorage.removeItem('welcomePhoto');
        
        // Guardar flag de bienvenida pendiente
        await AsyncStorage.setItem('pendingWelcome', 'true');
        // Guardar foto si existe para mostrar en bienvenida
        if (userData.foto) {
          await AsyncStorage.setItem('welcomePhoto', userData.foto);
        }
        setUser(response.data.usuario);
        setIsNewUser(true);
        setIsAuthenticated(true);
        return { success: true, usuario: response.data.usuario };
      }
      return { success: false, message: response.message };
    } catch (error) {
      return { success: false, message: error.message || 'Error al registrarse' };
    }
  };

  const completeWelcome = async () => {
    await AsyncStorage.removeItem('pendingWelcome');
    await AsyncStorage.removeItem('welcomePhoto');
    setIsNewUser(false);
  };

  const logout = async () => {
    await authService.logout();
    // Limpiar cualquier dato de bienvenida pendiente
    await AsyncStorage.removeItem('pendingWelcome');
    await AsyncStorage.removeItem('welcomePhoto');
    setUser(null);
    setIsAuthenticated(false);
    setIsNewUser(false);
  };

  const updateUser = async (userData) => {
    try {
      const response = await authService.updateProfile(userData);
      if (response.success) {
        setUser(response.data);
        return { success: true };
      }
      return { success: false, message: response.message };
    } catch (error) {
      return { success: false, message: error.message || 'Error al actualizar perfil' };
    }
  };

  const refreshUser = async () => {
    try {
      const response = await authService.getProfile();
      if (response.success) {
        setUser(response.data);
        return { success: true };
      }
      return { success: false, message: response.message };
    } catch (error) {
      return { success: false, message: error.message || 'Error al refrescar datos' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        isNewUser,
        login,
        register,
        registerWithVerification,
        logout,
        updateUser,
        refreshUser,
        completeWelcome,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};
