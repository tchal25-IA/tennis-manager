import React, { useCallback, useRef, useState } from 'react';
import {
  Alert,
  Animated,
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
    'SCENE' | 'DAILY' | 'TRAINING' | 'MATCH'
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
          <Title>Hub carrière</Title>
          <Subtitle>{hint}</Subtitle>
        </FadeIn>
        <StatsBar player={player} />
        <Animated.View style={{ transform: [{ scale: pulse }] }}>
          <View style={styles.banner}>
            <Text style={styles.bannerLabel}>Étape</Text>
            <Text style={styles.bannerValue}>
              Saison {player.currentSeason} · Semaine {player.currentWeek}/8 · Rang {player.ranking}
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
                  {event.status === 'PLAYED' ? '✓' : event.status === 'NEXT' ? 'À JOUER' : '•'}
                </Text>
              </View>
            ))}

            <Text style={styles.sectionTitle}>Staff</Text>
            <View style={styles.staffCard}>
              <View style={styles.staffCopy}>
                <Text style={styles.cardTitle}>Coach niveau {career.staff.coachLevel}</Text>
                <Text style={styles.cardCopy}>
                  Bonus actuel : +{career.staff.trainingBonus} sur les gains principaux.
                </Text>
              </View>
              {career.staff.upgradeCost ? (
                <PrimaryButton
                  label={`Améliorer · ${career.staff.upgradeCost} €`}
                  onPress={upgradeCoach}
                  disabled={loading}
                />
              ) : (
                <Text style={styles.maxLevel}>NIVEAU MAX</Text>
              )}
            </View>
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
});
