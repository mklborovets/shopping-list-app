import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { registerUser } from '../../services/auth';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await registerUser(email, password);
    } catch (err: any) {
      let msg = 'Registration failed.';
      if (err.code === 'auth/invalid-email') msg = 'Invalid email format.';
      else if (err.code === 'auth/email-already-in-use') msg = 'Email is already in use.';
      else if (err.code === 'auth/weak-password') msg = 'Password should be at least 6 characters.';
      else if (err.message) msg = err.message;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.title}>Create Account</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#999" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#999" value={password} onChangeText={setPassword} secureTextEntry />
        {loading ? <ActivityIndicator size="large" color="#007aff" style={{ marginVertical: 15 }} /> : (
          <TouchableOpacity style={styles.btn} onPress={handleRegister}>
            <Text style={styles.btnText}>Sign Up</Text>
          </TouchableOpacity>
        )}
        <Link href="/(auth)/login" style={styles.link}><Text style={styles.linkText}>Already have an account? Log In</Text></Link>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f7' },
  form: { flex: 1, justifyContent: 'center', paddingHorizontal: 20, width: '100%', maxWidth: 400, alignSelf: 'center' },
  title: { fontSize: 32, fontWeight: '800', marginBottom: 30, textAlign: 'center', color: '#1c1c1e' },
  input: { height: 50, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e5ea', borderRadius: 12, paddingHorizontal: 15, marginBottom: 15, color: '#000', fontSize: 16 },
  btn: { backgroundColor: '#007aff', height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  error: { color: '#ff3b30', marginBottom: 15, textAlign: 'center' },
  link: { marginTop: 25, alignItems: 'center', alignSelf: 'center' },
  linkText: { color: '#007aff', fontSize: 16, fontWeight: '500' }
});
