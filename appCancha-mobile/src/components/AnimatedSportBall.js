import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { FutbolIcon, TenisIcon, BasquetIcon, PadelIcon, VoleyIcon } from './SportIcons';
import { COLORS } from '../constants';

const AnimatedSportBall = ({ deporte, size = 80 }) => {
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animación de salto
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Animación de rotación
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
  }, [bounceAnim, rotateAnim]);

  const bounceTranslate = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -40],
  });

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getIcon = () => {
    if (!deporte) return <BasquetIcon size={size} color={COLORS.primary} />;
    const deporteUpper = deporte.toUpperCase();

    if (deporteUpper.includes('FUTBOL')) return <FutbolIcon size={size} color={COLORS.primary} />;
    if (deporteUpper.includes('PADEL')) return <PadelIcon size={size} color={COLORS.primary} />;
    if (deporteUpper.includes('TENIS')) return <TenisIcon size={size} color={COLORS.primary} />;
    if (deporteUpper.includes('VOLEY')) return <VoleyIcon size={size} color={COLORS.primary} />;
    if (deporteUpper.includes('BASQUET')) return <BasquetIcon size={size} color={COLORS.primary} />;

    return <BasquetIcon size={size} color={COLORS.primary} />;
  };

  return (
    <Animated.View
      style={[
        {
          transform: [
            { translateY: bounceTranslate },
            { rotate },
          ],
        },
      ]}
    >
      {getIcon()}
    </Animated.View>
  );
};

export default AnimatedSportBall;
