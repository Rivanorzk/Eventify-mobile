import { Platform } from 'react-native';

export const theme = {
  // Brand
  primary: '#3b0008',
  primaryContainer: '#5b0f18',
  onPrimary: '#ffffff',

  // Secondary
  secondary: '#a13c46',
  secondaryContainer: '#fe848c',
  secondaryFixed: '#ffdada',
  onSecondaryContainer: '#751b28',

  // Surface & Background
  bg: '#fcf9f8',
  surface: '#fcf9f8',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f6f3f2',
  surfaceContainer: '#f0eded',
  surfaceContainerHigh: '#eae7e7',
  surfaceContainerHighest: '#e5e2e1',
  surfaceVariant: '#e5e2e1',

  // Text
  text: '#1b1b1c',
  muted: '#554242',
  outline: '#887271',

  // Component
  card: '#ffffff',
  input: '#f6f3f2',
  border: '#dbc0c0',

  // Feedback
  danger: '#ba1a1a',
  dangerContainer: '#ffdad6',

  // Radius
  radius: 12,
  radiusLg: 16,
  radiusFull: 9999,

  hairline: Platform.OS === 'ios' ? 0.5 : 1,
};