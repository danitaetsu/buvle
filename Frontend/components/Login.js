import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Button } from 'react-native';

export default function Login({ setIsLoggedIn, setNombre, setIsRegistering }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [errorMessage, setErrorMessage] = useState(''); // Estado para el mensaje de error
  
  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMessage('Por favor ingrese email y contraseña');
      return;
    }

    try {
      const response = await fetch('https://buvle.onrender.com/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setErrorMessage(''); // Limpia el mensaje de error si el inicio de sesión es exitoso
        setNombre(data.nombre);
        setIsLoggedIn(true);
      } else {
        const errorMessage = data?.message || 'Usuario no registrado o contraseña incorrecta';
        setErrorMessage(errorMessage); // Muestra el mensaje de error en pantalla
      }
    } catch (error) {
      console.error('Error en la solicitud:', error);
      setErrorMessage('Algo salió mal, intente nuevamente'); // Muestra un mensaje genérico en caso de fallo
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Buvle App</Text>
      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null} {/* Muestra el mensaje de error */}
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

      <View style={styles.registerContainer}>
        <Text>¿No tienes cuenta?</Text>
        <Button title="Regístrate" onPress={() => setIsRegistering(true)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
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
  error: {
    color: 'red',
    marginBottom: 10, // Espacio entre el error y el siguiente campo
    textAlign: 'center',
  },
  registerContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
});
