import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api';
import { Chip, PrimaryButton, Screen, Subtitle, Title } from '../components/ui';
import { colors, spacing } from '../theme';
import type { RootStackParamList } from '../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Create'>;

const STYLES = [
  { id: 'ATTACKER', label: 'Attaquant' },
  { id: 'DEFENDER', label: 'Défenseur' },
  { id: 'ALLROUND', label: 'Complet' },
] as const;

const ORIGINS = [
  { id: 'MODEST', label: 'Modeste' },
  { id: 'MIDDLE', label: 'Classe moyenne' },
  { id: 'PRIVILEGED', label: 'Privilégié' },
] as const;

const SURFACES = [
  { id: 'CLAY', label: 'Terre battue' },
  { id: 'GRASS', label: 'Gazon' },
  { id: 'HARD', label: 'Dur' },
] as const;

const HANDS = [
  { id: 'RIGHT', label: 'Droitier' },
  { id: 'LEFT', label: 'Gaucher' },
] as const;

export function CreateScreen({ navigation }: Props) {
  const [firstName, setFirstName] = useState('Nina');
  const [lastName, setLastName] = useState('Morel');
  const [nationality, setNationality] = useState('France');
  const [playStyle, setPlayStyle] = useState<(typeof STYLES)[number]['id']>('ALLROUND');
  const [socialOrigin, setSocialOrigin] =
    useState<(typeof ORIGINS)[number]['id']>('MIDDLE');
  const [preferredSurface, setPreferredSurface] =
    useState<(typeof SURFACES)[number]['id']>('CLAY');
  const [dominantHand, setDominantHand] =
    useState<(typeof HANDS)[number]['id']>('RIGHT');
  const [loading, setLoading] = useState(false);

  async function submit() {
    try {
      setLoading(true);
      const player = await api.createPlayer({
        firstName,
        lastName,
        nationality,
        playStyle,
        socialOrigin,
        preferredSurface,
        dominantHand,
      });
      await AsyncStorage.setItem('playerId', player.id);
      navigation.replace('Hub', { playerId: player.id });
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Création impossible');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Title>Tennis Manager</Title>
        <Subtitle>
          Crée ton joueur. De l’académie junior au premier match — tes choix
          comptent.
        </Subtitle>

        <Field label="Prénom" value={firstName} onChange={setFirstName} />
        <Field label="Nom" value={lastName} onChange={setLastName} />
        <Field
          label="Nationalité"
          value={nationality}
          onChange={setNationality}
        />

        <Section label="Style de jeu">
          {STYLES.map((s) => (
            <Chip
              key={s.id}
              label={s.label}
              selected={playStyle === s.id}
              onPress={() => setPlayStyle(s.id)}
            />
          ))}
        </Section>

        <Section label="Origine sociale">
          {ORIGINS.map((s) => (
            <Chip
              key={s.id}
              label={s.label}
              selected={socialOrigin === s.id}
              onPress={() => setSocialOrigin(s.id)}
            />
          ))}
        </Section>

        <Section label="Surface préférée">
          {SURFACES.map((s) => (
            <Chip
              key={s.id}
              label={s.label}
              selected={preferredSurface === s.id}
              onPress={() => setPreferredSurface(s.id)}
            />
          ))}
        </Section>

        <Section label="Main dominante">
          {HANDS.map((s) => (
            <Chip
              key={s.id}
              label={s.label}
              selected={dominantHand === s.id}
              onPress={() => setDominantHand(s.id)}
            />
          ))}
        </Section>

        <PrimaryButton
          label={loading ? 'Création…' : 'Commencer la carrière'}
          onPress={submit}
          disabled={loading || !firstName.trim() || !lastName.trim()}
        />
      </ScrollView>
    </Screen>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        style={styles.input}
        autoCapitalize="words"
      />
    </View>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.row}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xl },
  field: { marginBottom: spacing.md },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.muted,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D5E0DA',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.ink,
  },
  section: { marginBottom: spacing.md },
  row: { flexDirection: 'row', flexWrap: 'wrap' },
});
