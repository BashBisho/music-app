import { StyleSheet, Text, View, Button, TouchableOpacity, Dimensions, FlatList} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect, useRef } from 'react';

import { BlurView, BlurTargetView } from 'expo-blur';

import { useAudio } from './Components/AudioContext';
import getImage from '../assets/defaultImage';
import Player from './Components/Player';
import HeaderModern from './Components/HeaderModern';
import { Image } from 'expo-image'
import Track from './Components/Track';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

export default function AlbumShowcase({navigation, route}) {

    const { album } = route.params;
    album.songs.sort((a, b) => a.track - b.track);

    const { player, songs, playSong, currentSong, togglePlay, currentArtwork, setAndPlay} = useAudio();

    const blurTargetRef = useRef(null);
    const blurButtonRef = useRef(null);

    const play = (album?.cover ?? getImage());
    const {width} = Dimensions.get('screen');

    const imgW = width*0.9*0.5;

    console.log({
        AlbumShowcase,
        Image,
        View,
        Text,
        TouchableOpacity,
    });

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

            <HeaderModern name={album.name} left={{name: "chevron-left", backgroundColor: "#DDDDDD00", active: 1, color: "#FFF", onPress: () => navigation.goBack()}} right={{name: "gear", backgroundColor: "#DDD", active: 0, color: "#222", onPress: () => navigation.navigate("Settings")}} />
            <StatusBar style="light"/>

            <View style={{display: "flex", flexDirection: "row", justifyContent: "flex-start", alignItems: "flex-start", width: "90%", gap: 15, marginBottom: 20}} >
                <Image style={{width: imgW, height: imgW, borderRadius: 10}} source={{uri: play}} />
                <View style={{display: "flex", flexDirection: "column", justifyContent: "flex-start", alignItems: "flex-start", width: imgW - 15}}>
                    <Text style={{fontFamily: "SF-Bold", fontSize: 12, color: "#AAA", textAlign: "left", marginBottom: 10}}>{`Album | ${album.songs.length} songs | ${album.songs[0].year}`}</Text>
                    <Text style={{fontFamily: "SF-Bold", fontSize: 24, color: "#FFF", textAlign: "left"}}>{album.name}</Text>
                    <Text style={{fontFamily: "SF-Medium", fontSize: 18, color: "#ddd", textAlign: "left"}}>{album.artist}</Text>
                </View>

            </View>

            <View style={{width: "90%", display: "flex", flexDirection: "row", gap: 10, marginBottom: 20}}>
                
                <TouchableOpacity style={{backgroundColor: '#FFFFFF11', height: 50, flex: 1, borderRadius: 5, overflow: 'hidden', justifyContent: "center", alignItems: "center", flexDirection: "row", gap: 15}}>
                    <Text style={{fontSize: 20, color: "#FFF", fontFamily: "SF-Bold"}}>SHUFFLE</Text>
                    <FontAwesome6 name={"shuffle"} size={16} color={"#fff"} style={{marginTop: 2}} iconStyle='solid' />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setAndPlay(album.songs, 0)} style={{backgroundColor: '#FFFFFF43', height: 50, flex: 1, borderRadius: 5, overflow: 'hidden', justifyContent: "center", alignItems: "center", flexDirection: "row", gap: 15}}>
                    <Text style={{fontSize: 20, color: "#FFF", fontFamily: "SF-Bold"}}>PLAY</Text>
                    <FontAwesome6 name={"play"} size={16} color={"#fff"}  iconStyle='solid' />
                </TouchableOpacity>
            </View>

            <View style={{width: "90%", height: 5, backgroundColor: "#AAAAAA44", borderRadius: 1, marginBottom: 20}} />

            <FlatList
                data={album.songs}
                style={{width: "90%"}}
                ItemSeparatorComponent={() => <View style={{height: 14}} />}
                renderItem={({item, index}) => {
                    return (
                        <View style={{display: "flex" ,justifyContent: "flex-start", alignItems: "center", flexDirection: "row"}}>
                            <Track song={item} showImage={false} index={index} onPress={() => setAndPlay(album.songs, index)}/>
                        </View>
                    )
                }}
            /> 
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
