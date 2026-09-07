import { StyleSheet, Text, View, Button} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AudioPlayer, useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio'
import { Directory,  File, Paths } from 'expo-file-system'; 
import { useState, useEffect, useRef } from 'react';

import { getAudioMetadata } from '@missingcore/audio-metadata';
import { ImageBackground, Image } from 'expo-image';
import { registerForPushNotificationsAsync } from './Helpers/Notifications'
import { BlurView, BlurTargetView } from 'expo-blur';
import { useAudio } from './Components/AudioContext';
export default function App() {

    const [pic, setPic] = useState("");
    const { player, status } = useAudio();

    const blurTargetRef = useRef(null);

    async function prepareNotificationArtwork(dataUri) {
        const base64 = dataUri.split(',')[1];

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
    
    useEffect(() => {
            
    
        async function setupAudio() {
            await registerForPushNotificationsAsync();
            await setAudioModeAsync({
                playsInSilentMode: true,
                shouldPlayInBackground: true,
                shouldRouteThroughEarpiece: true
            });
        }

        setupAudio();
    }, []);

    const pickFolder = async () => {
        const result = await Directory.pickDirectoryAsync();

        const files = result.list();

        const randomIndex = Math.floor(Math.random() * files.length);
        const item = files[randomIndex];

       // console.log(item);
        console.log("EXT:", item.extension);

        const metadata = await getAudioMetadata(
            item.uri,
            ['album', 'albumArtist', 'artist', 'artwork', 'name', 'track', 'year']
        );

        
   
        setPic(metadata.metadata.artwork);
        player.replace(item.uri);

        const { album, albumArtist, artist, artwork, name, track, year } = metadata.metadata;

        console.log(album, artist, name);

        const art = await prepareNotificationArtwork(artwork);
        await player.setActiveForLockScreen(true, {
            title: name,
            artist: artist,
            albumTitle: album,
            artworkUrl: art,
        }, {
            showSeekBackward: true,
            showSeekForward: true,
        });
        
        player.play();

        console.log(status.duration);

    };

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
                source={{ uri: pic }}
                style={{
                    width: '100%',
                    height: '100%',
                }}
            />
        </BlurTargetView>

        <BlurView
            blurTarget={blurTargetRef}
            blurMethod="dimezisBlurViewSdk31Plus"
            intensity={pic != "" ? 70 : 0}
            tint='dark'
            style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                top: 0,
            }}
        />


        <StatusBar style="dark"/>

        <Text>Open up App.js to start working on your app!</Text>
        <Button
            title="Choose Folder"
            onPress={pickFolder}
        />
        {pic != "" && <Text>Found</Text> 
        }

        
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
