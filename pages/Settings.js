import { StyleSheet, Text, View, Button, TouchableOpacity, FlatList} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AudioPlayer, useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio'
import { Directory,  File, Paths } from 'expo-file-system'; 
import { useState, useEffect, useRef } from 'react';

import { getAudioMetadata } from '@missingcore/audio-metadata';
import { ImageBackground, Image } from 'expo-image';
import { registerForPushNotificationsAsync } from './Helpers/Notifications'
import { BlurView, BlurTargetView } from 'expo-blur';
import { useAudio } from './Components/AudioContext';
import {addPath, getPaths, removePath} from './Helpers/AsyncManager'
import Feather from '@react-native-vector-icons/feather';
import Header from './Components/Header';
import { clearMusicCache } from './Helpers/SongManager';

export default function App() {

    const { player, status, getSongs } = useAudio();
    const [ paths, setPths ] = useState([]);
    
    const blurTargetRef = useRef(null);

    
    const pickFolder = async () => {
        const result = await Directory.pickDirectoryAsync();

        if(!result.exists) return;

        const files = result.list();

        const randomIndex = Math.floor(Math.random() * files.length);
        const item = files[randomIndex];

        await addPath(result.uri);

       // console.log(item);
        console.log("EXT:", item.extension);

        const metadata = await getAudioMetadata(
            item.uri,
            ['album', 'albumArtist', 'artist', 'artwork', 'name', 'track', 'year']
        );

        player.replace(item.uri);

        const { album, albumArtist, artist, artwork, name, track, year } = metadata.metadata;

        
        console.log(status.duration);

    };

    async function getAllPaths() {
        const pths = await getPaths();
        console.log("GETTING");
        setPths(pths);
        getSongs();
        console.log(pths);
    }

    useEffect(() => {
       
        getAllPaths();
    }, [])

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
                source={{ uri: "" }}
                style={{
                    width: '100%',
                    height: '100%',
                }}
            />
        </BlurTargetView>

        <BlurView
            blurTarget={blurTargetRef}
            blurMethod="dimezisBlurViewSdk31Plus"
            intensity={7}
            tint='dark'
            style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                top: 0,
            }}
        />
        <StatusBar style="dark"/>


        <Header name={"Settings"} right={{name: "slash", backgroundColor: "#CC2936", color: "#FFF", onPress: () => clearMusicCache()}} />

        <FlatList
            data={paths}
            ItemSeparatorComponent={() => <View style={{height: 10}}/>}
            style={{width: "90%"}}
            contentContainerStyle={{ }}
            renderItem={({item, index}) => {
                return (
                    <View style={{width: "100%", height: 40, display: "flex", flexDirection: "row", gap: 10}}>
                        <View style={{flex: 10, backgroundColor: "#DDD", borderRadius: 5, display: "flex", justifyContent: "center", alignItems: "center"}}>
                            <Text style={{color: "#222", fontSize: 22}}>{(new Directory(item)).name}</Text>
                        </View>
                        <TouchableOpacity onPress={async () => { await removePath(index); await getAllPaths(); }} style={{width: 40, height: 40, borderRadius: 5, backgroundColor: "#CC2936", display: "flex", justifyContent: "center", alignItems: "center"}}> 
                            <Feather name="minus" color={"#FFF"} size={20} />
                        </TouchableOpacity>
                    </View>
                )   
            }}
            ListFooterComponent={() => {
                return (
                    <>
                        <View style={{height: 10}}/>
                          <TouchableOpacity onPress={async() => { await pickFolder(); await getAllPaths();} } activeOpacity={.9}  style={{width: "100%", height: 40, backgroundColor: "#4E937A", borderRadius: 5, display: "flex", gap: 5, justifyContent: "center", alignItems: "center", flexDirection: "row"}}> 
                            <Feather name="plus" size={22} color={"#fff"}/>
                            <Text style={{fontSize: 16, color: "#FFF", marginBottom: 1}}>Add Path</Text>
                        </TouchableOpacity>
                    </>
                  
                )
            }}
        />
    

        
        <Button
            title="Choose Folder"
            onPress={pickFolder}
        />
        
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "red",
    alignItems: 'center',
    justifyContent: 'center',
  },
});
