import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Fonts, Radius } from '../constants/theme';

interface Props {
  message: string;
  success?: boolean;
  visible: boolean;
}

export default function Toast({ message, success = true, visible }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: visible ? 1 : 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: visible ? 0 : 12,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, opacity, translateY]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.container, { opacity, transform: [{ translateY }] }]}
    >
      <MaterialIcons
        name={success ? 'check-circle' : 'error-outline'}
        size={20}
        color={success ? Colors.tertiaryFixedDim : Colors.secondaryContainer}
      />
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    maxWidth: 380,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: Radius.lg,
    backgroundColor: Colors.inverseSurface,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    zIndex: 100,
  },
  text: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.inverseOnSurface,
  },
});