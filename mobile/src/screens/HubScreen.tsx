import React, { useCallback, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, type HubResponse, type Player } from '../api';
import {
  BrandMark,
  FadeIn,
  PrimaryButton,
  Screen,
  StatsBar,
  Subtitle,
  Title,
} from '../components/ui';
import { colors, fonts, spacing } from '../theme';
import type { RootStackParamList } from '../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Hub'>;

export function HubScreen({ navigation, route }: Props) {
  const { playerId } = route.params;
  const [player, setPlayer] = useState<Player | null>(null);
  const [hint, setHint] = useState('');
  const [nextStep, setNextStep] = useState<
    'SCENE' | 'DAILY' | 'EVENT' | 'RECOVERY' | 'TRAINING' | 'MATCH'
  >('SCENE');
  const [matchesPlayed, setMatchesPlayed] = useState(0);
  const [career, setCareer] = useState<HubResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pulse = useRef(new Animated.Value(1)).current;

  const resetCareer = useCallback(async () => {
    await AsyncStorage.removeItem('playerId');
    navigation.replace('Create');
  }, [navigation]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const hub = await api.hub(playerId);
      setPlayer(hub.player);
      setCareer(hub);
      setHint(hub.loopHint);
      setNextStep(hub.nextStep);
      setMatchesPlayed(hub.matchesPlayed ?? 0);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Hub indisponible';
      setError(msg);
      setPlayer(null);
      if (/introuvable|Not Found|404/i.test(msg)) {
        await AsyncStorage.removeItem('playerId');
        Alert.alert(
          'Profil expiré',
          'La session serveur a été réinitialisée. Crée un nouveau joueur.',
          [{ text: 'OK', onPress: () => navigation.replace('Create') }],
        );
      }
    } finally {
      setLoading(false);
    }
  }, [navigation, playerId]);

  useFocusEffect(
    useCallback(() => {
      load();
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1.03,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }, [load, pulse]),
  );

  async function claimDaily() {
    try {
      setLoading(true);
      const reward = await api.claimDaily(playerId);
      Alert.alert(
        'Récompense récupérée',
        `+${reward.amount} € · série de ${reward.streak} jour${reward.streak > 1 ? 's' : ''}`,
      );
      await load();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Récompense indisponible');
    } finally {
      setLoading(false);
    }
  }

  async function upgradeCoach() {
    try {
      setLoading(true);
      const result = await api.upgradeCoach(playerId);
      Alert.alert(
        'Staff renforcé',
        `Coach niveau ${result.player.coachLevel} · +${result.trainingBonus} sur les gains d’entraînement`,
      );
      await load();
    } catch (e) {
      Alert.alert('Recrutement', e instanceof Error ? e.message : 'Amélioration impossible');
    } finally {
      setLoading(false);
    }
  }

  async function mutate(action: () => Promise<unknown>, success: string) {
    try {
      setLoading(true);
      await action();
      Alert.alert('Carrière mise à jour', success);
      await load();
    } catch (e) {
      Alert.alert('Décision impossible', e instanceof Error ? e.message : 'Réessaie');
    } finally {
      setLoading(false);
    }
  }

  if (!player) {
    return (
      <Screen>
        <BrandMark />
        <Title>Carrière</Title>
        <Subtitle>{error ? error : 'Chargement du hub…'}</Subtitle>
        {error ? (
          <PrimaryButton label="Nouvelle carrière" onPress={resetCareer} />
        ) : null}
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} />
        }
        contentContainerStyle={styles.content}
      >
        <BrandMark />
        <FadeIn>
          <View style={styles.hero}>
            <View style={styles.avatar}>
              <Text style={styles.avatarHair}>●</Text>
              <View style={styles.avatarHead} />
              <View style={styles.avatarBody} />
              <Text style={styles.avatarFlag}>{player.nationality.slice(0, 2).toUpperCase()}</Text>
            </View>
            <View style={styles.heroCopy}>
              <Text style={styles.heroKicker}>{player.careerStage} · MONDE #{player.ranking}</Text>
              <Text style={styles.heroName}>{player.firstName} {player.lastName}</Text>
              <Text style={styles.heroMeta}>{player.playStyle} · {player.preferredSurface} · {player.sponsor === 'AUCUN' ? 'Libre de sponsor' : player.sponsor}</Text>
              <View style={styles.levelTrack}>
                <View style={[styles.levelFill, { width: `${Math.min(100, 25 + player.currentWeek * 7)}%` }]} />
              </View>
            </View>
          </View>
          <Subtitle>{hint}</Subtitle>
        </FadeIn>
        <StatsBar player={player} />
        <Animated.View style={{ transform: [{ scale: pulse }] }}>
          <View style={styles.banner}>
            <Text style={styles.bannerLabel}>Étape</Text>
            <Text style={styles.bannerValue}>
              Saison {player.currentSeason} · Semaine {player.currentWeek}/10 · Rang {player.ranking}
            </Text>
          </View>
        </Animated.View>

        {career ? (
          <View style={styles.dashboardRow}>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{career.stats.winRate}%</Text>
              <Text style={styles.metricLabel}>Victoires</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{matchesPlayed}</Text>
              <Text style={styles.metricLabel}>Matchs</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{player.tournamentsWon}</Text>
              <Text style={styles.metricLabel}>Titres</Text>
            </View>
          </View>
        ) : null}

        {nextStep === 'SCENE' && (
          <PrimaryButton
            variant="ball"
            label="Continuer l’histoire"
            onPress={() => navigation.navigate('Scene', { playerId })}
          />
        )}
        {nextStep === 'DAILY' && career && (
          <View style={styles.dailyCard}>
            <Text style={styles.cardEyebrow}>SÉRIE QUOTIDIENNE · {career.dailyReward.streak} J</Text>
            <Text style={styles.cardTitle}>Prime du centre</Text>
            <Text style={styles.cardCopy}>
              Reviens chaque jour pour augmenter la prime, sans publicité ni achat.
            </Text>
            <PrimaryButton
              variant="ball"
              label={`Récupérer ${career.dailyReward.amount} €`}
              onPress={claimDaily}
              disabled={loading}
            />
          </View>
        )}
        {nextStep === 'EVENT' && career?.weeklyEvent && (
          <FadeIn>
            <View style={styles.storyCard}>
              <Text style={styles.cardEyebrow}>ÉVÉNEMENT · {career.weeklyEvent.speaker}</Text>
              <Text style={styles.storyTitle}>{career.weeklyEvent.title}</Text>
              <Text style={styles.storyBody}>{career.weeklyEvent.body}</Text>
              {career.weeklyEvent.choices.map((choice) => (
                <Pressable
                  key={choice.id}
                  style={({ pressed }) => [styles.storyChoice, pressed && { opacity: 0.7 }]}
                  onPress={() => mutate(
                    () => api.resolveEvent(playerId, choice.id),
                    choice.label,
                  )}
                >
                  <Text style={styles.storyChoiceText}>{choice.label} →</Text>
                </Pressable>
              ))}
            </View>
          </FadeIn>
        )}
        {nextStep === 'RECOVERY' && career && (
          <View style={styles.injuryCard}>
            <Text style={styles.cardEyebrow}>INFIRMERIE · RISQUE {career.health.risk}</Text>
            <Text style={styles.storyTitle}>{career.health.injury}</Text>
            <Text style={styles.storyBody}>Ton physio prépare un protocole accéléré pour revenir sur le circuit.</Text>
            <PrimaryButton
              variant="ball"
              label="Lancer les soins"
              onPress={() => mutate(() => api.recover(playerId), 'Tu peux reprendre la compétition.')}
            />
          </View>
        )}
        {nextStep === 'TRAINING' && (
          <PrimaryButton
            label="Faire un entraînement"
            onPress={() => navigation.navigate('Training', { playerId })}
          />
        )}
        {nextStep === 'MATCH' && (
          <PrimaryButton
            variant="ball"
            label="Entrer sur le court"
            onPress={() => navigation.navigate('Match', { playerId })}
          />
        )}
        {career ? (
          <>
            <Text style={styles.sectionTitle}>Centre de performance</Text>
            <View style={styles.performanceGrid}>
              <View style={styles.performanceCard}>
                <Text style={styles.performanceIcon}>♥</Text>
                <Text style={styles.performanceValue}>{career.health.value}%</Text>
                <Text style={styles.metricLabel}>Santé · risque {career.health.risk.toLowerCase()}</Text>
              </View>
              <View style={styles.performanceCard}>
                <Text style={styles.performanceIcon}>⚡</Text>
                <Text style={styles.performanceValue}>{100 - player.fatigue}%</Text>
                <Text style={styles.metricLabel}>Énergie disponible</Text>
              </View>
            </View>

            <View style={styles.rivalCard}>
              <View style={styles.rivalAvatar}><Text style={styles.rivalInitials}>LV</Text></View>
              <View style={styles.eventMain}>
                <Text style={styles.cardEyebrow}>{career.rival.status}</Text>
                <Text style={styles.rivalName}>{career.rival.name}</Text>
                <Text style={styles.cardCopy}>Tension {career.rival.score}/100 · défenseur néerlandais</Text>
              </View>
              <Text style={styles.versus}>VS</Text>
            </View>

            <Text style={styles.sectionTitle}>Palmarès</Text>
            <View style={styles.trophyShelf}>
              <Trophy icon="♛" value={career.trophies.grandSlams} label="Grands Chelems" gold />
              <Trophy icon="★" value={career.trophies.titles} label="Titres" />
              <Trophy icon="◆" value={career.trophies.season} label="Saison" />
            </View>

            <Text style={styles.sectionTitle}>Calendrier de la saison</Text>
            {career.calendar.map((event) => (
              <View
                key={event.week}
                style={[styles.event, event.status === 'NEXT' && styles.eventNext]}
              >
                <Text style={styles.eventWeek}>S{event.week}</Text>
                <View style={styles.eventMain}>
                  <Text style={styles.eventName}>{event.name}</Text>
                  <Text style={styles.eventMeta}>{event.surface} · {event.tier}</Text>
                </View>
                <Text style={styles.eventStatus}>
                  {event.status === 'PLAYED' ? '✓' : event.status === 'NEXT' ? 'À JOUER' : event.major ? '♛' : '•'}
                </Text>
              </View>
            ))}

            <Text style={styles.sectionTitle}>Staff</Text>
            <View style={styles.staffRow}>
              <StaffCard role="Coach" initials="CM" level={career.staff.coachLevel} color={colors.clay} onPress={upgradeCoach} />
              <StaffCard role="Physio" initials="SB" level={career.staff.physioLevel} color={colors.grass} onPress={() => mutate(() => api.upgradeStaff(playerId, 'physio'), 'Le physio progresse.')} />
              <StaffCard role="Agente" initials="ML" level={career.staff.agentLevel} color="#7158A8" onPress={() => mutate(() => api.upgradeStaff(playerId, 'agent'), 'Ton agente ouvre de nouvelles portes.')} />
            </View>

            <Text style={styles.sectionTitle}>Sponsors</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalRail}>
              {career.sponsors.map((sponsor) => (
                <Pressable
                  key={sponsor.id}
                  style={[styles.dealCard, player.sponsor === sponsor.id && styles.dealSelected]}
                  onPress={() => mutate(() => api.signSponsor(playerId, sponsor.id), `Contrat signé avec ${sponsor.name}.`)}
                >
                  <Text style={styles.dealLogo}>{sponsor.name.slice(0, 2).toUpperCase()}</Text>
                  <Text style={styles.dealName}>{sponsor.name}</Text>
                  <Text style={styles.dealBonus}>{sponsor.bonus}</Text>
                  <Text style={styles.dealReq}>{player.sponsor === sponsor.id ? 'ACTIF' : `${sponsor.requirement} célébrité`}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={styles.sectionTitle}>Vestiaire & équipement</Text>
            <View style={styles.equipmentHero}>
              <View style={styles.racketVisual}>
                <View style={styles.racketHead}><View style={styles.racketStrings} /></View>
                <View style={styles.racketShaft} />
              </View>
              <View style={styles.eventMain}>
                <Text style={styles.cardEyebrow}>ÉQUIPEMENT ACTUEL</Text>
                <Text style={styles.cardTitle}>{player.racket === 'PROSPIN_X' ? 'ProSpin X' : 'Raquette Académie'}</Text>
                <Text style={styles.cardCopy}>{player.shoes === 'COURTFLY' ? 'CourtFly · fatigue réduite' : 'Chaussures Académie'}</Text>
              </View>
            </View>
            {career.equipment.offers.map((offer) => (
              <Pressable
                key={offer.id}
                style={styles.shopRow}
                onPress={() => mutate(() => api.buyEquipment(playerId, offer.id), `${offer.label} équipé.`)}
              >
                <View>
                  <Text style={styles.eventName}>{offer.label}</Text>
                  <Text style={styles.eventMeta}>{offer.bonus}</Text>
                </View>
                <Text style={styles.shopPrice}>{offer.cost} € →</Text>
              </Pressable>
            ))}
          </>
        ) : null}
        <PrimaryButton
          variant="secondary"
          label="Nouvelle carrière"
          onPress={resetCareer}
        />
      </ScrollView>
    </Screen>
  );
}

function Trophy({ icon, value, label, gold = false }: { icon: string; value: number; label: string; gold?: boolean }) {
  return (
    <View style={[styles.trophy, gold && styles.trophyGold]}>
      <Text style={styles.trophyIcon}>{icon}</Text>
      <Text style={styles.trophyValue}>{value}</Text>
      <Text style={styles.trophyLabel}>{label}</Text>
    </View>
  );
}

function StaffCard({ role, initials, level, color, onPress }: {
  role: string;
  initials: string;
  level: number;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.staffMini} onPress={onPress}>
      <View style={[styles.staffAvatar, { backgroundColor: color }]}>
        <Text style={styles.staffInitials}>{initials}</Text>
      </View>
      <Text style={styles.staffRole}>{role}</Text>
      <Text style={styles.staffLevel}>NIV. {level} · {level >= 3 ? 'MAX' : '↑'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xl },
  banner: {
    backgroundColor: colors.brand,
    padding: spacing.md,
    borderRadius: 4,
    marginBottom: spacing.md,
  },
  bannerLabel: {
    fontFamily: fonts.body,
    color: colors.ball,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  bannerValue: {
    fontFamily: fonts.display,
    color: colors.line,
    fontSize: 16,
    marginTop: 4,
  },
  dashboardRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  metric: {
    flex: 1,
    backgroundColor: colors.card,
    padding: spacing.sm,
    borderRadius: 4,
    alignItems: 'center',
  },
  metricValue: {
    fontFamily: fonts.display,
    color: colors.brand,
    fontSize: 20,
  },
  metricLabel: {
    fontFamily: fonts.body,
    color: colors.muted,
    fontSize: 11,
    marginTop: 2,
  },
  dailyCard: {
    backgroundColor: colors.brandDeep,
    padding: spacing.md,
    borderRadius: 4,
    marginBottom: spacing.md,
  },
  cardEyebrow: {
    fontFamily: fonts.bodyBold,
    color: colors.ball,
    fontSize: 11,
    letterSpacing: 1,
  },
  cardTitle: {
    fontFamily: fonts.display,
    color: colors.brand,
    fontSize: 18,
    marginTop: 4,
  },
  cardCopy: {
    fontFamily: fonts.body,
    color: colors.muted,
    lineHeight: 19,
    marginTop: 4,
  },
  sectionTitle: {
    fontFamily: fonts.display,
    color: colors.brandDeep,
    fontSize: 18,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  event: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(11,61,46,0.15)',
    marginBottom: 6,
  },
  eventNext: {
    borderLeftColor: colors.ball,
    backgroundColor: '#F4FAF6',
  },
  eventWeek: {
    width: 30,
    fontFamily: fonts.bodyBold,
    color: colors.muted,
  },
  eventMain: { flex: 1 },
  eventName: {
    fontFamily: fonts.bodyBold,
    color: colors.ink,
  },
  eventMeta: {
    fontFamily: fonts.body,
    color: colors.muted,
    fontSize: 11,
    marginTop: 2,
  },
  eventStatus: {
    fontFamily: fonts.bodyBold,
    color: colors.brand,
    fontSize: 11,
  },
  staffCard: {
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: 4,
    marginBottom: spacing.md,
  },
  staffCopy: { marginBottom: spacing.sm },
  maxLevel: {
    fontFamily: fonts.bodyBold,
    color: colors.grass,
    marginTop: spacing.sm,
  },
  hero: {
    backgroundColor: colors.brandDeep,
    borderRadius: 18,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  avatar: {
    width: 86,
    height: 104,
    borderRadius: 14,
    backgroundColor: '#D7EAA8',
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginRight: spacing.md,
  },
  avatarHair: { position: 'absolute', top: 8, fontSize: 48, color: '#2A1A11' },
  avatarHead: { position: 'absolute', top: 24, width: 40, height: 44, borderRadius: 20, backgroundColor: '#D89B72' },
  avatarBody: { width: 72, height: 50, borderTopLeftRadius: 30, borderTopRightRadius: 30, backgroundColor: colors.clay },
  avatarFlag: { position: 'absolute', bottom: 5, color: colors.line, fontFamily: fonts.bodyBold, fontSize: 10 },
  heroCopy: { flex: 1 },
  heroKicker: { color: colors.ball, fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 1 },
  heroName: { color: colors.line, fontFamily: fonts.display, fontSize: 22, marginVertical: 4 },
  heroMeta: { color: '#BFD1C7', fontFamily: fonts.body, fontSize: 11 },
  levelTrack: { height: 5, backgroundColor: '#234C40', borderRadius: 3, marginTop: spacing.sm, overflow: 'hidden' },
  levelFill: { height: 5, backgroundColor: colors.ball },
  storyCard: { backgroundColor: '#5E3127', padding: spacing.lg, borderRadius: 16, marginBottom: spacing.md },
  injuryCard: { backgroundColor: '#5B2026', padding: spacing.lg, borderRadius: 16, marginBottom: spacing.md },
  storyTitle: { color: colors.line, fontFamily: fonts.display, fontSize: 22, marginTop: 5 },
  storyBody: { color: '#F0DDD5', fontFamily: fonts.body, fontSize: 15, lineHeight: 22, marginVertical: spacing.md },
  storyChoice: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,.18)', paddingVertical: 13 },
  storyChoiceText: { color: colors.ball, fontFamily: fonts.bodyBold, fontSize: 14 },
  performanceGrid: { flexDirection: 'row', gap: spacing.sm },
  performanceCard: { flex: 1, backgroundColor: colors.card, padding: spacing.md, borderRadius: 12 },
  performanceIcon: { color: colors.clay, fontSize: 18 },
  performanceValue: { fontFamily: fonts.display, color: colors.brandDeep, fontSize: 24, marginVertical: 3 },
  rivalCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#101E2E', padding: spacing.md, borderRadius: 14, marginTop: spacing.sm },
  rivalAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#D8A65B', alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  rivalInitials: { fontFamily: fonts.display, color: '#101E2E', fontSize: 16 },
  rivalName: { fontFamily: fonts.display, color: colors.line, fontSize: 18 },
  versus: { fontFamily: fonts.display, color: colors.clay, fontSize: 20 },
  trophyShelf: { flexDirection: 'row', gap: spacing.sm },
  trophy: { flex: 1, alignItems: 'center', backgroundColor: colors.card, borderRadius: 12, paddingVertical: spacing.md },
  trophyGold: { backgroundColor: '#FFF2B7' },
  trophyIcon: { fontSize: 28, color: '#C18A12' },
  trophyValue: { fontFamily: fonts.display, fontSize: 20, color: colors.brandDeep },
  trophyLabel: { fontFamily: fonts.body, color: colors.muted, fontSize: 10, textAlign: 'center' },
  staffRow: { flexDirection: 'row', gap: spacing.sm },
  staffMini: { flex: 1, backgroundColor: colors.card, borderRadius: 12, padding: spacing.sm, alignItems: 'center' },
  staffAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  staffInitials: { fontFamily: fonts.display, color: colors.line },
  staffRole: { fontFamily: fonts.bodyBold, color: colors.ink, marginTop: 6 },
  staffLevel: { fontFamily: fonts.body, color: colors.muted, fontSize: 10, marginTop: 2 },
  horizontalRail: { marginHorizontal: -spacing.lg, paddingHorizontal: spacing.lg },
  dealCard: { width: 156, backgroundColor: colors.card, borderRadius: 14, padding: spacing.md, marginRight: spacing.sm, borderWidth: 2, borderColor: 'transparent' },
  dealSelected: { borderColor: colors.ball },
  dealLogo: { width: 42, height: 42, borderRadius: 10, textAlign: 'center', textAlignVertical: 'center', backgroundColor: colors.brandDeep, color: colors.ball, fontFamily: fonts.display, paddingTop: 11 },
  dealName: { fontFamily: fonts.display, color: colors.ink, marginTop: spacing.sm },
  dealBonus: { fontFamily: fonts.body, color: colors.grass, fontSize: 11, marginTop: 3 },
  dealReq: { fontFamily: fonts.bodyBold, color: colors.muted, fontSize: 9, marginTop: spacing.sm },
  equipmentHero: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E0E8D2', padding: spacing.md, borderRadius: 14 },
  racketVisual: { width: 70, height: 90, alignItems: 'center', marginRight: spacing.md },
  racketHead: { width: 48, height: 60, borderRadius: 24, borderWidth: 5, borderColor: colors.brand, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-18deg' }] },
  racketStrings: { width: 30, height: 40, borderWidth: 1, borderColor: colors.muted, opacity: 0.5 },
  racketShaft: { width: 8, height: 32, backgroundColor: colors.clay, marginTop: -5, transform: [{ rotate: '-18deg' }] },
  shopRow: { backgroundColor: colors.card, borderRadius: 10, padding: spacing.md, marginTop: spacing.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  shopPrice: { fontFamily: fonts.bodyBold, color: colors.clay },
});
