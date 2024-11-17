import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TextInput, Button, Alert } from 'react-native';

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Estado para manejar la navegación

  // Función para manejar el inicio de sesión
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor ingrese email y contraseña');
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/login', { // Asegúrate de usar tu URL de backend
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setNombre(data.nombre); // Guarda el nombre del usuario
        setIsLoggedIn(true); // Cambia el estado a "logueado"
      } else {
        Alert.alert('Error', data.message || 'Usuario no registrado o contraseña incorrecta');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Algo salió mal, intente nuevamente');
    }
  };

  // Pantalla de bienvenida
  if (isLoggedIn) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Bienvenida a tu área personal</Text>
        <Text style={styles.subtitle}>{nombre}</Text>
      </View>
    );
  }

  // Pantalla de login
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Buvle App</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Button title="Iniciar Sesión" onPress={handleLogin} />

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffa',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: 10,
  },
  input: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
});
