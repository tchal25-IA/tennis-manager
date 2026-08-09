import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { colors, fonts, spacing } from '../theme';
import type { Player } from '../api';

export function Screen({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.screen, style]}>
      <View style={styles.atmosphereTop} pointerEvents="none" />
      <View style={styles.atmosphereCourt} pointerEvents="none" />
      <View style={styles.chalkLine} pointerEvents="none" />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

export function FadeIn({
  children,
  delay = 0,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  style?: ViewStyle;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 480,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 480,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, opacity, translateY]);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}

export function BrandMark() {
  return (
    <FadeIn>
      <Text style={styles.brand}>TENNIS MANAGER</Text>
      <View style={styles.brandRule} />
    </FadeIn>
  );
}

export function Title({ children }: { children: React.ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function Subtitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.subtitle}>{children}</Text>;
}

export function Body({ children }: { children: React.ReactNode }) {
  return <Text style={styles.body}>{children}</Text>;
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  variant = 'primary',
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ball';
}) {
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() =>
        Animated.spring(scale, {
          toValue: 0.97,
          useNativeDriver: true,
          speed: 40,
        }).start()
      }
      onPressOut={() =>
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 40,
        }).start()
      }
      style={{ marginTop: spacing.sm }}
    >
      <Animated.View
        style={[
          styles.btn,
          variant === 'secondary' && styles.btnSecondary,
          variant === 'ball' && styles.btnBall,
          disabled && styles.btnDisabled,
          { transform: [{ scale }] },
        ]}
      >
        <Text
          style={[
            styles.btnLabel,
            variant === 'secondary' && styles.btnLabelSecondary,
            variant === 'ball' && styles.btnLabelBall,
          ]}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export function ChoiceButton({
  label,
  onPress,
  hint,
  index = 0,
}: {
  label: string;
  onPress: () => void;
  hint?: string;
  index?: number;
}) {
  return (
    <FadeIn delay={120 + index * 80}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.choice,
          pressed && styles.choicePressed,
        ]}
      >
        <Text style={styles.choiceLabel}>{label}</Text>
        {hint ? <Text style={styles.choiceHint}>{hint}</Text> : null}
      </Pressable>
    </FadeIn>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  description,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
  description?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        description ? styles.chipWide : null,
        selected && styles.chipSelected,
      ]}
    >
      <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
        {label}
      </Text>
      {description ? (
        <Text
          style={[styles.chipDesc, selected && styles.chipLabelSelected]}
        >
          {description}
        </Text>
      ) : null}
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
        {player.cash} € · Moral {player.morale} · Forme {player.form} · Fatigue{' '}
        {player.fatigue}
      </Text>
      {rows.map(([label, value]) => (
        <View key={label} style={styles.statRow}>
          <Text style={styles.statLabel}>{label}</Text>
          <View style={styles.statTrack}>
            <View
              style={[styles.statFill, { width: `${Math.min(100, value)}%` }]}
            />
          </View>
          <Text style={styles.statValue}>{value}</Text>
        </View>
      ))}
    </View>
  );
}

export function StepDots({ step, total }: { step: number; total: number }) {
  return (
    <View style={styles.dots}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[styles.dot, i === step && styles.dotActive, i < step && styles.dotDone]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.mist,
    overflow: 'hidden',
  },
  atmosphereTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '38%',
    backgroundColor: colors.sky,
    opacity: 0.55,
  },
  atmosphereCourt: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '42%',
    backgroundColor: colors.brand,
    opacity: 0.08,
  },
  chalkLine: {
    position: 'absolute',
    top: '36%',
    left: '8%',
    right: '8%',
    height: 2,
    backgroundColor: colors.brand,
    opacity: 0.12,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  brand: {
    fontFamily: fonts.display,
    fontWeight: '400',
    fontSize: 22,
    letterSpacing: 1.5,
    color: colors.brand,
    marginBottom: 6,
  },
  brandRule: {
    width: 56,
    height: 4,
    backgroundColor: colors.ball,
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fonts.display,
    fontWeight: '400',
    fontSize: 30,
    color: colors.brandDeep,
    marginBottom: spacing.sm,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontWeight: '400',
    fontSize: 16,
    color: colors.muted,
    marginBottom: spacing.md,
    lineHeight: 23,
  },
  body: {
    fontFamily: fonts.body,
    fontWeight: '400',
    fontSize: 16,
    color: colors.ink,
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  btn: {
    backgroundColor: colors.brand,
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderRadius: 4,
    alignItems: 'center',
  },
  btnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.brand,
  },
  btnBall: {
    backgroundColor: colors.ball,
  },
  btnDisabled: { opacity: 0.45 },
  btnLabel: {
    fontFamily: fonts.bodyBold,
    fontWeight: '700',
    color: colors.line,
    fontSize: 16,
  },
  btnLabelSecondary: { color: colors.brand },
  btnLabelBall: { color: colors.brandDeep },
  choice: {
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: 'rgba(11,61,46,0.18)',
    padding: spacing.md,
    borderRadius: 4,
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: colors.ball,
  },
  choicePressed: {
    backgroundColor: '#F4FAF6',
    borderColor: colors.brand,
  },
  choiceLabel: {
    fontFamily: fonts.bodySemi,
    fontWeight: '600',
    color: colors.ink,
    fontSize: 15,
    lineHeight: 21,
  },
  choiceHint: {
    fontFamily: fonts.body,
    fontWeight: '400',
    color: colors.muted,
    fontSize: 12,
    marginTop: 4,
  },
  chip: {
    borderWidth: 1.5,
    borderColor: 'rgba(11,61,46,0.25)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: colors.card,
  },
  chipWide: {
    width: '100%',
    marginRight: 0,
  },
  chipSelected: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  chipLabel: {
    fontFamily: fonts.bodySemi,
    fontWeight: '600',
    color: colors.ink,
    fontSize: 14,
  },
  chipLabelSelected: { color: colors.line },
  chipDesc: {
    fontFamily: fonts.body,
    fontWeight: '400',
    color: colors.muted,
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  stats: {
    backgroundColor: colors.card,
    borderRadius: 4,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(11,61,46,0.1)',
  },
  statsName: {
    fontFamily: fonts.display,
    fontWeight: '400',
    fontSize: 18,
    color: colors.brand,
  },
  statsMeta: {
    fontFamily: fonts.body,
    fontWeight: '400',
    color: colors.muted,
    marginBottom: spacing.sm,
    marginTop: 2,
    fontSize: 13,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  statLabel: {
    width: 84,
    fontSize: 12,
    color: colors.muted,
    fontFamily: fonts.bodySemi,
    fontWeight: '600',
  },
  statTrack: {
    flex: 1,
    height: 7,
    backgroundColor: colors.mist,
    borderRadius: 2,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  statFill: {
    height: 7,
    backgroundColor: colors.grass,
  },
  statValue: {
    width: 28,
    textAlign: 'right',
    fontSize: 12,
    color: colors.ink,
    fontFamily: fonts.bodySemi,
  },
  dots: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: 'rgba(11,61,46,0.2)',
  },
  dotActive: {
    width: 22,
    backgroundColor: colors.ball,
  },
  dotDone: {
    backgroundColor: colors.grass,
  },
});
