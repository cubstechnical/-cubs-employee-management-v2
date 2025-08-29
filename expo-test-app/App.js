import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert } from 'react-native';

export default function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [serverStatus, setServerStatus] = useState('Checking...');

  // Test connection to your Next.js server
  const testConnection = async () => {
    try {
      // Replace with your actual server URL
      const response = await fetch('https://cubsgroups.com');
      if (response.ok) {
        setIsConnected(true);
        setServerStatus('✅ Connected to server');
      } else {
        setServerStatus('❌ Server responded with error');
      }
    } catch (error) {
      setServerStatus('❌ Cannot connect to server');
      console.log('Connection error:', error);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  const showInfo = () => {
    Alert.alert(
      'CUBS Visa Management - Test App',
      'This is a development testing app for Expo Go.\n\nFeatures:\n• Test server connectivity\n• Preview mobile UI\n• Development testing\n\nYour main app is built with Next.js + Capacitor.',
      [{ text: 'OK' }]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>CUBS Visa Management</Text>
        <Text style={styles.subtitle}>Development Test App</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Server Status</Text>
          <Text style={[styles.statusText, isConnected ? styles.successText : styles.errorText]}>
            {serverStatus}
          </Text>
          <TouchableOpacity style={styles.button} onPress={testConnection}>
            <Text style={styles.buttonText}>Test Connection</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.button, styles.infoButton]} onPress={showInfo}>
          <Text style={styles.buttonText}>App Info</Text>
        </TouchableOpacity>

        <View style={styles.instructions}>
          <Text style={styles.instructionTitle}>How to use:</Text>
          <Text style={styles.instructionText}>
            1. This app tests your server connectivity{'\n'}
            2. Your main app uses Next.js + Capacitor{'\n'}
            3. Build production app with: npm run eas:build:ios{'\n'}
            4. Submit to App Store with: npm run eas:submit:ios
          </Text>
        </View>
      </View>

      <StatusBar style="auto" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#111827',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
  },
  content: {
    padding: 20,
  },
  statusCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#111827',
  },
  statusText: {
    fontSize: 16,
    marginBottom: 15,
  },
  successText: {
    color: '#10b981',
  },
  errorText: {
    color: '#ef4444',
  },
  button: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  infoButton: {
    backgroundColor: '#6b7280',
    marginBottom: 20,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  instructions: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#111827',
  },
  instructionText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4b5563',
  },
});
