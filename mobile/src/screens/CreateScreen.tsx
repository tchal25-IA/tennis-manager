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
import {
  BrandMark,
  Chip,
  FadeIn,
  PrimaryButton,
  Screen,
  StepDots,
  Subtitle,
  Title,
} from '../components/ui';
import { colors, fonts, spacing } from '../theme';
import type { RootStackParamList } from '../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Create'>;

const NATIONS = [
  'France',
  'Espagne',
  'Suisse',
  'Belgique',
  'Canada',
  'Italie',
] as const;

const ORIGINS = [
  {
    id: 'MODEST' as const,
    label: 'Famille modeste',
    description:
      'Peu de moyens, beaucoup de grit. Tu as appris à te battre pour chaque heure de court.',
  },
  {
    id: 'MIDDLE' as const,
    label: 'Classe moyenne',
    description:
      'Un club de quartier, des parents présents, un équilibre entre école et entraînement.',
  },
  {
    id: 'PRIVILEGED' as const,
    label: 'Milieu privilégié',
    description:
      'Académies privées, matériel premium, et une pression sociale dès le premier tournoi.',
  },
];

const STYLES = [
  {
    id: 'ATTACKER' as const,
    label: 'Je prends le filet',
    description: 'Jeu offensif : je cherche le point, je monte, je force le destin.',
  },
  {
    id: 'DEFENDER' as const,
    label: 'Je rends chaque balle',
    description: 'Jeu de fond de court : j’use, je défends, je fais craquer l’autre.',
  },
  {
    id: 'ALLROUND' as const,
    label: 'Je m’adapte',
    description: 'Jeu complet : je varie les rythmes et je m’ajuste à l’adversaire.',
  },
];

const SURFACES = [
  {
    id: 'CLAY' as const,
    label: 'Terre battue',
    description: 'Glissades, rallies longs, patience.',
  },
  {
    id: 'GRASS' as const,
    label: 'Gazon',
    description: 'Rebonds bas, points rapides, instinct.',
  },
  {
    id: 'HARD' as const,
    label: 'Dur',
    description: 'Rythme moderne, puissance et précision.',
  },
];

const HANDS = [
  {
    id: 'RIGHT' as const,
    label: 'Droitier',
    description: 'Tu frappes de la main droite.',
  },
  {
    id: 'LEFT' as const,
    label: 'Gaucher',
    description: 'Tu frappes de la main gauche — un cauchemar pour beaucoup.',
  },
];

const TOTAL_STEPS = 6;

export function CreateScreen({ navigation }: Props) {
  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nationality, setNationality] = useState<(typeof NATIONS)[number]>('France');
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
        firstName: firstName.trim() || 'Nina',
        lastName: lastName.trim() || 'Morel',
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

  function next() {
    if (step === 0 && (!firstName.trim() || !lastName.trim())) {
      Alert.alert('Presque', 'Indique ton prénom et ton nom pour entrer à l’académie.');
      return;
    }
    if (step < TOTAL_STEPS - 1) setStep(step + 1);
    else submit();
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <BrandMark />
        <StepDots step={step} total={TOTAL_STEPS} />

        {step === 0 && (
          <FadeIn key="s0">
            <Title>Qui es-tu ?</Title>
            <Subtitle>
              Tu as 16 ans. L’académie ouvre ses portes. Commence par signer ta fiche
              joueur — en français, comme sur le circuit.
            </Subtitle>
            <Field label="Ton prénom" value={firstName} onChange={setFirstName} placeholder="Nina" />
            <Field label="Ton nom" value={lastName} onChange={setLastName} placeholder="Morel" />
          </FadeIn>
        )}

        {step === 1 && (
          <FadeIn key="s1">
            <Title>D’où viens-tu ?</Title>
            <Subtitle>
              La nationalité colore ton parcours, tes premiers tournois, ton accent
              dans les vestiaires.
            </Subtitle>
            <View style={styles.row}>
              {NATIONS.map((n) => (
                <Chip
                  key={n}
                  label={n}
                  selected={nationality === n}
                  onPress={() => setNationality(n)}
                />
              ))}
            </View>
          </FadeIn>
        )}

        {step === 2 && (
          <FadeIn key="s2">
            <Title>Comment as-tu grandi ?</Title>
            <Subtitle>
              Ton origine sociale change ton cash de départ, ta célébrité… et la
              pression que tu portes.
            </Subtitle>
            {ORIGINS.map((o) => (
              <Chip
                key={o.id}
                label={o.label}
                description={o.description}
                selected={socialOrigin === o.id}
                onPress={() => setSocialOrigin(o.id)}
              />
            ))}
          </FadeIn>
        )}

        {step === 3 && (
          <FadeIn key="s3">
            <Title>Quel joueur es-tu sur le court ?</Title>
            <Subtitle>
              Pas de jargon anglais. Dis-nous comment tu joues vraiment quand le
              score serre.
            </Subtitle>
            {STYLES.map((s) => (
              <Chip
                key={s.id}
                label={s.label}
                description={s.description}
                selected={playStyle === s.id}
                onPress={() => setPlayStyle(s.id)}
              />
            ))}
          </FadeIn>
        )}

        {step === 4 && (
          <FadeIn key="s4">
            <Title>Ta surface de cœur</Title>
            <Subtitle>
              Celle où tu te sens chez toi. Un bonus t’attend si tu joues dessus.
            </Subtitle>
            {SURFACES.map((s) => (
              <Chip
                key={s.id}
                label={s.label}
                description={s.description}
                selected={preferredSurface === s.id}
                onPress={() => setPreferredSurface(s.id)}
              />
            ))}
          </FadeIn>
        )}

        {step === 5 && (
          <FadeIn key="s5">
            <Title>De quelle main frappes-tu ?</Title>
            <Subtitle>Dernière question avant le vestiaire.</Subtitle>
            {HANDS.map((h) => (
              <Chip
                key={h.id}
                label={h.label}
                description={h.description}
                selected={dominantHand === h.id}
                onPress={() => setDominantHand(h.id)}
              />
            ))}
          </FadeIn>
        )}

        <PrimaryButton
          variant="ball"
          label={
            loading
              ? 'Inscription…'
              : step === TOTAL_STEPS - 1
                ? 'Entrer à l’académie'
                : 'Continuer'
          }
          onPress={next}
          disabled={loading}
        />
        {step > 0 ? (
          <PrimaryButton
            variant="secondary"
            label="Retour"
            onPress={() => setStep(step - 1)}
            disabled={loading}
          />
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={styles.input}
        autoCapitalize="words"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xl },
  field: { marginBottom: spacing.md },
  fieldLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.muted,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(11,61,46,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 17,
    color: colors.ink,
    fontFamily: fonts.body,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap' },
});
