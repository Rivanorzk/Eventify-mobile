import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/auth-theme';

type Props = TextInputProps & {
  label: string;
  error?: string;
  secure?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
};

export default function AuthInput({ label, error, secure, icon, ...rest }: Props) {
  const [hidden, setHidden] = useState(!!secure);
  const [focused, setFocused] = useState(false);

  return (
    <View style={s.wrap}>
      {!!label && <Text style={s.label}>{label}</Text>}

      <View
        style={[
          s.box,
          focused && { borderColor: theme.primary },
          !!error && { borderColor: theme.danger },
        ]}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={theme.muted}
            style={{ marginRight: 10 }}
          />
        )}

        <TextInput
          {...rest}
          style={s.input}
          placeholderTextColor="rgba(85,66,66,0.5)"
          secureTextEntry={hidden}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
        />

        {secure && (
          <TouchableOpacity onPress={() => setHidden(!hidden)} hitSlop={10}>
            <Ionicons
              name={hidden ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={theme.muted}
            />
          </TouchableOpacity>
        )}
      </View>

      {!!error && <Text style={s.error}>{error}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.input,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: theme.radius,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    color: theme.text,
    paddingVertical: 14,
    fontSize: 15,
  },
  error: {
    color: theme.danger,
    fontSize: 12,
    marginTop: 4,
  },
});