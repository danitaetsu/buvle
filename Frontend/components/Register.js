import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Button } from 'react-native';
import { Picker } from '@react-native-picker/picker';

export default function Register({ setIsRegistering }) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [planClases, setPlanClases] = useState('4'); // por defecto 4 clases
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleRegister = async () => {
    if (!nombre || !email || !password || !confirmPassword || !planClases) {
      setErrorMessage('Todos los campos son obligatorios');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden');
      return;
    }

    try {
      const response = await fetch('https://buvle-backend.onrender.com/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          email,
          password,
          confirmPassword,
          plan_clases: planClases
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setErrorMessage('');
        setSuccessMessage('Registro exitoso. ¡Ahora puedes iniciar sesión!');
        setTimeout(() => setIsRegistering(false), 2000); // volver al login
      } else {
        setErrorMessage(data.message || 'No se pudo completar el registro');
      }
    } catch (error) {
      console.error('Error en la solicitud:', error);
      setErrorMessage('Algo salió mal, intente nuevamente');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registro</Text>
      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
      {successMessage ? <Text style={styles.success}>{successMessage}</Text> : null}

      <TextInput
        style={styles.input}
        placeholder="Nombre"
        value={nombre}
        onChangeText={setNombre}
      />
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
      <TextInput
        style={styles.input}
        placeholder="Confirmar Contraseña"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      {/* Selector de plan de clases */}
      <Text style={styles.label}>Plan de clases</Text>
      <Picker
        selectedValue={planClases}
        style={styles.input}
        onValueChange={(itemValue) => setPlanClases(itemValue)}
      >
        <Picker.Item label="2 clases al mes" value="2" />
        <Picker.Item label="4 clases al mes" value="4" />
      </Picker>

      <Button title="Registrarse" onPress={handleRegister} />

      <View style={styles.backToLoginContainer}>
        <Text>¿Ya tienes cuenta?</Text>
        <Button title="Inicia sesión" onPress={() => setIsRegistering(false)} />
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
  label: {
    alignSelf: 'flex-start',
    marginBottom: 5,
    fontWeight: 'bold',
  },
  error: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  success: {
    color: 'green',
    marginBottom: 10,
    textAlign: 'center',
  },
  backToLoginContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
});
