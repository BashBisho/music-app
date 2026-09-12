import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { File, Directory, Paths } from 'expo-file-system';
import { useEffect } from 'react';
import Home from './pages/Home';
import Settings from './pages/Settings';
import MusicPlayer from './pages/MusicPlayer'
import { AudioProvider } from './pages/Components/AudioContext';
import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen';

import Header from './pages/Components/Header'

import {
  createStaticNavigation,
  useNavigation,
  NavigationContainer
} from '@react-navigation/native';

import {
  createStackNavigator,
  createStackScreen,
} from '@react-navigation/stack';

const Stack = createStackNavigator();

export default function App() {


  const [loaded, error] = useFonts({
    'SF-Reg': require("./assets/fonts/SFREG.OTF"),
    'SF-Medium': require('./assets/fonts/SFPRODISPLAYMEDIUM.OTF'),
    'SF-Bold': require('./assets/fonts/SFPRODISPLAYBOLD.OTF'),
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);


  return (
  <AudioProvider>
    <NavigationContainer>
      {/* Place the StatusBar here to apply globally */}
      <StatusBar style="auto"/>
      
      <Stack.Navigator
          screenOptions={{header: () => null}}
          >
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="Settings" component={Settings} />
        <Stack.Screen name="MusicPlayer" component={MusicPlayer} />
      </Stack.Navigator>
    </NavigationContainer>
  </AudioProvider>
  )
}

