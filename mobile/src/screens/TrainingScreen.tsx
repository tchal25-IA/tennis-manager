import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation';
import { api, type Player } from '../api';
import { ChoiceButton, Screen, StatsBar, Subtitle, Title } from '../components/ui';
import { colors, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Training'>;

type TrainingType = 'SERVE' | 'FOREHAND' | 'BACKHAND' | 'PHYSIQUE' | 'MENTAL';

const TRAININGS: { id: TrainingType; label: string; hint: string }[] = [
  { id: 'SERVE', label: 'Service', hint: '+5 service · +2 technique · fatigue +12' },
  { id: 'FOREHAND', label: 'Coup droit', hint: '+5 coup droit · +1 technique · fatigue +10' },
  { id: 'BACKHAND', label: 'Revers', hint: '+5 revers · +2 endurance · fatigue +10' },
  { id: 'PHYSIQUE', label: 'Physique', hint: '+4 endurance · +1 mental · fatigue +15' },
  { id: 'MENTAL', label: 'Mental', hint: '+4 mental · +1 célébrité · fatigue +8' },
];

export function TrainingScreen({ navigation, route }: Props) {
  const { playerId } = route.params;
  const [player, setPlayer] = useState<Player | null>(null);
  const [trainingAlreadyDone, setTrainingAlreadyDone] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.trainingOptions(playerId);
        setPlayer(res.player);
        setTrainingAlreadyDone(res.alreadyTrained);
      } catch (e) {
        Alert.alert(
          'Erreur',
          e instanceof Error ? e.message : 'Options d\'entraînement indisponibles',
        );
      }
    })();
  }, [playerId]);

  async function choose(type: TrainingType) {
    try {
      setLoading(true);
      const res = await api.doTraining({ playerId, trainingType: type });
      setPlayer(res.player);
      // Après l’entraînement, retour au hub pour lancer le match.
      navigation.replace('Hub', { playerId });
    } catch (e) {
      Alert.alert(
        'Erreur',
        e instanceof Error ? e.message : 'Entraînement impossible',
      );
    } finally {
      setLoading(false);
    }
  }

  if (trainingAlreadyDone) {
    return (
      <Screen>
        <Title>Entraînement</Title>
        <Subtitle>Déjà effectué — retour au hub…</Subtitle>
        <View style={{ height: 16 }} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Title>Entraînement</Title>
        <Subtitle>
          Prépare le prochain tournoi. Les gains sont garantis et la fatigue est
          affichée avant de choisir.
        </Subtitle>
        {player ? <StatsBar player={player} /> : null}

        <Text style={styles.label}>Choisis un type d’entraînement</Text>

        {TRAININGS.map((training, index) => (
          <ChoiceButton
            key={training.id}
            index={index}
            label={loading ? '...' : training.label}
            hint={`${training.hint}${player && player.coachLevel > 1 ? ` · coach +${player.coachLevel - 1}` : ''}`}
            onPress={() => choose(training.id)}
          />
        ))}

        <Text style={styles.note}>
          La fatigue augmente après chaque séance. Ta performance au match dépendra aussi de ta forme.
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xl },
  label: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    fontSize: 16,
    fontWeight: '700',
    color: colors.brand,
  },
  note: {
    marginTop: spacing.md,
    color: colors.muted,
    lineHeight: 20,
  },
});

