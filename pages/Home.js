import { StyleSheet, Text, View, Button} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AudioPlayer, useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio'
import { Directory,  File, Paths } from 'expo-file-system'; 
import { useState, useEffect, useRef } from 'react';

import { getAudioMetadata } from '@missingcore/audio-metadata';
import { ImageBackground, Image } from 'expo-image';
import { registerForPushNotificationsAsync } from './Helpers/Notifications'
import { BlurView, BlurTargetView } from 'expo-blur';
import Header from './Components/Header';

import { AudioProvider, useAudio } from './Components/AudioContext';


export default function App({navigation}) {

    const [pic, setPic] = useState("");
    
    const { player, status } = useAudio();

    console.log(navigation)
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

    var base64Icon = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAwBQTFRF7c5J78kt+/Xm78lQ6stH5LI36bQh6rcf7sQp671G89ZZ8c9V8c5U9+u27MhJ/Pjv9txf8uCx57c937Ay5L1n58Nb67si8tVZ5sA68tJX/Pfr7dF58tBG9d5e8+Gc6chN6LM+7spN1pos6rYs6L8+47hE7cNG6bQc9uFj7sMn4rc17cMx3atG8duj+O7B686H7cAl7cEm7sRM26cq/vz5/v767NFY7tJM78Yq8s8y3agt9dte6sVD/vz15bY59Nlb8txY9+y86LpA5LxL67pE7L5H05Ai2Z4m58Vz89RI7dKr+/XY8Ms68dx/6sZE7sRCzIEN0YwZ67wi6rk27L4k9NZB4rAz7L0j5rM66bMb682a5sJG6LEm3asy3q0w3q026sqC8cxJ6bYd685U5a457cIn7MBJ8tZW7c1I7c5K7cQ18Msu/v3678tQ3aMq7tNe6chu6rgg79VN8tNH8c0w57Q83akq7dBb9Nld9d5g6cdC8dyb675F/v327NB6////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/LvB3QAAAMFJREFUeNpiqIcAbz0ogwFKm7GgCjgyZMihCLCkc0nkIAnIMVRw2UhDBGp5fcurGOyLfbhVtJwLdJkY8oscZCsFPBk5spiNaoTC4hnqk801Qi2zLQyD2NlcWWP5GepN5TOtSxg1QwrV01itpECG2kaLy3AYiCWxcRozQWyp9pNMDWePDI4QgVpbx5eo7a+mHFOqAxUQVeRhdrLjdFFQggqo5tqVeSS456UEQgWE4/RBboxyC4AKCEI9Wu9lUl8PEGAAV7NY4hyx8voAAAAASUVORK5CYII=';

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
            intensity={pic != "" ? 100 : 0}
            tint='dark'
            style={{
                position: 'absolute',
                opacity: 0.9,
                width: '100%',
                height: '100%',
                top: 0,
            }}
        />

        <Header name={"Home"} onSettingsPress={() => navigation.navigate("Settings")} />
        <StatusBar style="dark"/>

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
