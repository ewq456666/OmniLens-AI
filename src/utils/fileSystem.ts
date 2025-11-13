import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import { Platform } from 'react-native';
import { v4 as uuidv4 } from 'uuid';

const LIBRARY_DIR = `${FileSystem.documentDirectory}captures/`;

const ensureDirectory = async () => {
  const dirInfo = await FileSystem.getInfoAsync(LIBRARY_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(LIBRARY_DIR, { intermediates: true });
  }
};

export const moveImageToLibrary = async (uri: string, name?: string): Promise<string> => {
  await ensureDirectory();
  const fileName = `${name ?? uuidv4()}.jpg`;
  const destination = `${LIBRARY_DIR}${fileName}`;
  if (uri.startsWith('file://')) {
    await FileSystem.copyAsync({ from: uri, to: destination });
  } else if (Platform.OS === 'ios' || Platform.OS === 'android') {
    const permissions = await MediaLibrary.requestPermissionsAsync();
    if (!permissions.granted) {
      throw new Error('Media library permission is required to import images.');
    }
    const asset = await MediaLibrary.createAssetAsync(uri);
    await FileSystem.copyAsync({ from: asset.uri, to: destination });
  } else {
    await FileSystem.writeAsStringAsync(destination, uri);
  }
  return destination;
};
