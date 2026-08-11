import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Text,
  View,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CreateScreen } from './src/screens/CreateScreen';
import { HubScreen } from './src/screens/HubScreen';
import { SceneScreen } from './src/screens/SceneScreen';
import { TrainingScreen } from './src/screens/TrainingScreen';
import { MatchScreen } from './src/screens/MatchScreen';
import { RewardScreen } from './src/screens/RewardScreen';
import type { RootStackParamList } from './src/navigation';
import { colors, fonts } from './src/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

function loadWebFonts() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  const id = 'tennis-manager-fonts';
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href =
    'https://fonts.googleapis.com/css2?family=Archivo+Black&family=Source+Sans+3:wght@400;600;700&display=swap';
  document.head.appendChild(link);

  const style = document.createElement('style');
  style.textContent = `
    body, #root { font-family: 'Source Sans 3', system-ui, sans-serif; }
  `;
  document.head.appendChild(style);
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);

  useEffect(() => {
    loadWebFonts();
    AsyncStorage.getItem('playerId').then((id) => {
      setPlayerId(id);
      setReady(true);
    });
  }, []);

  if (!ready) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.mist,
        }}
      >
        <Text
          style={{
            fontFamily: fonts.display,
            color: colors.brand,
            fontSize: 22,
            marginBottom: 12,
            letterSpacing: 1,
          }}
        >
          TENNIS MANAGER
        </Text>
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator
        initialRouteName={playerId ? 'Hub' : 'Create'}
        screenOptions={{
          headerStyle: { backgroundColor: colors.brand },
          headerTintColor: colors.chalk,
          headerTitleStyle: {
            fontFamily: fonts.display,
            fontWeight: '400',
            fontSize: 16,
          },
          contentStyle: { backgroundColor: colors.mist },
          animation: 'fade',
        }}
      >
        <Stack.Screen
          name="Create"
          component={CreateScreen}
          options={{ title: 'Nouveau joueur', headerShown: false }}
        />
        <Stack.Screen
          name="Hub"
          component={HubScreen}
          initialParams={playerId ? { playerId } : undefined}
          options={{ title: 'Hub carrière' }}
        />
        <Stack.Screen
          name="Scene"
          component={SceneScreen}
          options={{ title: 'Histoire' }}
        />
        <Stack.Screen
          name="Training"
          component={TrainingScreen}
          options={{ title: 'Entraînement' }}
        />
        <Stack.Screen
          name="Match"
          component={MatchScreen}
          options={{ title: 'Match' }}
        />
        <Stack.Screen
          name="Reward"
          component={RewardScreen}
          options={{ title: 'Récompense' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
