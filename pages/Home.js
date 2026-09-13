import { StyleSheet, Text, View, Button, TouchableOpacity} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AudioPlayer, useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio'
import { Directory,  File, Paths } from 'expo-file-system'; 
import { useState, useEffect, useRef } from 'react';

import { getAudioMetadata } from '@missingcore/audio-metadata';
import { ImageBackground, Image } from 'expo-image';
import { BlurView, BlurTargetView } from 'expo-blur';
import Header from './Components/Header';

import { AudioProvider, useAudio } from './Components/AudioContext';
import getImage from '../assets/defaultImage';
import { FlatList } from 'react-native-gesture-handler';
import Track from './Components/Track';
import Player from './Components/Player';

export default function App({navigation}) {

    const [pic, setPic] = useState("");
    
    const { player, songs, playSong, currentSong, togglePlay, currentArtwork} = useAudio();

    const blurTargetRef = useRef(null);

    async function prepareNotificationArtwork(dataUri) {

        const base64 = (dataUri ? dataUri.split(',')[1] : getImage());

        const file = new File(Paths.cache, 'notification-artwork.jpg');

        if (file.exists) {
            file.delete();
        }

        file.create();
        file.write(base64, {
            encoding: 'base64',
        });

        return file.uri;
    }
    
    const play = (currentArtwork ?? getImage());
   // console.log("Play ", currentArtwork , "bruh " )
    return (
        <View style={styles.container} >
            <BlurTargetView
                ref={blurTargetRef}
                style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    top: 0,
                }}
            >
                <Image
                    source={{ uri: play }}
                    style={{
                        width: '100%',
                        height: '100%',
                    }}
                />
            </BlurTargetView>

            <BlurView
                blurTarget={blurTargetRef}
                blurMethod="dimezisBlurViewSdk31Plus"
                intensity={100}
                tint='dark'
                style={{
                    position: 'absolute',
                    opacity: 0.9,
                    width: '100%',
                    height: '100%',
                    top: 0,
                }}
            />

            <Header name={"Home"} right={{name: "gear", backgroundColor: "#DDD", color: "#222", onPress: () => navigation.navigate("Settings")}} />
            <StatusBar style="light"/>
            <FlatList
                data={songs}
                style={{width: "92%"}}
                ItemSeparatorComponent={() => <View style={{height: 14}} />}
                renderItem={({item, index}) => {
                    return (
                        <Track song={item} index={index} onPress={() => playSong(index)}/>
                    )
                }}
                ListFooterComponent={() => <View style={{height:120}}/>}
            />

            <Player navigation={navigation} />

        </View>
    );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
