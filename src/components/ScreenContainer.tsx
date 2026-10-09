import React, { ReactNode } from 'react';
import { View, ScrollView, StyleSheet, ScrollViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from './AppHeader';
import { Colors, Spacing } from '../constants/theme';

interface Props {
  children: ReactNode;
  scrollable?: boolean;
  scrollProps?: ScrollViewProps;
  padded?: boolean;
  hideHeader?: boolean;
  hideNotification?: boolean;
  hideAvatar?: boolean;
}

export default function ScreenContainer({
  children,
  scrollable = true,
  scrollProps,
  padded = true,
  hideHeader = false,
  hideNotification,
  hideAvatar,
}: Props) {
  const content = (
    <View style={[padded && styles.padded, styles.content]}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {!hideHeader && (
        <AppHeader
          hideNotification={hideNotification}
          hideAvatar={hideAvatar}
        />
      )}

      {scrollable ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          {...scrollProps}
        >
          {content}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>{content}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface },
  scrollContent: { paddingBottom: 96 },
  content: { flexGrow: 1 },
  padded: { paddingHorizontal: Spacing.margin, paddingTop: Spacing.md },
});