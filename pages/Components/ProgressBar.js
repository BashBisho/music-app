import React, { useRef, useState } from 'react';
import { View, StyleSheet, PanResponder } from 'react-native';

export const ScrubProgressBar = ({
  currentPosition, // in seconds or ms
  totalDuration,   // in seconds or ms
  onSeek,          // (time) => void
}) => {
  const barRef = useRef(null);
  const boundsRef = useRef({ pageX: 0, width: 0 });

  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubPosition, setScrubPosition] = useState(0);

  // Keep latest totalDuration accessible inside PanResponder callbacks
  const durationRef = useRef(totalDuration);
  durationRef.current = totalDuration;

  const updateScrubFromGesture = (gestureState) => {
    const { pageX, width } = boundsRef.current;
    if (width <= 0 || durationRef.current <= 0) return 0;

    // Calculate touch offset relative to the bar's screen coordinates
    const touchX = gestureState.moveX - pageX;
    const progress = Math.max(0, Math.min(touchX / width, 1));
    const targetTime = progress * durationRef.current;

    setScrubPosition(targetTime);
    return targetTime;
  };

  const measureBar = () => {
    if (barRef.current) {
      barRef.current.measure((x, y, width, height, pageX) => {
        boundsRef.current = { pageX, width };
      });
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (evt, gestureState) => {
        setIsScrubbing(true);
        // Fallback to pageX on grant if moveX is 0 initially
        const grantGesture = {
          ...gestureState,
          moveX: gestureState.x0 || evt.nativeEvent.pageX,
        };
        updateScrubFromGesture(grantGesture);
      },

      onPanResponderMove: (evt, gestureState) => {
        updateScrubFromGesture(gestureState);
      },

      onPanResponderRelease: (evt, gestureState) => {
        const finalTime = updateScrubFromGesture(gestureState);
        setIsScrubbing(false);
        if (onSeek) onSeek(finalTime);
      },

      onPanResponderTerminate: () => {
        setIsScrubbing(false);
      },
    })
  ).current;

  // Use the scrub value while dragging; otherwise use current audio playback
  const displayPosition = isScrubbing ? scrubPosition : currentPosition;
  const progressRatio = totalDuration > 0
    ? Math.max(0, Math.min(displayPosition / totalDuration, 1))
    : 0;

  return (
    <View style={{position: "relative", width: "80%"}}>
        <View style={{width: `${progressRatio*100}%`, height: 5, backgroundColor: "#fff", borderRadius: 1.5, position: "absolute"}}></View>
        <TouchableOpacity onPress={(event) => console.log(event)}  style={{width: `100%`, height: 5, backgroundColor: "#ffffff55", borderRadius: 1.5, marginBottom: 5}}></TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  hitArea: {
    height: 48, // Generous hit box to prevent losing touches
    justifyContent: 'center',
    width: '100%',
    position: 'relative',
  },
  track: {
    height: 4,
    backgroundColor: '#3e3e3e',
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#1DB954',
  },
  thumb: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
    marginLeft: -6, // Center thumb over progress boundary
  },
  thumbActive: {
    transform: [{ scale: 1.4 }],
  },
});