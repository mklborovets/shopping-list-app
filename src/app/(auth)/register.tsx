import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Link } from 'expo-router';
import { registerUser } from '../../services/auth';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password) return;
    setLoading(true);
    setError('');
    try {
      await registerUser(email, password);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.title}>Create Account</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
        {loading ? <ActivityIndicator /> : <Button title="Sign Up" onPress={handleRegister} />}
        <Link href="/(auth)/login" style={styles.link}><Text style={styles.linkText}>Already have an account? Log In</Text></Link>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  form: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { height: 50, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 15, marginBottom: 15, color: '#000' },
  error: { color: 'red', marginBottom: 15, textAlign: 'center' },
  link: { marginTop: 20, alignItems: 'center', alignSelf: 'center' },
  linkText: { color: '#007AFF' }
});
