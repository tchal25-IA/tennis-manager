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
import { api, type Player } from '../api';
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

type Props = NativeStackScreenProps<RootStackParamList, 'Hub'>;

export function HubScreen({ navigation, route }: Props) {
  const { playerId } = route.params;
  const [player, setPlayer] = useState<Player | null>(null);
  const [hint, setHint] = useState('');
  const [nextStep, setNextStep] = useState<'SCENE' | 'MATCH' | 'DONE'>('SCENE');
  const [matchesPlayed, setMatchesPlayed] = useState(0);
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

  async function startRematch() {
    try {
      setLoading(true);
      const hub = await api.rematch(playerId);
      setPlayer(hub.player);
      setNextStep(hub.nextStep);
      setHint(hub.loopHint);
      navigation.navigate('Match', { playerId });
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Rematch impossible');
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
              {player.careerStage} · Scènes {Math.min(player.sceneIndex, 3)}/3 ·
              Matchs {matchesPlayed}
            </Text>
          </View>
        </Animated.View>

        {nextStep === 'SCENE' && (
          <PrimaryButton
            variant="ball"
            label="Continuer l’histoire"
            onPress={() => navigation.navigate('Scene', { playerId })}
          />
        )}
        {nextStep === 'MATCH' && (
          <PrimaryButton
            variant="ball"
            label="Entrer sur le court"
            onPress={() => navigation.navigate('Match', { playerId })}
          />
        )}
        {nextStep === 'DONE' && (
          <>
            <Body>
              Tu as fini le parcours de départ. Rejoue un match pour tester une
              autre tactique, ou recommence une carrière depuis zéro.
            </Body>
            <PrimaryButton
              variant="ball"
              label="Rejouer un match"
              onPress={startRematch}
              disabled={loading}
            />
            <PrimaryButton
              label="Voir la dernière récompense"
              onPress={() => navigation.navigate('Reward', { playerId })}
            />
          </>
        )}
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
});
