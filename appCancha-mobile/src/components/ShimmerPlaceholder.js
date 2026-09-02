import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { COLORS } from '../constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ShimmerPlaceholder({ style, width = SCREEN_WIDTH - 40, height = 16, borderRadius = 6 }) {
  const translate = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(translate, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      })
    );
    anim.start();
    return () => anim.stop();
  }, [translate]);

  const translateX = translate.interpolate({
    inputRange: [-1, 1],
    outputRange: [-width, width],
  });

  return (
    <View style={[styles.container, { width, height, borderRadius }, style]}>
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX }],
            height,
            backgroundColor: 'rgba(255,255,255,0.06)'
          },
        ]}
      />
      <View style={[styles.overlay, { borderRadius }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0E1115',
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '30%',
    backgroundColor: 'rgba(255,255,255,0.06)'
  }
  ,
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  }
});
