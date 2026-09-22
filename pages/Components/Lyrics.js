import React, { useEffect, useRef } from 'react';

import { FlatList, StyleSheet } from 'react-native';

import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';

function getLines(lyrics) {
  const body = lyrics?.Body;

  if (!body)
    return [];

  if (body.Type === 'Static') {
    return (body.Lines || []).map(line => ({
      text: line.Text || '',
      start: null,
      end: null
    }));
  }

  if (body.Type === 'Line') {
    return (body.Content || []).map(line => ({
      text: line.Text || '',
      start: line.StartTime ?? body.StartTime ?? 0,
      end: line.EndTime ?? body.EndTime ?? 0
    }));
  }

  if (body.Type === 'Syllable') {
    return (body.Content || []).map(line => {
      const syllables = line.Lead?.Syllables || [];

      return {
        text: syllables.reduce((text, syllable, index) => {
          if (index === 0)
            return syllable.Text || '';

          const previous = syllables[index - 1];

          return text +
            (previous.IsPartOfWord ? '' : ' ') +
            (syllable.Text || '');
        }, ''),
        start: syllables[0]?.StartTime ?? 0,
        end: syllables[syllables.length - 1]?.EndTime ?? 0
      };
    });
  }

  return [];
}

function Line({ item, position, synced }) {
  const progress = useSharedValue(0);

  const active = synced &&
    position >= item.start &&
    position <= item.end;

    console.log(position, item.start, item.end);

  useEffect(() => {
    progress.value = withTiming(active ? 1 : 0, {
      duration: 200
    });
  }, [active]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + progress.value * 0.65
  }));

  return (
    <Animated.Text style={[styles.line, animatedStyle]}>
      {item.text}
    </Animated.Text>
  );
}

export default function SyllableLyrics({ lyrics, status, style }) {
  const listRef = useRef(null);
  const body = lyrics?.Body;
  const lines = getLines(lyrics);
  const position = status?.currentTime ?? 0;
  const synced = body?.Type === 'Line' || body?.Type === 'Syllable';

  useEffect(() => {
    if (!synced)
      return;

    const index = lines.findIndex(line =>
      position >= line.start &&
      position <= line.end
    );

    if (index >= 0) {
      listRef.current?.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0.5
      });
    }
  }, [position, synced]);

  return (
    <FlatList
      ref={listRef}
      data={lines}
      keyExtractor={(_, index) => String(index)}
      renderItem={({ item }) => (
        <Line
          item={item}
          position={position}
          synced={synced}
        />
      )}
      style={{...style, backgroundColor: "#FFFFFF11"}}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
      onScrollToIndexFailed={info => {
        listRef.current?.scrollToOffset({
          offset: info.averageItemLength * info.index,
          animated: true
        });
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10
  },
  line: {
    fontSize: 26,
    fontWeight: '700',
    fontFamily: "SF-Medium",
    color: "#FFF",
    marginVertical: 12,
    paddingHorizontal: 24
  }
});

