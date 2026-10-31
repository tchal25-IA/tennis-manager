import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, type MatchBeat, type MatchReward, type Player } from '../api';
import {
  Body,
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

type Props = NativeStackScreenProps<RootStackParamList, 'Reward'>;

export function RewardScreen({ navigation, route }: Props) {
  const { playerId, reward: passed, timeline: passedTimeline, opponentName } =
    route.params;
  const [player, setPlayer] = useState<Player | null>(null);
  const [reward, setReward] = useState<MatchReward | null>(passed ?? null);
  const [timeline, setTimeline] = useState<MatchBeat[]>(passedTimeline ?? []);

  useEffect(() => {
    (async () => {
      try {
        const hub = await api.hub(playerId);
        setPlayer(hub.player);
        if (!passed && hub.lastMatch) {
          setReward({
            cash: hub.lastMatch.rewardCash,
            celebrity: hub.lastMatch.rewardCelebrity,
            won: hub.lastMatch.won,
            scoreline: hub.lastMatch.scoreline,
            narrative: hub.lastMatch.narrative,
          });
        }
      } catch (e) {
        Alert.alert(
          'Erreur',
          e instanceof Error ? e.message : 'Reward indisponible',
        );
      }
    })();
  }, [playerId, passed]);

  async function newCareer() {
    await AsyncStorage.removeItem('playerId');
    navigation.replace('Create');
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <BrandMark />
        <FadeIn>
          {reward?.won ? <Celebration /> : null}
          <Title>{reward?.won ? 'Victoire' : 'Défaite formative'}</Title>
          <Subtitle>
            {opponentName
              ? `Contre ${opponentName}`
              : 'Fin du match — ta carrière continue'}
          </Subtitle>
        </FadeIn>
        {player && <StatsBar player={player} />}
        {reward && (
          <View style={[styles.card, reward.won ? styles.win : styles.loss]}>
            <Text style={styles.score}>{reward.scoreline}</Text>
            <Body>{reward.narrative}</Body>
            <Text style={styles.loot}>
              +{reward.cash} € · +{reward.celebrity} célébrité
            </Text>
            {reward.sponsorBonus ? (
              <Text style={styles.sponsorLoot}>Sponsor inclus : +{reward.sponsorBonus} €</Text>
            ) : null}
            {reward.injury ? (
              <Text style={styles.injuryAlert}>⚕ Alerte médicale : {reward.injury}</Text>
            ) : null}
          </View>
        )}
        {timeline.map((beat, idx) => (
          <View key={`${beat.phase}-${idx}`} style={styles.beat}>
            <Text style={styles.beatTitle}>{beat.title}</Text>
            <Text style={styles.beatDetail}>{beat.detail}</Text>
          </View>
        ))}
        <PrimaryButton
          variant="ball"
          label="Continuer la saison"
          onPress={() => navigation.replace('Hub', { playerId })}
        />
        <PrimaryButton
          variant="secondary"
          label="Nouvelle carrière"
          onPress={newCareer}
        />
      </ScrollView>
    </Screen>
  );
}

function Celebration() {
  const drop = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(drop, { toValue: 1, duration: 2400, useNativeDriver: true }),
    ).start();
  }, [drop]);
  const translateY = drop.interpolate({ inputRange: [0, 1], outputRange: [-20, 130] });
  const rotate = drop.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '260deg'] });
  return (
    <View style={styles.celebration}>
      <Text style={styles.victoryKicker}>MATCH TERMINÉ · VICTOIRE</Text>
      <Text style={styles.cup}>🏆</Text>
      {Array.from({ length: 14 }).map((_, index) => (
        <Animated.View
          key={index}
          style={[
            styles.confetti,
            {
              left: `${5 + index * 7}%`,
              backgroundColor: index % 3 === 0 ? colors.ball : index % 3 === 1 ? colors.clay : colors.line,
              transform: [{ translateY }, { rotate }],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xl },
  celebration: {
    height: 128,
    borderRadius: 16,
    backgroundColor: colors.brandDeep,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  victoryKicker: { color: colors.ball, fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 1.5 },
  cup: { fontSize: 58, marginTop: 4 },
  confetti: { position: 'absolute', top: -8, width: 6, height: 12, borderRadius: 2 },
  card: {
    borderRadius: 4,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1.5,
  },
  win: {
    backgroundColor: '#E7F6EC',
    borderColor: colors.win,
  },
  loss: {
    backgroundColor: '#F8EAEA',
    borderColor: colors.danger,
  },
  score: {
    fontFamily: fonts.display,
    fontSize: 28,
    color: colors.brandDeep,
    marginBottom: spacing.sm,
  },
  loot: {
    fontFamily: fonts.bodyBold,
    color: colors.brand,
    fontSize: 15,
  },
  sponsorLoot: { fontFamily: fonts.bodyBold, color: colors.clay, marginTop: 5 },
  injuryAlert: { fontFamily: fonts.bodyBold, color: colors.danger, marginTop: spacing.sm },
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
