import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useLibrary } from '../context/LibraryContext';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { ItemCard } from '../components/ItemCard';
import { FilterSheet } from '../components/FilterSheet';
import { ScanFab } from '../components/ScanFab';

export type LibraryScreenProps = NativeStackScreenProps<RootStackParamList, 'Library'>;

export const LibraryScreen: React.FC<LibraryScreenProps> = ({ navigation }) => {
  const { items, collections, refresh, runSearch } = useLibrary();
  const [query, setQuery] = useState('');
  const [isLoading, setLoading] = useState(false);
  const [results, setResults] = useState(items);
  const [filters, setFilters] = useState<{ tags: string[]; category?: string; collectionId?: string | null }>(
    { tags: [], category: undefined, collectionId: undefined },
  );

  const hasActiveFilters = useMemo(
    () =>
      Boolean(query.trim()) || filters.tags.length > 0 || filters.category || typeof filters.collectionId !== 'undefined',
    [query, filters],
  );

  const displayedItems = useMemo(() => {
    if (hasActiveFilters) {
      return results;
    }
    return items;
  }, [items, results, hasActiveFilters]);

  const handleSearch = async (text: string) => {
    setQuery(text);
    setLoading(true);
    const trimmed = text.trim();
    const shouldRunSearch =
      trimmed.length > 0 || filters.tags.length > 0 || filters.category || typeof filters.collectionId !== 'undefined';
    if (!shouldRunSearch) {
      setResults(items);
      setLoading(false);
      return;
    }
    const res = await runSearch(trimmed, filters);
    setResults(res);
    setLoading(false);
  };

  const onRefresh = async () => {
    setLoading(true);
    await refresh();
    setLoading(false);
  };

  useEffect(() => {
    if (!hasActiveFilters) {
      setResults(items);
      return;
    }
    handleSearch(query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, hasActiveFilters, items]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={typography.title}>OmniLens Library</Text>
          <Text style={styles.subtitle}>Capture, categorize, and find everything instantly.</Text>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Manage collections"
          onPress={() => navigation.navigate('ManageCollections')}
        >
          <Text style={styles.collectionsLink}>Collections</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Search by title, text, or notes"
          placeholderTextColor={colors.textSecondary}
          style={styles.searchInput}
          value={query}
          onChangeText={handleSearch}
        />
        <FilterSheet filters={filters} onChange={setFilters} collections={collections} />
      </View>
      {isLoading && (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}
      <FlatList
        data={displayedItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ItemCard
            item={item}
            onPress={() => navigation.navigate('ItemDetail', { itemId: item.id })}
          />
        )}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} />}
        contentContainerStyle={displayedItems.length === 0 ? styles.emptyStateContainer : styles.listContent}
        ListEmptyComponent={() => (
          <View style={styles.emptyStateContainer}>
            <Text style={typography.subtitle}>No items yet</Text>
            <Text style={styles.emptyStateText}>
              Tap the Scan button to capture your first item or import from your gallery.
            </Text>
          </View>
        )}
      />
      <ScanFab onPress={() => navigation.navigate('Camera')} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
  },
  header: {
    paddingTop: 12,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subtitle: {
    ...typography.body,
    marginTop: 6,
  },
  collectionsLink: {
    ...typography.body,
    color: colors.primary,
    fontFamily: 'Inter_500Medium',
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: 'Inter_400Regular',
    color: colors.textPrimary,
  },
  listContent: {
    paddingBottom: 120,
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyStateText: {
    ...typography.body,
    textAlign: 'center',
    marginTop: 8,
  },
  loading: {
    paddingVertical: 8,
  },
});
