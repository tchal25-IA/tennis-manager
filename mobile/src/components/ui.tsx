import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { colors, spacing } from '../theme';
import type { Player } from '../api';

export function Screen({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[styles.screen, style]}>{children}</View>;
}

export function Title({ children }: { children: string }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function Subtitle({ children }: { children: string }) {
  return <Text style={styles.subtitle}>{children}</Text>;
}

export function Body({ children }: { children: string }) {
  return <Text style={styles.body}>{children}</Text>;
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        disabled && styles.btnDisabled,
        pressed && !disabled && styles.btnPressed,
      ]}
    >
      <Text style={styles.btnLabel}>{label}</Text>
    </Pressable>
  );
}

export function ChoiceButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.choice, pressed && styles.btnPressed]}
    >
      <Text style={styles.choiceLabel}>{label}</Text>
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function StatsBar({ player }: { player: Player }) {
  const rows: [string, number][] = [
    ['Technique', player.technique],
    ['Endurance', player.endurance],
    ['Mental', player.mental],
    ['Célébrité', player.celebrity],
  ];
  return (
    <View style={styles.stats}>
      <Text style={styles.statsName}>
        {player.firstName} {player.lastName}
      </Text>
      <Text style={styles.statsMeta}>
        {player.cash} € · Moral {player.morale} · Fatigue {player.fatigue}
      </Text>
      {rows.map(([label, value]) => (
        <View key={label} style={styles.statRow}>
          <Text style={styles.statLabel}>{label}</Text>
          <View style={styles.statTrack}>
            <View style={[styles.statFill, { width: `${Math.min(100, value)}%` }]} />
          </View>
          <Text style={styles.statValue}>{value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.mist,
    padding: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.court,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: colors.muted,
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  body: {
    fontSize: 16,
    color: colors.ink,
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  btn: {
    backgroundColor: colors.court,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  btnPressed: { opacity: 0.85 },
  btnDisabled: { opacity: 0.45 },
  btnLabel: {
    color: colors.line,
    fontSize: 16,
    fontWeight: '700',
  },
  choice: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.court,
    padding: spacing.md,
    borderRadius: 10,
    marginBottom: spacing.sm,
  },
  choiceLabel: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '600',
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.muted,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: colors.card,
  },
  chipSelected: {
    backgroundColor: colors.court,
    borderColor: colors.court,
  },
  chipLabel: { color: colors.ink, fontSize: 13, fontWeight: '600' },
  chipLabelSelected: { color: colors.line },
  stats: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  statsName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.court,
  },
  statsMeta: {
    color: colors.muted,
    marginBottom: spacing.sm,
    marginTop: 2,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  statLabel: { width: 84, fontSize: 12, color: colors.muted },
  statTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.mist,
    borderRadius: 4,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  statFill: {
    height: 8,
    backgroundColor: colors.clay,
  },
  statValue: { width: 28, textAlign: 'right', fontSize: 12, color: colors.ink },
});
