import AsyncStorage from '@react-native-async-storage/async-storage'
import { getAllSongs } from './SongManager';
import {Directory, Paths} from 'expo-file-system'
export async function getPaths() {

    const paths = await AsyncStorage.getItem("@paths");
    
    return (JSON.parse(paths) ? JSON.parse(paths) : []);
}


export async function addPath(path) {

    let newPaths = await getPaths();
    console.log("NEW ", newPaths)

    newPaths.push(path);
    newPaths = [...new Set(newPaths)];
    await AsyncStorage.setItem("@paths", JSON.stringify(newPaths));
}

export async function removePath(index) {

    console.log("remove: ", index);
    let newPaths = await getPaths();
    newPaths.splice(index, 1);

    await AsyncStorage.setItem("@paths", JSON.stringify(newPaths));
}

export async function setCurrentSong(index) {
    await AsyncStorage.setItem("@currentSong", index);
}


export async function getCurrentSong() {
    const curr = await AsyncStorage.getItem("@currentSong");
    
    return (curr ? curr : 0);
}

export async function getType() {
    const curr = await AsyncStorage.getItem("@type");
    
    return (curr ? JSON.parse(curr) : 0);
}

export async function setType(t) {
    await AsyncStorage.setItem("@type", JSON.stringify(t));
}

