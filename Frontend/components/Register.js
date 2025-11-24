import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Button, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons'; // 👀 necesitas instalar expo/vector-icons si no lo tienes

export default function Register({ setIsRegistering }) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [planClases, setPlanClases] = useState('4');
  const [tipoPago, setTipoPago] = useState('1');
  const [mesMatricula, setMesMatricula] = useState('1');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ✅ Validaciones
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  const validatePassword = (password) => {
    return password.length >= 8 && /\d/.test(password);
  };

  const handleRegister = async () => {
    if (!nombre || !email || !password || !confirmPassword) {
      setErrorMessage('Todos los campos son obligatorios');
      return;
    }

    if (!validateEmail(email)) {
      setErrorMessage('El email no tiene un formato válido');
      return;
    }

    if (!validatePassword(password)) {
      setErrorMessage('La contraseña debe tener al menos 8 caracteres y un número');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden');
      return;
    }

    try {
      const response = await fetch('https://buvle-pruebas.onrender.com/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          email,
          password,
          confirmPassword,
          plan_clases: planClases,
          tipo_pago: tipoPago,
          mes_matricula: mesMatricula
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setErrorMessage('');
        setSuccessMessage('Registro exitoso. ¡Ahora puedes iniciar sesión!');
        setTimeout(() => setIsRegistering(false), 2000);
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

      {/* Campo Contraseña con ojito */}
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Contraseña"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Ionicons name={showPassword ? "eye-off" : "eye"} size={24} color="gray" />
        </TouchableOpacity>
      </View>

      {/* Confirmar Contraseña con ojito */}
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Confirmar Contraseña"
          secureTextEntry={!showConfirmPassword}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
          <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={24} color="gray" />
        </TouchableOpacity>
      </View>

      {/* Selectores */}
      <Text style={styles.label}>Formato de Clases</Text>
      <Picker
        selectedValue={planClases}
        style={styles.input}
        onValueChange={(itemValue) => {
          setPlanClases(itemValue);
          if (itemValue === '0') {
            setMesMatricula('0');
          } else if (mesMatricula === '0') {
            setMesMatricula('1');
          }
        }}
      >
        <Picker.Item label="Clases sueltas" value="0" />
        <Picker.Item label="2 clases al mes" value="2" />
        <Picker.Item label="4 clases al mes" value="4" />
      </Picker>

      <Text style={styles.label}>Mes de Matrícula</Text>
      <Picker
        selectedValue={mesMatricula}
        style={styles.input}
        onValueChange={(itemValue) => setMesMatricula(itemValue)}
      >
        {planClases === '0' ? (
          <Picker.Item label="Clases sueltas (sin matrícula)" value="0" />
        ) : (
          <>
            <Picker.Item label="Enero" value="1" />
            <Picker.Item label="Febrero" value="2" />
            <Picker.Item label="Marzo" value="3" />
            <Picker.Item label="Abril" value="4" />
            <Picker.Item label="Mayo" value="5" />
            <Picker.Item label="Junio" value="6" />
            <Picker.Item label="Julio" value="7" />
            <Picker.Item label="Agosto" value="8" />
            <Picker.Item label="Septiembre" value="9" />
            <Picker.Item label="Octubre" value="10" />
            <Picker.Item label="Noviembre" value="11" />
            <Picker.Item label="Diciembre" value="12" />
          </>
        )}
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
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  input: { width: '100%', padding: 10, borderWidth: 1, borderColor: '#ccc', borderRadius: 5, marginBottom: 10, backgroundColor: '#fff' },
  label: { alignSelf: 'flex-start', marginBottom: 5, fontWeight: 'bold' },
  error: { color: 'red', marginBottom: 10, textAlign: 'center' },
  success: { color: 'green', marginBottom: 10, textAlign: 'center' },
  backToLoginContainer: { marginTop: 20, alignItems: 'center' },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', width: '100%', borderWidth: 1, borderColor: '#ccc', borderRadius: 5, marginBottom: 10, backgroundColor: '#fff', paddingHorizontal: 10 },
  passwordInput: { flex: 1, padding: 10 },
});
