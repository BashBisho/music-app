import { Directory, File, Paths } from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getPaths } from './AsyncManager';
import { getAudioMetadata } from '@missingcore/audio-metadata';


const STORAGE_KEY = "songs";

const CONCURRENCY = 4;

const musicExtensions = [
    ".mp3",
    ".flac",
    ".m4a",
    ".mp4"
];


// ---------------------------------------------------------
// Save base64 artwork to FileSystem
// ---------------------------------------------------------

async function saveArtwork(artwork, id) {

    if (!artwork)
        return null;

    try {

        /*
         * MissingCore returns something like:
         *
         * data:image/jpeg;base64,/9j/4AAQ...
         *
         * We need to separate the MIME type from the
         * actual base64 data.
         */

        const match = artwork.match(
            /^data:image\/(jpeg|jpg|png);base64,(.*)$/
        );

        if (!match)
            return null;


        const extension =
            match[1] === "png" ? "png" : "jpg";

        const base64Data = match[2];


        // Directory for album artwork
        const artworkDir =
            new Directory(Paths.document, "album-art");


        if (!artworkDir.exists) {
            artworkDir.create();
        }


        const artworkFile =
            new File(
                artworkDir,
                `artwork_${id}.${extension}`
            );

        artworkFile.write(base64Data, {
            encoding: "base64"
        });


        return artworkFile.uri;

    } catch (error) {

        console.log(
            "Artwork save error:",
            error
        );

        return null;
    }
}


// ---------------------------------------------------------
// Process one song
// ---------------------------------------------------------

async function processSong(file, songs) {

    const uri = file.uri;


    // -----------------------------------------------------
    // Already cached?
    // -----------------------------------------------------

    if (songs[uri]) {

        console.log(
            "CACHE:",
            file.name
        );

        return songs[uri];
    }


    // -----------------------------------------------------
    // Extract metadata
    // -----------------------------------------------------

    console.log(
        "READING:",
        file.name
    );


    try {

        const metadata = await getAudioMetadata(
            uri,
            [
                "album",
                "albumArtist",
                "artist",
                "artwork",
                "name",
                "track",
                "year"
            ]
        );


        const data = metadata.metadata;


        const id =
            Math.abs(
                [...uri].reduce(
                    (hash, char) =>
                        ((hash << 5) - hash) + char.charCodeAt(0),
                    0
                )
            );


        const artworkUri =
            await saveArtwork(
                data.artwork,
                id
            );

        const obj = {

            uri,
            name: data.name ?? file.name,
            album: data.album ?? "Unknown",
            artist: data.albumArtist ?? data.artist ?? "Unknown",
            track: data.track ?? 0,
            year: data.year ?? 0,
            artwork: artworkUri
        };

        return obj;

    } catch (error) {

        console.log(
            "Metadata error:",
            file.name,
            error
        );

        return {
            uri,
            name: file.name,
            album: "Unknown",
            artist: "Unknown",
            track: 0,
            year: 0,
            artwork: null
        };
    }
}


export async function getAllSongs() {


    const stored = await AsyncStorage.getItem(STORAGE_KEY);


    const songs =  stored ? JSON.parse(stored) : {};

    const musicFiles = [];
    const paths = await getPaths();


    for (let j = 0; j < paths.length; j++) {

        const path = paths[j];

        console.log(
            "PATH:",
            path
        );

        const dir = new Directory(path);
        const files = dir.list();


        for (let i = 0; i < files.length; i++) {

            const file = files[i];

            const extension = file.extension.toLowerCase();

            if (!musicExtensions.includes(extension)) continue;

            musicFiles.push(file);
        }
    }


    console.log(
        "Found",
        musicFiles.length,
        "songs"
    );

    for (let i = 0; i < musicFiles.length; i += CONCURRENCY) {

        const batch = musicFiles.slice(i,i + CONCURRENCY);


        const results = await Promise.all(batch.map(file => processSong(file, songs)));

        for (const song of results) songs[song.uri] = song;
        
        await AsyncStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(songs)
        );

        console.log(
            `Processed ${Math.min(
                i + CONCURRENCY,
                musicFiles.length
            )}/${musicFiles.length}`
        );
    }

    return Object.values(songs);
}

export async function clearMusicCache() {
    // Delete saved metadata
    await AsyncStorage.removeItem("songs");

    // Delete saved album artwork
    const artworkDir =
        new Directory(Paths.document, "album-art");

    if (artworkDir.exists) {
        artworkDir.delete();
    }

    console.log("Music cache cleared");
}
