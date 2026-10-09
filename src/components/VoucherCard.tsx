import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Fonts, Radius, Spacing } from '../constants/theme';

type BadgeVariant = 'owned' | 'verified' | 'partner' | 'onsite';

interface Props {
  title: string;
  description: string;
  badge: { text: string; icon: string; variant: BadgeVariant };
  rightLabel: string;
  metaIcon: string;
  metaText: string;
  actionIcon: string;
  actionLabel: string;
  owned?: boolean;
  accentColor: string;
  onAction: () => void;
}

export default function VoucherCard({
  title,
  description,
  badge,
  rightLabel,
  metaIcon,
  metaText,
  actionIcon,
  actionLabel,
  owned,
  accentColor,
  onAction,
}: Props) {
  const badgeStyle = (() => {
    switch (badge.variant) {
      case 'owned':
        return { bg: Colors.secondaryFixed, fg: Colors.onSecondaryContainer };
      case 'partner':
        return { bg: Colors.tertiaryFixed, fg: Colors.onTertiaryFixed };
      case 'onsite':
        return { bg: Colors.surfaceContainerHigh, fg: Colors.onSurfaceVariant };
      default:
        return { bg: Colors.secondaryFixed, fg: Colors.onSecondaryContainer };
    }
  })();

  return (
    <View style={styles.card}>
      <View style={[styles.accent, { backgroundColor: accentColor }]} />

      <View style={styles.body}>
        <View style={styles.headerRow}>
          <View style={[styles.badge, { backgroundColor: badgeStyle.bg }]}>
            <MaterialIcons name={badge.icon as any} size={13} color={badgeStyle.fg} />
            <Text style={[styles.badgeText, { color: badgeStyle.fg }]}>{badge.text}</Text>
          </View>
          <Text style={styles.rightLabel}>{rightLabel}</Text>
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.desc}>{description}</Text>
      </View>

      <View style={styles.dividerRow}>
        <View style={styles.notchLeft} />
        <View style={styles.dashed} />
        <View style={styles.notchRight} />
      </View>

      <View style={styles.footer}>
        <View style={styles.metaGroup}>
          <MaterialIcons name={metaIcon as any} size={15} color={Colors.onSurfaceVariant} />
          <Text style={styles.metaText}>{metaText}</Text>
        </View>

        <Pressable
          onPress={onAction}
          style={({ pressed }) => [
            styles.actionBtn,
            owned ? styles.actionOwned : styles.actionPrimary,
            pressed && { transform: [{ scale: 0.95 }] },
          ]}
        >
          <MaterialIcons
            name={actionIcon as any}
            size={15}
            color={owned ? Colors.primaryContainer : Colors.onPrimary}
          />
          <Text
            style={[
              styles.actionText,
              { color: owned ? Colors.primaryContainer : Colors.onPrimary },
            ]}
          >
            {actionLabel}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(219,192,192,0.3)',
    shadowColor: '#1e1e1e',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
  },
  body: {
    padding: Spacing.md,
    paddingLeft: Spacing.lg,
    gap: Spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  badgeText: {
    fontFamily: Fonts.semibold,
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  rightLabel: {
    fontFamily: Fonts.semibold,
    fontSize: 11,
    color: Colors.secondary,
    letterSpacing: 0.4,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    color: Colors.onSurface,
    lineHeight: 24,
  },
  desc: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 20,
    marginVertical: 2,
  },
  notchLeft: {
    width: 16,
    height: 20,
    backgroundColor: Colors.background,
    borderTopRightRadius: 9999,
    borderBottomRightRadius: 9999,
    marginLeft: -2,
  },
  dashed: {
    flex: 1,
    borderTopWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(219,192,192,0.6)',
    marginHorizontal: 8,
  },
  notchRight: {
    width: 16,
    height: 20,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 9999,
    borderBottomLeftRadius: 9999,
    marginRight: -2,
  },
  footer: {
    padding: Spacing.md,
    paddingLeft: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(246,243,242,0.6)',
    gap: 8,
  },
  metaGroup: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  metaText: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    flexShrink: 1,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
  },
  actionPrimary: { backgroundColor: Colors.primaryContainer },
  actionOwned: {
    backgroundColor: Colors.surfaceContainerHighest,
    borderWidth: 1,
    borderColor: 'rgba(219,192,192,0.4)',
  },
  actionText: {
    fontFamily: Fonts.semibold,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});