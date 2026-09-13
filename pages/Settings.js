import { StyleSheet, Text, View, Button, TouchableOpacity, FlatList} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Directory,  File, Paths } from 'expo-file-system'; 
import { useState, useEffect, useRef } from 'react';

import { getAudioMetadata } from '@missingcore/audio-metadata';
import { ImageBackground, Image } from 'expo-image';
import { registerForPushNotificationsAsync } from './Helpers/Notifications'
import { BlurView, BlurTargetView } from 'expo-blur';
import { useAudio } from './Components/AudioContext';
import {addPath, getPaths, getType, setType, removePath} from './Helpers/AsyncManager'
import Feather from '@react-native-vector-icons/feather';
import Header from './Components/Header';
import { clearMusicCache } from './Helpers/SongManager';
import getImage from '../assets/defaultImage';
import Player from './Components/Player';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

export default function Settings({navigation}) {

    const { player, status, getSongs, currentSong, currentArtwork } = useAudio();
    const [ paths, setPths ] = useState([]);
    const [sender, setSender] = useState(true);

    const blurTargetRef = useRef(null);

    
    const pickFolder = async () => {
        const result = await Directory.pickDirectoryAsync();

        if(!result.exists) return;

        await addPath(result.uri);
    };

    async function getAllPaths() {
        const pths = await getPaths();
        console.log("GETTING");
        setPths(pths);
        getSongs();
        console.log(pths);
    }

    useEffect(() => {
        async function GT() {
            const type = await getType();
            console.log("tYPOEEEE ", type)
            setSender(type);
        }

        GT();
        getAllPaths();
    }, [])

    async function toggle() {
        console.log("CURR ", sender)
        await setType((sender ? false : true));
        setSender(t => !t);
    }

    const play = (currentArtwork ?? getImage());
    const colors = ["#DB504A", "#43AA8B"];

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
                    width: '100%',
                    height: '100%',
                    top: 0,
                }}
            />
            <StatusBar style="light"/>

            <Header name={"Settings"}  left={{name: "caret-left", backgroundColor: "#DDD", color: "#222", onPress: () => { if(navigation.canGoBack()) navigation.goBack()} }}/>
            
            <View style={{width: "90%", display: "flex", justifyContent: "space-between", alignItems: "center", flexDirection: "row", marginBottom :20  }}>
                <View style={{display: "flex", justifyContent: "center", alignItems: "flex-start", flexDirection: "column"}}>
                    <Text style={{fontFamily: "SF-Bold", fontSize: 20, color: "#FFF"}}>Audio Type</Text>
                    <Text  style={{fontFamily: "SF-Reg", fontSize: 16, color: "#FFF"}}>Whether to send music or receive</Text>
                </View>
                <TouchableOpacity hitSlop={10} activeOpacity={.9} onPress={() => toggle()} style={{width: 60, height: 30, backgroundColor: "#fff", borderRadius: 5, marginTop: 10}}>
                    <View style={{width: 30, height: 30, backgroundColor: (sender ? colors[0] : colors[1]), marginLeft: (sender ? 0 : 31), borderRadius: 5}}>

                    </View>
                    <Text style={{fontFamily: "SF-Bold", fontSize: 20, color: (sender ? colors[0] : colors[1]), position: "absolute", top: 2, left: 10}}>S</Text>
                    <Text style={{fontFamily: "SF-Bold", fontSize: 20, color: (sender ? colors[0] : colors[1]), position: "absolute", top: 2, right: 10}}>R</Text>

                </TouchableOpacity>
            </View>

             <View style={{width: "90%", display: "flex", justifyContent: "space-between", alignItems: "center", flexDirection: "row", marginBottom: 50}}>
                <View style={{display: "flex", justifyContent: "center", alignItems: "flex-start", flexDirection: "column"}}>
                    <Text style={{fontFamily: "SF-Bold", fontSize: 20, color: "#FFF"}}>Clear Cache</Text>
                    <Text  style={{fontFamily: "SF-Reg", fontSize: 16, color: "#FFF"}}>Rebuild all music cache</Text>
                </View>
                <TouchableOpacity activeOpacity={.7} hitSlop={10} onPress={() => clearMusicCache()} style={{width: 30, height: 30, backgroundColor: colors[0], borderRadius: 5, justifyContent: "center", alignItems: "center"}}>
                    <FontAwesome6 name={"trash-can"} size={16} color={"#fff"} iconStyle='solid' />
                </TouchableOpacity>
            </View>

            <View style={{width: "90%"}}>
                <Text style={{fontFamily: "SF-Bold", fontSize: 20, color: "#FFF", alignSelf: "flex-start", width: "90%"}}>Music Folders: </Text>
                <FlatList
                    data={paths}
                    ItemSeparatorComponent={() => <View style={{height: 10}}/>}
                    style={{width: "100%"}}
                    contentContainerStyle={{ }}
                    renderItem={({item, index}) => {
                        return (
                            <View style={{width: "100%", height: 40, display: "flex", flexDirection: "row", gap: 10}}>
                                <View style={{flex: 10, backgroundColor: "#DDD", borderRadius: 5, display: "flex", justifyContent: "center", alignItems: "flex-start"}}>
                                    <Text style={{color: "#555", fontSize: 22, fontFamily: "SF-Bold", paddingLeft: 10, paddingBottom: 2}}>{(new Directory(item)).name}</Text>
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
                                <TouchableOpacity hitSlop={10} onPress={async() => { await pickFolder(); await getAllPaths();} } activeOpacity={.9}  style={{width: "100%", height: 40, backgroundColor: "#4E937A", borderRadius: 5, display: "flex", gap: 5, justifyContent: "center", alignItems: "center", flexDirection: "row"}}> 
                                    <Feather name="plus" size={22} color={"#fff"}/>
                                    <Text style={{fontSize: 18, fontFamily:"SF-Medium", color: "#FFF", marginBottom: 1}}>Add Path</Text>
                                </TouchableOpacity>
                            </>
                        
                        )
                    }}
                />
            </View>
            <Player />
        
        </View>
    );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "red",
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
});
