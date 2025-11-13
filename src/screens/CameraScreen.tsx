import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useLibrary } from '../context/LibraryContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';

export const CameraScreen: React.FC = () => {
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setProcessing] = useState(false);
  const cameraRef = useRef<CameraView | null>(null);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { addScan } = useLibrary();

  const ensurePermissions = async () => {
    if (permission?.granted) {
      return true;
    }
    const status = await requestPermission();
    if (!status.granted) {
      Alert.alert('Permission required', 'Camera access is necessary to capture items.');
      return false;
    }
    return true;
  };

  const handleCapture = async () => {
    if (!(await ensurePermissions())) {
      return;
    }
    try {
      setProcessing(true);
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.8, base64: false });
      if (!photo) {
        throw new Error('No photo captured');
      }
      const item = await addScan({ imageUri: photo.uri });
      if (item?.status === 'queued') {
        Alert.alert('Captured offline', 'Your scan is saved and will finish processing when you are back online.');
      } else {
        Alert.alert('Captured', 'Your scan has been added to the library.');
      }
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert('Capture failed', 'We were unable to capture this image. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleImport = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (result.canceled) {
      return;
    }
    try {
      setProcessing(true);
      const asset = result.assets[0];
      const item = await addScan({ imageUri: asset.uri });
      if (item?.status === 'queued') {
        Alert.alert('Imported offline', 'Your image is saved and will finish processing when you are back online.');
      } else {
        Alert.alert('Imported', 'Image imported successfully.');
      }
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert('Import failed', 'We were unable to import this image.');
    } finally {
      setProcessing(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={typography.subtitle}>Camera access needed</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={ensurePermissions}>
          <Text style={styles.primaryButtonLabel}>Grant camera permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleImport}>
          <Text style={styles.secondaryButtonLabel}>Import from gallery</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={StyleSheet.absoluteFillObject} ref={cameraRef} facing="back" />
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.importButton} onPress={handleImport}>
          <Text style={styles.importText}>Import</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.captureButton, isProcessing && styles.captureDisabled]}
          onPress={handleCapture}
          disabled={isProcessing}
        />
        {isProcessing && (
          <View style={styles.processingIndicator}>
            <ActivityIndicator color="#FFFFFF" />
            <Text style={styles.processingText}>Processing capture…</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    gap: 16,
    padding: 24,
  },
  overlay: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 16,
  },
  captureButton: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#FFFFFF',
    borderWidth: 4,
    borderColor: colors.primary,
  },
  captureDisabled: {
    opacity: 0.5,
  },
  importButton: {
    position: 'absolute',
    top: -40,
    right: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  importText: {
    color: '#FFFFFF',
    fontFamily: 'Inter_500Medium',
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryButtonLabel: {
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
  },
  secondaryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  secondaryButtonLabel: {
    color: colors.primary,
    fontFamily: 'Inter_500Medium',
  },
  processingIndicator: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  processingText: {
    color: '#FFFFFF',
    fontFamily: 'Inter_500Medium',
  },
});
