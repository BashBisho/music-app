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
import { setType } from './Helpers/AsyncManager';
import Album from './Components/Album'

export default function App({navigation}) {

    const [pic, setPic] = useState("");
    
    const { player, songs, playSong, currentSong, togglePlay, currentArtwork} = useAudio();
    const [filter, setFilter] = useState(0);

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
    const config = ["All", "Albums", "Artists"];

    const albums = {}
    songs.forEach(song => {
        //console.log(albums)
        if(song.album && albums[song.album]) albums[song.album].songs.push(song);
        else {
            albums[song.album] = {
                songs: new Array(),
                cover: song.artwork,
                name: song.album,
                artist: song.artist
            }
            
            albums[song.album].songs.push(song);

        }
    })
    console.log("FILTER ", filter);
    console.log(albums.HALO)
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
            <View style={{height: 60, width: '90%', display: "flex", justifyContent: "flex-start", alignItems: "center", flexDirection: "row", gap: 15}}>
                {config.map((curr, index) => {
                    return (
                    <TouchableOpacity key={index} onPress={() => setFilter(index)} style={{display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: (index == filter ? "#222" : "#777" ), paddingVertical: 6, paddingHorizontal: 17, borderRadius: 5}}>
                        <Text style={{fontSize: 18, fontFamily: "SF-Medium", color: "#FFF"}}>{curr}</Text>
                    </TouchableOpacity>
                    )
                })
              
                }   
            </View>
             { filter == 0 &&
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
            }
            { filter == 1 && 
                <FlatList
                    data={Object.values(albums).filter((album) => album.songs.length > 1)}
                    style={{width: "92%"}}
                    ItemSeparatorComponent={() => <View style={{height: 14}} />}
                    ListFooterComponent={() => <View style={{height:120}}/>}
                    renderItem={({item, index}) => {
                        console.log(item);
                        return (
                            <Album album={item} />
                        )
                    }}
                    numColumns={2}
                    columnWrapperStyle={{
                        justifyContent: 'space-between',
                    }}
                />            
            }


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
