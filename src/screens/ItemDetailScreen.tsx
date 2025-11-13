import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useLibrary } from '../context/LibraryContext';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { TagList } from '../components/TagList';

export type ItemDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'ItemDetail'>;

export const ItemDetailScreen: React.FC<ItemDetailScreenProps> = ({ route, navigation }) => {
  const { itemId } = route.params;
  const { items, removeItem } = useLibrary();
  const item = items.find((it) => it.id === itemId);

  if (!item) {
    return (
      <View style={styles.empty}>
        <Text style={typography.subtitle}>Item not found</Text>
      </View>
    );
  }

  const handleDelete = () => {
    Alert.alert('Delete item', 'Are you sure you want to delete this item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await removeItem(item.id);
          navigation.goBack();
        },
      },
    ]);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: item.title,
        message: `${item.title}\n\n${item.notes}\n\nTags: ${item.tags.join(', ')}`,
      });
    } catch (error) {
      console.error('Failed to share', error);
      Alert.alert('Share failed', 'We could not share this item.');
    }
  };

  const handleExport = async () => {
    try {
      const exportContent = `Title: ${item.title}\nCategory: ${item.category}\nTags: ${item.tags.join(', ')}\n\nNotes:\n${item.notes}\n\nOCR:\n${item.ocrText}`;
      const exportPath = `${FileSystem.cacheDirectory}${item.id}.txt`;
      await FileSystem.writeAsStringAsync(exportPath, exportContent, { encoding: FileSystem.EncodingType.UTF8 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(exportPath, { dialogTitle: 'Export OmniLens item' });
      } else {
        Alert.alert('Export saved', `File saved to ${exportPath}`);
      }
    } catch (error) {
      console.error('Export failed', error);
      Alert.alert('Export failed', 'Could not export this item.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Image source={{ uri: item.imageUri }} style={styles.image} />
      <View style={styles.section}>
        <View style={styles.headerRow}>
          <Text style={typography.title}>{item.title || 'Untitled capture'}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('EditMetadata', { itemId: item.id })}>
            <Text style={styles.editLink}>Edit</Text>
          </TouchableOpacity>
        </View>
        <TagList tags={[item.category, ...item.tags]} />
      </View>
      <View style={styles.section}>
        <Text style={typography.subtitle}>Notes</Text>
        <Text style={styles.bodyText}>{item.notes || 'No notes yet. Add context to this capture.'}</Text>
      </View>
      <View style={styles.section}>
        <Text style={typography.subtitle}>OCR</Text>
        <Text style={styles.bodyText}>{item.ocrText || 'No text recognized.'}</Text>
      </View>
      <View style={styles.section}>
        <Text style={typography.subtitle}>Identified Objects</Text>
        <TagList tags={item.identifiedObjects} />
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleShare}>
          <Text style={styles.primaryButtonText}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleExport}>
          <Text style={styles.secondaryButtonText}>Export</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.destructiveButton} onPress={handleDelete}>
          <Text style={styles.destructiveButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
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
  image: {
    width: '100%',
    height: 280,
    borderRadius: 20,
    backgroundColor: colors.border,
  },
  section: {
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editLink: {
    color: colors.primary,
    fontFamily: 'Inter_500Medium',
  },
  bodyText: {
    ...typography.body,
    lineHeight: 22,
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
  },
  secondaryButton: {
    backgroundColor: colors.accent,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
  },
  destructiveButton: {
    backgroundColor: colors.danger,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  destructiveButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
