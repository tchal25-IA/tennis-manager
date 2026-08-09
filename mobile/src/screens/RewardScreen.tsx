import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, type MatchReward, type Player } from '../api';
import {
  Body,
  PrimaryButton,
  Screen,
  StatsBar,
  Subtitle,
  Title,
} from '../components/ui';
import { colors, spacing } from '../theme';
import type { RootStackParamList } from '../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Reward'>;

export function RewardScreen({ navigation, route }: Props) {
  const { playerId, reward: passed } = route.params;
  const [player, setPlayer] = useState<Player | null>(null);
  const [reward, setReward] = useState<MatchReward | null>(passed ?? null);

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
        <Title>Récompense</Title>
        <Subtitle>
          {reward?.won ? 'Victoire — carrière lancée' : 'Défaite formative'}
        </Subtitle>
        {player && <StatsBar player={player} />}
        {reward && (
          <>
            <Text style={styles.score}>{reward.scoreline}</Text>
            <Body>{reward.narrative}</Body>
            <Body>
              +{reward.cash} € · +{reward.celebrity} célébrité
            </Body>
          </>
        )}
        <PrimaryButton
          label="Retour au hub"
          onPress={() => navigation.replace('Hub', { playerId })}
        />
        <PrimaryButton label="Nouvelle carrière" onPress={newCareer} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xl },
  score: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.court,
    marginBottom: spacing.sm,
  },
});
