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

export async function cacheSongs() {

    const songs = await getAllSongs();

    await AsyncStorage.setItem("@songs", JSON.stringify(songs));

    return songs;
}

export async function getCachedSongs() {
    const songs = await AsyncStorage.getItem("@songs");
    
    return (JSON.parse(songs) ? JSON.parse(songs) : []);
}

