import { StyleSheet, Text, View, Button, TouchableOpacity, Dimensions} from 'react-native';
import { useEffect, useState } from 'react';

import MusicPlayerVertical from './MusicPlayerVertical'
import MusicPlayerHorizontal from './MusicPlayerHorizontal'
import { getType } from './Helpers/AsyncManager';

export default function ({navigation}) {
    const [sender, setSender] = useState(false);
    
    useEffect(() => {
        async function gt() {
            const type = await getType();
            console.log("isss ", type)
            setSender(type);
        }

        gt();
    }, [])

    return sender ? <MusicPlayerHorizontal navigation={navigation}/> : <MusicPlayerVertical navigation={navigation}/>
}