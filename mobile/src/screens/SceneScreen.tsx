import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { api, type Player, type Scene } from '../api';
import {
  Body,
  BrandMark,
  ChoiceButton,
  FadeIn,
  Screen,
  StatsBar,
  Subtitle,
  Title,
} from '../components/ui';
import { colors, fonts, spacing } from '../theme';
import type { RootStackParamList } from '../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Scene'>;

function impactHint(c: Scene['choices'][number]) {
  const parts: string[] = [];
  if (c.deltaTechnique) parts.push(`Tech ${fmt(c.deltaTechnique)}`);
  if (c.deltaEndurance) parts.push(`Endu ${fmt(c.deltaEndurance)}`);
  if (c.deltaMental) parts.push(`Mental ${fmt(c.deltaMental)}`);
  if (c.deltaCelebrity) parts.push(`Célébrité ${fmt(c.deltaCelebrity)}`);
  if (c.deltaCash) parts.push(`Cash ${fmt(c.deltaCash)}€`);
  if (c.deltaMorale) parts.push(`Moral ${fmt(c.deltaMorale)}`);
  return parts.join(' · ');
}

function fmt(n: number) {
  return n > 0 ? `+${n}` : `${n}`;
}

export function SceneScreen({ navigation, route }: Props) {
  const { playerId } = route.params;
  const [player, setPlayer] = useState<Player | null>(null);
  const [scene, setScene] = useState<Scene | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.currentScene(playerId);
      setPlayer(data.player);
      if (data.done) {
        navigation.replace('Hub', { playerId });
        return;
      }
      setScene(data.scene);
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Scène indisponible');
    }
  }, [navigation, playerId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function choose(choiceId: string) {
    try {
      setBusy(true);
      const res = await api.resolveChoice(playerId, choiceId);
      setPlayer(res.player);
      if (res.next.done) {
        navigation.replace('Hub', { playerId });
      } else {
        setScene(res.next.scene);
      }
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Choix impossible');
    } finally {
      setBusy(false);
    }
  }

  if (!player || !scene) {
    return (
      <Screen>
        <BrandMark />
        <Title>Histoire</Title>
        <Subtitle>Chargement de la scène…</Subtitle>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <BrandMark />
        <FadeIn>
          <Title>{scene.title}</Title>
          <Subtitle>
            Scène {scene.orderIndex + 1}/3 · {scene.speaker}
          </Subtitle>
        </FadeIn>
        <StatsBar player={player} />
        <View style={styles.dialogue}>
          <Text style={styles.speaker}>{scene.speaker}</Text>
          <Body>{scene.body}</Body>
        </View>
        {scene.choices.map((c, index) => (
          <ChoiceButton
            key={c.id}
            index={index}
            label={busy ? '…' : c.label}
            hint={busy ? undefined : impactHint(c)}
            onPress={() => !busy && choose(c.id)}
          />
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xl },
  dialogue: {
    backgroundColor: colors.card,
    borderRadius: 4,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.clay,
  },
  speaker: {
    fontFamily: fonts.display,
    color: colors.brand,
    marginBottom: 6,
    fontSize: 16,
  },
});
