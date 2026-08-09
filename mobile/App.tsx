import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CreateScreen } from './src/screens/CreateScreen';
import { HubScreen } from './src/screens/HubScreen';
import { SceneScreen } from './src/screens/SceneScreen';
import { MatchScreen } from './src/screens/MatchScreen';
import { RewardScreen } from './src/screens/RewardScreen';
import type { RootStackParamList } from './src/navigation';
import { colors } from './src/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [ready, setReady] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);

  useEffect(() => {
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
        <ActivityIndicator color={colors.court} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator
        initialRouteName={playerId ? 'Hub' : 'Create'}
        screenOptions={{
          headerStyle: { backgroundColor: colors.court },
          headerTintColor: colors.line,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: colors.mist },
        }}
      >
        <Stack.Screen
          name="Create"
          component={CreateScreen}
          options={{ title: 'Nouveau joueur' }}
        />
        <Stack.Screen
          name="Hub"
          component={HubScreen}
          initialParams={playerId ? { playerId } : undefined}
          options={{ title: 'Hub' }}
        />
        <Stack.Screen
          name="Scene"
          component={SceneScreen}
          options={{ title: 'Narratif' }}
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
