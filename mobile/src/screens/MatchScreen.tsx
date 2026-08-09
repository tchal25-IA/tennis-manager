import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { api, type MatchBeat } from '../api';
import {
  BrandMark,
  Chip,
  FadeIn,
  PrimaryButton,
  Screen,
  Subtitle,
  Title,
} from '../components/ui';
import { colors, fonts, spacing } from '../theme';
import type { RootStackParamList } from '../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Match'>;

type Phase = 'PRE' | 'RALLY' | 'BREAK' | 'FINISH' | 'RESOLVING' | 'TIMELINE';

const SURFACES = [
  { id: 'CLAY' as const, label: 'Terre battue', description: 'Rallies longs' },
  { id: 'GRASS' as const, label: 'Gazon', description: 'Points rapides' },
  { id: 'HARD' as const, label: 'Dur', description: 'Rythme moderne' },
];

const TACTICS = [
  {
    id: 'AGGRESSIVE' as const,
    label: 'Agressif',
    description: 'Monter au filet, forcer le point.',
  },
  {
    id: 'SAFE' as const,
    label: 'Prudent',
    description: 'Longueur de balle, peu d’erreurs.',
  },
  {
    id: 'COUNTER' as const,
    label: 'Contre',
    description: 'Varier les rythmes, surprendre.',
  },
];

const KEYS = [
  {
    id: 'GO_FOR_WINNER' as const,
    label: 'Tenter le winner',
    description: 'Risqué, spectaculaire.',
  },
  {
    id: 'HIGH_PERCENTAGE' as const,
    label: 'Jeu safe',
    description: 'Haut pourcentage, patience.',
  },
  {
    id: 'MIX_PACE' as const,
    label: 'Casser le rythme',
    description: 'Amorti, lift, changement de cadence.',
  },
];

export function MatchScreen({ navigation, route }: Props) {
  const { playerId } = route.params;
  const [surface, setSurface] = useState<(typeof SURFACES)[number]['id']>('CLAY');
  const [preMatchTactic, setPreMatchTactic] =
    useState<(typeof TACTICS)[number]['id']>('COUNTER');
  const [rallyChoice, setRallyChoice] =
    useState<(typeof KEYS)[number]['id']>('HIGH_PERCENTAGE');
  const [breakChoice, setBreakChoice] =
    useState<(typeof KEYS)[number]['id']>('MIX_PACE');
  const [finishChoice, setFinishChoice] =
    useState<(typeof KEYS)[number]['id']>('GO_FOR_WINNER');
  const [phase, setPhase] = useState<Phase>('PRE');
  const [timeline, setTimeline] = useState<MatchBeat[]>([]);
  const [visibleBeats, setVisibleBeats] = useState(0);
  const [loading, setLoading] = useState(false);
  const ticker = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(ticker, {
        toValue: 1,
        duration: 2400,
        useNativeDriver: true,
      }),
    );
    anim.start();
    return () => anim.stop();
  }, [ticker]);

  useEffect(() => {
    if (phase !== 'TIMELINE' || !timeline.length) return;
    setVisibleBeats(0);
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setVisibleBeats(i);
      if (i >= timeline.length) clearInterval(id);
    }, 900);
    return () => clearInterval(id);
  }, [phase, timeline]);

  async function resolveMatch() {
    try {
      setLoading(true);
      setPhase('RESOLVING');
      const res = await api.playMatch({
        playerId,
        surface,
        preMatchTactic,
        rallyChoice,
        breakChoice,
        finishChoice,
      });
      setTimeline(res.timeline ?? []);
      setPhase('TIMELINE');
      setTimeout(() => {
        navigation.replace('Reward', {
          playerId,
          reward: res.reward,
          timeline: res.timeline,
          opponentName: res.opponent?.name,
        });
      }, 900 * ((res.timeline?.length ?? 3) + 1));
    } catch (e) {
      setPhase('FINISH');
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Match impossible');
    } finally {
      setLoading(false);
    }
  }

  const slide = ticker.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -40],
  });

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <BrandMark />
        <FadeIn>
          <Title>Match tactique</Title>
          <Subtitle>
            Tu ne joues pas point à point : tu prends des décisions. Chaque choix
            bascule la tension du match.
          </Subtitle>
        </FadeIn>

        <View style={styles.scoreboard}>
          <Animated.View style={[styles.ballTrace, { transform: [{ translateX: slide }] }]} />
          <Text style={styles.scoreLabel}>TOURNOI JUNIOR · OPEN DE L’ACADÉMIE</Text>
          <Text style={styles.scoreVersus}>Toi  vs  adversaire tiré au sort</Text>
        </View>

        {phase === 'PRE' && (
          <FadeIn>
            <Text style={styles.label}>Surface du match</Text>
            {SURFACES.map((s) => (
              <Chip
                key={s.id}
                label={s.label}
                description={s.description}
                selected={surface === s.id}
                onPress={() => setSurface(s.id)}
              />
            ))}
            <Text style={styles.label}>Tactique d’avant-match</Text>
            {TACTICS.map((s) => (
              <Chip
                key={s.id}
                label={s.label}
                description={s.description}
                selected={preMatchTactic === s.id}
                onPress={() => setPreMatchTactic(s.id)}
              />
            ))}
            <PrimaryButton
              variant="ball"
              label="Entrer sur le court"
              onPress={() => setPhase('RALLY')}
            />
          </FadeIn>
        )}

        {phase === 'RALLY' && (
          <FadeIn>
            <Text style={styles.moment}>Set 1 — Échange long</Text>
            <Subtitle>
              Le match s’installe. Comment abordes-tu les premiers échanges ?
            </Subtitle>
            {KEYS.map((s) => (
              <Chip
                key={s.id}
                label={s.label}
                description={s.description}
                selected={rallyChoice === s.id}
                onPress={() => setRallyChoice(s.id)}
              />
            ))}
            <PrimaryButton
              variant="ball"
              label="Valider ce choix"
              onPress={() => setPhase('BREAK')}
            />
          </FadeIn>
        )}

        {phase === 'BREAK' && (
          <FadeIn>
            <Text style={styles.moment}>Moment clé — Balle de break</Text>
            <Subtitle>
              4-4 au second set. La salle retient son souffle. Que fais-tu ?
            </Subtitle>
            {KEYS.map((s) => (
              <Chip
                key={s.id}
                label={s.label}
                description={s.description}
                selected={breakChoice === s.id}
                onPress={() => setBreakChoice(s.id)}
              />
            ))}
            <PrimaryButton
              variant="ball"
              label="Jouer la balle de break"
              onPress={() => setPhase('FINISH')}
            />
          </FadeIn>
        )}

        {phase === 'FINISH' && (
          <FadeIn>
            <Text style={styles.moment}>Finale — Dernière balle</Text>
            <Subtitle>
              Set décisif. Une seule décision pour refermer (ou tout perdre).
            </Subtitle>
            {KEYS.map((s) => (
              <Chip
                key={s.id}
                label={s.label}
                description={s.description}
                selected={finishChoice === s.id}
                onPress={() => setFinishChoice(s.id)}
              />
            ))}
            <PrimaryButton
              variant="ball"
              label={loading ? 'Résolution…' : 'Résoudre le match'}
              onPress={resolveMatch}
              disabled={loading}
            />
          </FadeIn>
        )}

        {(phase === 'RESOLVING' || phase === 'TIMELINE') && (
          <FadeIn>
            <Text style={styles.moment}>
              {phase === 'RESOLVING' ? 'Le match se joue…' : 'Résumé du match'}
            </Text>
            {timeline.slice(0, visibleBeats).map((beat, idx) => (
              <View key={`${beat.phase}-${idx}`} style={styles.beat}>
                <Text style={styles.beatTitle}>{beat.title}</Text>
                <Text style={styles.beatDetail}>{beat.detail}</Text>
              </View>
            ))}
          </FadeIn>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xl },
  scoreboard: {
    backgroundColor: colors.brandDeep,
    borderRadius: 4,
    padding: spacing.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  ballTrace: {
    position: 'absolute',
    top: 18,
    left: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.ball,
    opacity: 0.85,
  },
  scoreLabel: {
    fontFamily: fonts.body,
    color: colors.ball,
    fontSize: 11,
    letterSpacing: 1.2,
  },
  scoreVersus: {
    fontFamily: fonts.display,
    color: colors.line,
    fontSize: 18,
    marginTop: 6,
  },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.muted,
    marginBottom: 6,
    marginTop: spacing.sm,
  },
  moment: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.clay,
    marginBottom: spacing.sm,
  },
  beat: {
    backgroundColor: colors.card,
    borderLeftWidth: 4,
    borderLeftColor: colors.ball,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 4,
  },
  beatTitle: {
    fontFamily: fonts.bodyBold,
    color: colors.brand,
    marginBottom: 4,
  },
  beatDetail: {
    fontFamily: fonts.body,
    color: colors.ink,
    lineHeight: 21,
  },
});
