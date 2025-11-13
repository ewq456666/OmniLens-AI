import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { OmniItem } from '../types';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { TagList } from './TagList';

interface ItemCardProps {
  item: OmniItem;
  onPress: () => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <ImageBackground source={{ uri: item.imageUri }} style={styles.thumbnail} imageStyle={styles.thumbnailImage}>
        {item.status !== 'ready' && (
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
        )}
      </ImageBackground>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title || 'Untitled capture'}
        </Text>
        <Text style={styles.subtitle} numberOfLines={2}>
          {item.notes || item.ocrText || 'No notes yet. Tap to add details.'}
        </Text>
        <TagList tags={[item.category, ...item.tags]} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  thumbnail: {
    width: 96,
    height: 96,
    backgroundColor: colors.border,
  },
  thumbnailImage: {
    resizeMode: 'cover',
  },
  statusBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
    position: 'absolute',
    top: 8,
    left: 8,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
  },
  content: {
    flex: 1,
    padding: 12,
    gap: 6,
  },
  title: {
    ...typography.subtitle,
    marginBottom: 2,
  },
  subtitle: {
    ...typography.body,
  },
});
