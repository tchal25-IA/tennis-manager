import React, { useCallback, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { api, type Player } from '../api';
import {
  Body,
  PrimaryButton,
  Screen,
  StatsBar,
  Subtitle,
  Title,
} from '../components/ui';
import { spacing } from '../theme';
import type { RootStackParamList } from '../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Hub'>;

export function HubScreen({ navigation, route }: Props) {
  const { playerId } = route.params;
  const [player, setPlayer] = useState<Player | null>(null);
  const [hint, setHint] = useState('');
  const [nextStep, setNextStep] = useState<'SCENE' | 'MATCH' | 'DONE'>('SCENE');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const hub = await api.hub(playerId);
      setPlayer(hub.player);
      setHint(hub.loopHint);
      setNextStep(hub.nextStep);
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Hub indisponible');
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (!player) {
    return (
      <Screen>
        <Title>Carrière</Title>
        <Subtitle>Chargement du hub…</Subtitle>
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
        <Title>Hub carrière</Title>
        <Subtitle>{hint}</Subtitle>
        <StatsBar player={player} />
        <Body>
          Étape : {player.careerStage} · Scènes {Math.min(player.sceneIndex, 3)}
          /3
        </Body>

        {nextStep === 'SCENE' && (
          <PrimaryButton
            label="Continuer l’histoire"
            onPress={() => navigation.navigate('Scene', { playerId })}
          />
        )}
        {nextStep === 'MATCH' && (
          <PrimaryButton
            label="Jouer le match tactique"
            onPress={() => navigation.navigate('Match', { playerId })}
          />
        )}
        {nextStep === 'DONE' && (
          <PrimaryButton
            label="Voir la récompense"
            onPress={() => navigation.navigate('Reward', { playerId })}
          />
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xl },
});
