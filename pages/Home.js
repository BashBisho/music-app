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
import { FlatList, TextInput } from 'react-native-gesture-handler';
import Track from './Components/Track';
import Player from './Components/Player';
import { setType } from './Helpers/AsyncManager';
import Album from './Components/Album'
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

export default function App({navigation}) {

    const [pic, setPic] = useState("");
    
    const { player, allSongs, playSong, currentSong, togglePlay, currentArtwork, setAndPlay, loading} = useAudio();
    const songs = allSongs;

    const [filter, setFilter] = useState(0);
    const [search, setSearch] = useState("");

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
    console.log("AAAA ", allSongs.length)
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
    });

    console.log("FILTER ", filter); 
    songs.sort((a, b) => {
        if (a.name.toLowerCase() < b.name.toLowerCase())
            return -1;
        if (a.name.toLowerCase() > b.name.toLowerCase())
            return 1;
        return 0;
    });

    // console.log("Play ", currentArtwork , "bruh " )
    const shown = search == "" ? songs : songs.filter(a => a.name.toLowerCase().includes(search.toLowerCase()));

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

            <Header name={(loading ? "Loading... " : "Home")} right={{name: "gear", iconSize: 20, backgroundColor: "#22222200", color: "#FFF", onPress: () => navigation.navigate("Settings")}} />
            <StatusBar style="light"/>
            <View style={{height: 60, width: '90%', display: "flex", justifyContent: "flex-start", alignItems: "center", flexDirection: "row", gap: 15}}>
                {config.map((curr, index) => {
                    return (
                    <TouchableOpacity key={index} onPress={() => setFilter(index)} style={{display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: (index == filter ? "#FFFFFF11" : "#FFFFFF44" ), paddingVertical: 6, paddingHorizontal: 16, borderRadius: 5}}>
                        <Text style={{fontSize: 18, fontFamily: "SF-Bold", color: "#FFF"}}>{curr}</Text>
                    </TouchableOpacity>
                    )
                })
              
                }  
            </View>
             { filter == 0 &&
                <>
                    <View style={{width: "90%"}}>
                        <TextInput clearTextOnFocus onChangeText={(text) => setSearch(text)} textAlignVertical='center' placeholder='Search'  style={{width: "100%", paddingBottom: 8, paddingLeft: 40, height: 40,justifyContent: "center", alignItems: "center", borderColor: "#FFFfff00", fontSize: 20, fontFamily: "SF-Medium", borderWidth: 2, borderRadius: 3, backgroundColor: "#FFFFFF44", marginBottom: 10}} />
                        <FontAwesome6 name='magnifying-glass' size={18} color="#Fff" iconStyle='solid' style={{position: "absolute", top: 10, left: 12}}/>
                    </View> 
                    <FlatList
                        data={shown}
                        style={{width: "90%"}}
                        ItemSeparatorComponent={() => <View style={{height: 14}} />}
                        renderItem={({item, index}) => {
                            return (
                                <Track song={item} index={index} onPress={() => setAndPlay(shown, index)}/>
                            )
                        }}
                    /> 
                </>
            }
            { filter == 1 && 
                <FlatList
                    data={Object.values(albums).filter((album) => album.songs.length > 1)}
                    style={{width: "92%"}}
                    ItemSeparatorComponent={() => <View style={{height: 14}} />}
                    renderItem={({item, index}) => {
                        console.log(item);
                        return (
                            <Album onPress={() => navigation.navigate("AlbumShowcase", {album: item})} album={item} num={2}/>
                        )
                    }}
                    numColumns={2}
                    columnWrapperStyle={{
                        justifyContent: 'space-between',
                    }}
                />            
            }

            <View style={{height: 100}}></View>
            <Player navigation={navigation} />

        </View>
    );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
});
