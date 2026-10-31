import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
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
  const [tournament, setTournament] = useState('Prochain tournoi');
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
    api.hub(playerId)
      .then((hub) => {
        setSurface(hub.upcomingTournament.surface);
        setTournament(hub.upcomingTournament.name);
      })
      .catch((e) =>
        Alert.alert('Erreur', e instanceof Error ? e.message : 'Calendrier indisponible'),
      );
  }, [playerId]);

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(ticker, {
        toValue: 1,
        duration: 1300,
        easing: Easing.inOut(Easing.sin),
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
          <View>
            <Text style={styles.scoreLabel}>COURT CENTRAL · {tournament.toUpperCase()}</Text>
            <Text style={styles.scoreVersus}>THIB  <Text style={styles.liveScore}>30  ·  15</Text>  RIVAL</Text>
          </View>
          <View style={styles.livePill}><View style={styles.liveDot} /><Text style={styles.liveText}>DIRECT</Text></View>
        </View>
        <MatchCourt ticker={ticker} surface={surface} phase={phase} />

        {phase === 'PRE' && (
          <FadeIn>
            <Text style={styles.label}>Surface imposée par le calendrier</Text>
            <View style={styles.surfaceCard}>
              <Text style={styles.surfaceName}>
                {SURFACES.find((item) => item.id === surface)?.label}
              </Text>
              <Text style={styles.surfaceDetail}>
                {SURFACES.find((item) => item.id === surface)?.description}
              </Text>
            </View>
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

function MatchCourt({
  ticker,
  surface,
  phase,
}: {
  ticker: Animated.Value;
  surface: 'CLAY' | 'GRASS' | 'HARD';
  phase: Phase;
}) {
  const ballX = ticker.interpolate({ inputRange: [0, 0.5, 1], outputRange: [-105, 90, -105] });
  const ballY = ticker.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [52, -42, -70, 18, 52] });
  const ballScale = ticker.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1.2, 0.65, 1.2] });
  const nearX = ticker.interpolate({ inputRange: [0, 0.5, 1], outputRange: [-36, 28, -36] });
  const farX = ticker.interpolate({ inputRange: [0, 0.5, 1], outputRange: [30, -24, 30] });
  const racket = ticker.interpolate({ inputRange: [0, 0.15, 0.3, 1], outputRange: ['-25deg', '38deg', '-18deg', '-25deg'] });
  const impact = ticker.interpolate({ inputRange: [0, 0.08, 0.18, 1], outputRange: [0, 1, 0, 0] });
  const courtColor = surface === 'CLAY' ? '#C96A3B' : surface === 'GRASS' ? '#4E8B57' : '#3976A8';
  const action =
    phase === 'RALLY' ? 'TOPSPIN' :
      phase === 'BREAK' ? 'BALLE DE BREAK' :
        phase === 'FINISH' ? 'POINT DÉCISIF' :
          phase === 'TIMELINE' ? 'REPLAY' : 'ÉCHAUFFEMENT';

  return (
    <View style={styles.arena}>
      <View style={styles.crowd}>
        {Array.from({ length: 28 }).map((_, index) => (
          <View key={index} style={[styles.fan, { opacity: 0.35 + (index % 4) * 0.15 }]} />
        ))}
      </View>
      <View style={[styles.court, { backgroundColor: courtColor }]}>
        <View style={styles.courtInner}>
          <View style={styles.centerLine} />
          <View style={styles.serviceLineTop} />
          <View style={styles.serviceLineBottom} />
        </View>
        <View style={styles.net}><View style={styles.netBand} /></View>
        <Animated.View style={[styles.playerFar, { transform: [{ translateX: farX }] }]}>
          <View style={styles.playerHead} />
          <View style={[styles.playerShirt, { backgroundColor: '#F4CB4D' }]} />
          <View style={styles.playerLegs} />
        </Animated.View>
        <Animated.View style={[styles.playerNear, { transform: [{ translateX: nearX }] }]}>
          <View style={styles.playerHead} />
          <View style={[styles.playerShirt, { backgroundColor: colors.brandDeep }]} />
          <View style={styles.playerLegs} />
          <Animated.View style={[styles.racket, { transform: [{ rotate: racket }] }]} />
        </Animated.View>
        <Animated.View style={[styles.impact, { opacity: impact, transform: [{ scale: ballScale }] }]} />
        <Animated.View style={[styles.tennisBall, { transform: [{ translateX: ballX }, { translateY: ballY }, { scale: ballScale }] }]}>
          <View style={styles.ballSeam} />
        </Animated.View>
        <View style={styles.shotBadge}><Text style={styles.shotText}>{action}</Text></View>
      </View>
      <View style={styles.courtFooter}>
        <Text style={styles.speed}>⚡ 168 KM/H</Text>
        <Text style={styles.surfaceBroadcast}>{surface === 'CLAY' ? 'TERRE BATTUE' : surface === 'GRASS' ? 'GAZON' : 'DUR'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xl },
  scoreboard: {
    backgroundColor: colors.brandDeep,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden',
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
  liveScore: { color: colors.ball },
  livePill: { backgroundColor: '#B62635', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 5, flexDirection: 'row', alignItems: 'center' },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.line, marginRight: 4 },
  liveText: { color: colors.line, fontFamily: fonts.bodyBold, fontSize: 9 },
  arena: { backgroundColor: '#15251F', marginBottom: spacing.md, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, overflow: 'hidden' },
  crowd: { height: 40, backgroundColor: '#172A35', flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 10, paddingTop: 7 },
  fan: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#DDE5E1' },
  court: { height: 270, marginHorizontal: 14, marginTop: 8, transform: [{ perspective: 700 }, { rotateX: '8deg' }], overflow: 'hidden' },
  courtInner: { position: 'absolute', top: 16, bottom: 16, left: 22, right: 22, borderWidth: 2, borderColor: 'rgba(255,255,255,.88)' },
  centerLine: { position: 'absolute', top: 0, bottom: 0, left: '50%', width: 2, backgroundColor: 'rgba(255,255,255,.8)' },
  serviceLineTop: { position: 'absolute', top: '28%', left: 0, right: 0, height: 2, backgroundColor: 'rgba(255,255,255,.8)' },
  serviceLineBottom: { position: 'absolute', bottom: '28%', left: 0, right: 0, height: 2, backgroundColor: 'rgba(255,255,255,.8)' },
  net: { position: 'absolute', top: '49%', left: 3, right: 3, height: 10, backgroundColor: 'rgba(15,20,18,.7)', borderTopWidth: 2, borderColor: colors.line, zIndex: 5 },
  netBand: { position: 'absolute', left: 0, right: 0, top: 4, borderTopWidth: 1, borderColor: 'rgba(255,255,255,.35)' },
  playerNear: { position: 'absolute', bottom: 22, left: '47%', alignItems: 'center', zIndex: 6 },
  playerFar: { position: 'absolute', top: 24, left: '48%', alignItems: 'center', transform: [{ scale: 0.72 }], zIndex: 2 },
  playerHead: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#C98662' },
  playerShirt: { width: 27, height: 32, borderTopLeftRadius: 9, borderTopRightRadius: 9, marginTop: -1 },
  playerLegs: { width: 24, height: 26, borderLeftWidth: 7, borderRightWidth: 7, borderColor: '#E7E8E5' },
  racket: { position: 'absolute', right: -24, top: 24, width: 23, height: 34, borderRadius: 13, borderWidth: 3, borderColor: colors.ball },
  tennisBall: { position: 'absolute', left: '50%', top: '50%', width: 15, height: 15, borderRadius: 8, backgroundColor: colors.ball, zIndex: 10, shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 5 },
  ballSeam: { width: 14, height: 7, borderBottomWidth: 1, borderColor: colors.line, borderRadius: 7 },
  impact: { position: 'absolute', bottom: 88, left: '31%', width: 38, height: 38, borderRadius: 19, borderWidth: 3, borderColor: colors.ball, zIndex: 9 },
  shotBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(6,38,28,.8)', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 4 },
  shotText: { color: colors.ball, fontFamily: fonts.bodyBold, fontSize: 9, letterSpacing: 1 },
  courtFooter: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  speed: { color: colors.ball, fontFamily: fonts.display, fontSize: 12 },
  surfaceBroadcast: { color: '#9DB5AA', fontFamily: fonts.bodyBold, fontSize: 10 },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.muted,
    marginBottom: 6,
    marginTop: spacing.sm,
  },
  surfaceCard: {
    backgroundColor: colors.card,
    borderLeftWidth: 4,
    borderLeftColor: colors.clay,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  surfaceName: {
    fontFamily: fonts.bodyBold,
    color: colors.brand,
    fontSize: 15,
  },
  surfaceDetail: {
    fontFamily: fonts.body,
    color: colors.muted,
    marginTop: 3,
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
