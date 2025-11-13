import React from 'react';
import { TouchableOpacity, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { Feather } from '@expo/vector-icons';

interface ScanFabProps {
  onPress: () => void;
}

export const ScanFab: React.FC<ScanFabProps> = ({ onPress }) => (
  <View style={styles.wrapper}>
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Open camera to scan"
    >
      <Feather name="camera" size={24} color="#FFFFFF" />
      <Text style={styles.label}>Scan</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 999,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    shadowColor: '#1D4ED8',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  label: {
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
  },
});
