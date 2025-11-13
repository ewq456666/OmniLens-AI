import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

interface TagListProps {
  tags: (string | null | undefined)[];
}

export const TagList: React.FC<TagListProps> = ({ tags }) => {
  const cleaned = tags.filter((tag): tag is string => Boolean(tag));
  if (cleaned.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {cleaned.map((tag) => (
        <View key={tag} style={styles.tag}>
          <Text style={styles.text}>{tag}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
});
