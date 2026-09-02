import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

const { height, width } = Dimensions.get('window');

export const showToast = (message, type = 'success', duration = 2500) => {
  // Este será llamado desde un contexto global
  if (global.toastFunction) {
    global.toastFunction(message, type, duration);
  }
};

export default function Toast({ visible, message, type = 'success', onHide }) {
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'close-circle';
      case 'warning':
        return 'warning';
      case 'info':
        return 'information-circle';
      default:
        return 'checkmark-circle';
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success':
        return {
          bg: '#10B981',
          icon: '#FFFFFF'
        };
      case 'error':
        return {
          bg: '#EF4444',
          icon: '#FFFFFF'
        };
      case 'warning':
        return {
          bg: '#F59E0B',
          icon: '#FFFFFF'
        };
      case 'info':
        return {
          bg: COLORS.primary,
          icon: '#FFFFFF'
        };
      default:
        return {
          bg: '#10B981',
          icon: '#FFFFFF'
        };
    }
  };

  const colors = getColors();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={[styles.toast, { backgroundColor: colors.bg }]}>
        <Ionicons name={getIcon()} size={20} color={colors.icon} />
        <Text style={[styles.message, { color: colors.icon }]} numberOfLines={2}>
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  toast: {
    width: '100%',
    maxWidth: width - 32,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  message: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
});
