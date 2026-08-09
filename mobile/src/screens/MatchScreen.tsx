import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { api } from '../api';
import {
  Chip,
  PrimaryButton,
  Screen,
  Subtitle,
  Title,
} from '../components/ui';
import { colors, spacing } from '../theme';
import type { RootStackParamList } from '../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Match'>;

const SURFACES = [
  { id: 'CLAY', label: 'Terre battue' },
  { id: 'GRASS', label: 'Gazon' },
  { id: 'HARD', label: 'Dur' },
] as const;

const TACTICS = [
  { id: 'AGGRESSIVE', label: 'Agressif (monter au filet)' },
  { id: 'SAFE', label: 'Prudent (longueur de balle)' },
  { id: 'COUNTER', label: 'Contre (varier les rythmes)' },
] as const;

const KEYS = [
  { id: 'GO_FOR_WINNER', label: 'Tenter le winner' },
  { id: 'HIGH_PERCENTAGE', label: 'Jeu à haut pourcentage' },
  { id: 'MIX_PACE', label: 'Casser le rythme' },
] as const;

export function MatchScreen({ navigation, route }: Props) {
  const { playerId } = route.params;
  const [surface, setSurface] = useState<(typeof SURFACES)[number]['id']>('CLAY');
  const [preMatchTactic, setPreMatchTactic] =
    useState<(typeof TACTICS)[number]['id']>('COUNTER');
  const [keyMomentChoice, setKeyMomentChoice] =
    useState<(typeof KEYS)[number]['id']>('HIGH_PERCENTAGE');
  const [phase, setPhase] = useState<'PRE' | 'KEY'>('PRE');
  const [loading, setLoading] = useState(false);

  async function play() {
    try {
      setLoading(true);
      const res = await api.playMatch({
        playerId,
        surface,
        preMatchTactic,
        keyMomentChoice,
      });
      navigation.replace('Reward', {
        playerId,
        reward: res.reward,
      });
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Match impossible');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Title>Match tactique</Title>
        <Subtitle>
          Premier tournoi junior contre Lucas Vermeer. Pas de point à point —
          tes choix décident.
        </Subtitle>

        {phase === 'PRE' ? (
          <View>
            <Text style={styles.label}>Surface du match</Text>
            <View style={styles.row}>
              {SURFACES.map((s) => (
                <Chip
                  key={s.id}
                  label={s.label}
                  selected={surface === s.id}
                  onPress={() => setSurface(s.id)}
                />
              ))}
            </View>
            <Text style={styles.label}>Tactique d’avant-match</Text>
            <View style={styles.row}>
              {TACTICS.map((s) => (
                <Chip
                  key={s.id}
                  label={s.label}
                  selected={preMatchTactic === s.id}
                  onPress={() => setPreMatchTactic(s.id)}
                />
              ))}
            </View>
            <PrimaryButton
              label="Entrer sur le court"
              onPress={() => setPhase('KEY')}
            />
          </View>
        ) : (
          <View>
            <Text style={styles.moment}>Moment clé — balle de break</Text>
            <Subtitle>
              4-4 au second set. Comment gères-tu le point ?
            </Subtitle>
            <View style={styles.row}>
              {KEYS.map((s) => (
                <Chip
                  key={s.id}
                  label={s.label}
                  selected={keyMomentChoice === s.id}
                  onPress={() => setKeyMomentChoice(s.id)}
                />
              ))}
            </View>
            <PrimaryButton
              label={loading ? 'Résolution…' : 'Résoudre le match'}
              onPress={play}
              disabled={loading}
            />
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xl },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.muted,
    marginBottom: 6,
    marginTop: spacing.sm,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.md },
  moment: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.clay,
    marginBottom: spacing.sm,
  },
});
