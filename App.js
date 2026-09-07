import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { File, Directory, Paths } from 'expo-file-system';

import Home from './pages/Home';
import Settings from './pages/Settings';
import { AudioProvider } from './pages/Components/AudioContext';

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
        </Stack.Navigator>
      </NavigationContainer>
    </AudioProvider>
   )
}

