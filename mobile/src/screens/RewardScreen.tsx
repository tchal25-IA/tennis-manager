import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
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
  const [busy, setBusy] = useState(false);

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

  async function rematch() {
    try {
      setBusy(true);
      await api.rematch(playerId);
      navigation.replace('Match', { playerId });
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Rematch impossible');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <BrandMark />
        <FadeIn>
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
          label={busy ? 'Préparation…' : 'Rejouer un match'}
          onPress={rematch}
          disabled={busy}
        />
        <PrimaryButton
          label="Retour au hub"
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

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xl },
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
