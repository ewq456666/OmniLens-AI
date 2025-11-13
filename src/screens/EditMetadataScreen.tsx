import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useLibrary } from '../context/LibraryContext';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

export type EditMetadataScreenProps = NativeStackScreenProps<RootStackParamList, 'EditMetadata'>;

export const EditMetadataScreen: React.FC<EditMetadataScreenProps> = ({ route, navigation }) => {
  const { itemId } = route.params;
  const { items, editItem, collections } = useLibrary();
  const item = items.find((it) => it.id === itemId);
  const [title, setTitle] = useState(item?.title ?? '');
  const [notes, setNotes] = useState(item?.notes ?? '');
  const [category, setCategory] = useState(item?.category ?? '');
  const [tagsInput, setTagsInput] = useState(item?.tags.join(', ') ?? '');
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(item?.collectionId ?? null);

  if (!item) {
    return (
      <View style={styles.empty}>
        <Text style={typography.subtitle}>Item not found</Text>
      </View>
    );
  }

  const handleSave = async () => {
    try {
      const tags = tagsInput
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);
      await editItem(item.id, {
        title,
        notes,
        category,
        tags,
        collectionId: selectedCollectionId,
        updatedAt: Date.now(),
      });
      Alert.alert('Saved', 'Item updated successfully.');
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert('Save failed', 'Unable to save changes.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.field}>
        <Text style={typography.subtitle}>Title</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Enter a descriptive title"
          style={styles.input}
        />
      </View>
      <View style={styles.field}>
        <Text style={typography.subtitle}>Notes</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Add notes or annotations"
          style={[styles.input, styles.textArea]}
          multiline
        />
      </View>
      <View style={styles.field}>
        <Text style={typography.subtitle}>Category</Text>
        <TextInput
          value={category}
          onChangeText={setCategory}
          placeholder="Category"
          style={styles.input}
        />
      </View>
      <View style={styles.field}>
        <Text style={typography.subtitle}>Tags</Text>
        <TextInput
          value={tagsInput}
          onChangeText={setTagsInput}
          placeholder="Comma separated tags"
          style={styles.input}
        />
      </View>
      <View style={styles.field}>
        <Text style={typography.subtitle}>Collection</Text>
        <View style={styles.collectionsRow}>
          <TouchableOpacity
            style={[
              styles.collectionChip,
              selectedCollectionId === null && styles.collectionChipSelected,
            ]}
            onPress={() => setSelectedCollectionId(null)}
          >
            <Text
              style={[
                styles.collectionChipText,
                selectedCollectionId === null && styles.collectionChipTextSelected,
              ]}
            >
              Unassigned
            </Text>
          </TouchableOpacity>
          {collections.map((collection) => (
            <TouchableOpacity
              key={collection.id}
              style={[
                styles.collectionChip,
                selectedCollectionId === collection.id && styles.collectionChipSelected,
              ]}
              onPress={() => setSelectedCollectionId(collection.id)}
            >
              <Text
                style={[
                  styles.collectionChipText,
                  selectedCollectionId === collection.id && styles.collectionChipTextSelected,
                ]}
              >
                {collection.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonLabel}>Save changes</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    gap: 24,
    paddingBottom: 80,
  },
  field: {
    gap: 12,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
    fontFamily: 'Inter_400Regular',
    color: colors.textPrimary,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  collectionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  collectionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  collectionChipSelected: {
    borderColor: colors.primary,
    backgroundColor: '#E0EDFF',
  },
  collectionChipText: {
    fontFamily: 'Inter_500Medium',
    color: colors.textPrimary,
  },
  collectionChipTextSelected: {
    color: colors.primary,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  saveButtonLabel: {
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
