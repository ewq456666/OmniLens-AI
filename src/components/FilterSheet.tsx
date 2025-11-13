import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Pressable,
  Platform,
} from 'react-native';
import { Collection } from '../types';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

interface FilterSheetProps {
  filters: { tags: string[]; category?: string; collectionId?: string | null };
  onChange: (filters: { tags: string[]; category?: string; collectionId?: string | null }) => void;
  collections: Collection[];
}

export const FilterSheet: React.FC<FilterSheetProps> = ({ filters, onChange, collections }) => {
  const [visible, setVisible] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const toggleTag = () => {
    const trimmed = tagInput.trim();
    if (!trimmed) {
      return;
    }
    if (filters.tags.includes(trimmed)) {
      return;
    }
    onChange({ ...filters, tags: [...filters.tags, trimmed] });
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    onChange({ ...filters, tags: filters.tags.filter((t) => t !== tag) });
  };

  const clearFilters = () => {
    onChange({ tags: [], category: undefined, collectionId: undefined });
  };

  return (
    <>
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setVisible(true)}
        accessibilityRole="button"
        accessibilityLabel="Open filters"
      >
        <Text style={styles.triggerText}>Filters</Text>
      </TouchableOpacity>
      <Modal visible={visible} animationType="slide" transparent onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.backdrop} onPress={() => setVisible(false)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={typography.subtitle}>Filters</Text>
            <TouchableOpacity onPress={clearFilters}>
              <Text style={styles.clear}>Clear</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.section}>
            <Text style={typography.body}>Category</Text>
            <TextInput
              placeholder="Category"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
              value={filters.category ?? ''}
              onChangeText={(text) => onChange({ ...filters, category: text || undefined })}
            />
          </View>
          <View style={styles.section}>
            <Text style={typography.body}>Tags</Text>
            <View style={styles.tagInputRow}>
              <TextInput
                placeholder="Add tag"
                placeholderTextColor={colors.textSecondary}
                style={[styles.input, styles.tagInput]}
                value={tagInput}
                onChangeText={setTagInput}
                onSubmitEditing={toggleTag}
              />
              <TouchableOpacity style={styles.addButton} onPress={toggleTag}>
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.tagsContainer}>
              {filters.tags.map((tag) => (
                <TouchableOpacity key={tag} style={styles.tagChip} onPress={() => removeTag(tag)}>
                  <Text style={styles.tagText}>{tag} ✕</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.section}>
            <Text style={typography.body}>Collection</Text>
            <View style={styles.collectionList}>
              <TouchableOpacity
                style={[
                  styles.collectionItem,
                  filters.collectionId == null && styles.collectionSelected,
                ]}
                onPress={() => onChange({ ...filters, collectionId: undefined })}
              >
                <Text style={styles.collectionText}>All collections</Text>
              </TouchableOpacity>
              {collections.map((collection) => (
                <TouchableOpacity
                  key={collection.id}
                  style={[
                    styles.collectionItem,
                    filters.collectionId === collection.id && styles.collectionSelected,
                  ]}
                  onPress={() => onChange({ ...filters, collectionId: collection.id })}
                >
                  <Text style={styles.collectionText}>{collection.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={() => setVisible(false)}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  trigger: {
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  triggerText: {
    color: colors.textPrimary,
    fontFamily: 'Inter_500Medium',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.25)',
  },
  sheet: {
    backgroundColor: colors.card,
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    gap: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -2 },
    elevation: Platform.OS === 'android' ? 8 : 0,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clear: {
    color: colors.danger,
    fontFamily: 'Inter_500Medium',
  },
  section: {
    gap: 8,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    fontFamily: 'Inter_400Regular',
    color: colors.textPrimary,
  },
  tagInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tagInput: {
    flex: 1,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Inter_500Medium',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tagText: {
    color: '#FFFFFF',
    fontFamily: 'Inter_500Medium',
  },
  collectionList: {
    gap: 8,
  },
  collectionItem: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  collectionSelected: {
    borderColor: colors.primary,
    backgroundColor: '#E0EDFF',
  },
  collectionText: {
    color: colors.textPrimary,
    fontFamily: 'Inter_500Medium',
  },
  closeButton: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
  },
});
