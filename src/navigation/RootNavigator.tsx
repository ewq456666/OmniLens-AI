import type { ReactElement } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LibraryScreen } from '../screens/LibraryScreen';
import { CameraScreen } from '../screens/CameraScreen';
import { ItemDetailScreen } from '../screens/ItemDetailScreen';
import { EditMetadataScreen } from '../screens/EditMetadataScreen';
import { ManageCollectionsScreen } from '../screens/ManageCollectionsScreen';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

export type RootStackParamList = {
  Library: undefined;
  Camera: undefined;
  ItemDetail: { itemId: string };
  EditMetadata: { itemId: string };
  ManageCollections: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const defaultScreenOptions = {
  headerStyle: {
    backgroundColor: colors.card,
  },
  headerTintColor: colors.textPrimary,
  headerTitleStyle: typography.subtitle,
};

export const RootNavigator = (): ReactElement => (
  <Stack.Navigator initialRouteName="Library" screenOptions={defaultScreenOptions}>
    <Stack.Screen
      name="Library"
      component={LibraryScreen}
      options={{ title: 'OmniLens Library', headerShown: false }}
    />
    <Stack.Screen
      name="Camera"
      component={CameraScreen}
      options={{ title: 'Scan' }}
    />
    <Stack.Screen
      name="ItemDetail"
      component={ItemDetailScreen}
      options={{ title: 'Item Details' }}
    />
    <Stack.Screen
      name="EditMetadata"
      component={EditMetadataScreen}
      options={{ title: 'Edit Item' }}
    />
    <Stack.Screen
      name="ManageCollections"
      component={ManageCollectionsScreen}
      options={{ title: 'Collections' }}
    />
  </Stack.Navigator>
);
