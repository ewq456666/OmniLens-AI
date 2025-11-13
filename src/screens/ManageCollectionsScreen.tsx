import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useLibrary } from '../context/LibraryContext';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

export type ManageCollectionsScreenProps = NativeStackScreenProps<RootStackParamList, 'ManageCollections'>;

export const ManageCollectionsScreen: React.FC<ManageCollectionsScreenProps> = () => {
  const { collections, addCollection, editCollection, removeCollection, defaultCollectionId } = useLibrary();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter a name for the collection.');
      return;
    }
    await addCollection({ name: name.trim(), description: description.trim() || undefined });
    setName('');
    setDescription('');
  };

  const startRename = (id: string, currentName: string) => {
    setEditingId(id);
    setEditingName(currentName);
  };

  const commitRename = async () => {
    if (!editingId) {
      return;
    }
    if (editingId === defaultCollectionId) {
      setEditingId(null);
      setEditingName('');
      Alert.alert('Protected collection', 'The default collection cannot be renamed here.');
      return;
    }
    if (!editingName.trim()) {
      Alert.alert('Name required', 'Please enter a name for the collection.');
      return;
    }
    await editCollection(editingId, { name: editingName.trim(), updatedAt: Date.now() });
    setEditingId(null);
    setEditingName('');
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete collection', 'Items will remain in the library. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await removeCollection(id);
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <Text style={typography.subtitle}>Create a collection</Text>
        <TextInput
          placeholder="Collection name"
          style={styles.input}
          value={name}
          onChangeText={setName}
        />
        <TextInput
          placeholder="Description (optional)"
          style={styles.input}
          value={description}
          onChangeText={setDescription}
        />
        <TouchableOpacity style={styles.createButton} onPress={handleCreate}>
          <Text style={styles.createButtonLabel}>Create collection</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={collections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isDefault = item.id === defaultCollectionId;
          return (
            <View style={styles.collectionCard}>
              <View style={styles.collectionInfo}>
                <View style={styles.collectionTitleRow}>
                  <Text style={typography.subtitle}>{item.name}</Text>
                  {isDefault && <Text style={styles.defaultBadge}>Default</Text>}
                </View>
                <Text style={styles.collectionDescription}>{item.description || 'No description'}</Text>
              </View>
              <View style={styles.actions}>
                {editingId === item.id ? (
                  <View style={styles.renameRow}>
                    <TextInput
                      value={editingName}
                      onChangeText={setEditingName}
                      style={[styles.input, styles.renameInput]}
                      placeholder="New name"
                    />
                    <TouchableOpacity style={styles.renameSave} onPress={commitRename}>
                      <Text style={styles.renameSaveText}>Save</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setEditingId(null)}>
                      <Text style={styles.link}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity onPress={() => startRename(item.id, item.name)} disabled={isDefault}>
                    <Text style={[styles.link, isDefault && styles.disabledText]}>Rename</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => handleDelete(item.id)} disabled={isDefault}>
                  <Text style={[styles.destructive, isDefault && styles.disabledText]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Text style={typography.body}>No collections yet.</Text>
          </View>
        )}
        contentContainerStyle={collections.length === 0 && styles.emptyContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
    gap: 16,
  },
  form: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
    fontFamily: 'Inter_400Regular',
    color: colors.textPrimary,
  },
  createButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonLabel: {
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
  },
  collectionCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    gap: 12,
  },
  collectionInfo: {
    gap: 4,
  },
  collectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  collectionDescription: {
    ...typography.body,
  },
  defaultBadge: {
    backgroundColor: '#E0EDFF',
    color: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
  },
  renameRow: {
    flex: 1,
    flexDirection: 'column',
    gap: 8,
  },
  renameInput: {
    marginTop: 8,
  },
  renameSave: {
    backgroundColor: colors.accent,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  renameSaveText: {
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
  },
  link: {
    color: colors.primary,
    fontFamily: 'Inter_500Medium',
  },
  destructive: {
    color: colors.danger,
    fontFamily: 'Inter_500Medium',
  },
  disabledText: {
    opacity: 0.4,
  },
  empty: {
    padding: 24,
    alignItems: 'center',
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
});
