import React, { useState } from "react";
import { View, Text, TextInput, Pressable, Alert, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";

// ✨ NUEVO: Reutilizamos el componente del ojo
const EyeIcon = ({ onPress, isPasswordVisible }) => (
  <TouchableOpacity onPress={onPress} style={styles.eyeIcon}>
    <Text>{isPasswordVisible ? '🙈' : '👁️'}</Text>
  </TouchableOpacity>
);

export default function Ajustes({ idAlumno }) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // ✨ NUEVO: Estados para la visibilidad y carga
  const [isOldPassVisible, setOldPassVisible] = useState(false);
  const [isNewPassVisible, setNewPassVisible] = useState(false);
  const [isConfirmPassVisible, setConfirmPassVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Para mostrar un spinner

  const baseUrl = "https://buvle-backend.onrender.com";

  // ✨ NUEVO: Función de validación
  const validatePasswords = () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Completa todos los campos");
      return false;
    }
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      Alert.alert('Contraseña débil', 'La nueva contraseña debe tener al menos 8 caracteres y un número.');
      return false;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Las nuevas contraseñas no coinciden");
      return false;
    }
    return true;
  };

  const handleChangePassword = async () => {
    if (!validatePasswords()) {
      return;
    }

    setIsLoading(true); // Inicia la carga
    try {
      const res = await fetch(`${baseUrl}/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idAlumno, oldPassword, newPassword }),
      });
      const json = await res.json();

      if (json.success) {
        Alert.alert("Éxito", "Contraseña actualizada correctamente");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        Alert.alert("Error", json.message || "No se pudo cambiar la contraseña");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "No se pudo conectar al servidor");
    } finally {
      setIsLoading(false); // Termina la carga
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ajustes</Text>
      <Text style={styles.subtitle}>Cambiar contraseña</Text>

      {/* ✨ NUEVO: Campos de contraseña con visibilidad */}
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.inputPassword}
          placeholder="Contraseña actual"
          secureTextEntry={!isOldPassVisible}
          value={oldPassword}
          onChangeText={setOldPassword}
        />
        <EyeIcon onPress={() => setOldPassVisible(!isOldPassVisible)} isPasswordVisible={isOldPassVisible} />
      </View>

      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.inputPassword}
          placeholder="Nueva contraseña"
          secureTextEntry={!isNewPassVisible}
          value={newPassword}
          onChangeText={setNewPassword}
        />
        <EyeIcon onPress={() => setNewPassVisible(!isNewPassVisible)} isPasswordVisible={isNewPassVisible} />
      </View>
      
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.inputPassword}
          placeholder="Confirmar nueva contraseña"
          secureTextEntry={!isConfirmPassVisible}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        <EyeIcon onPress={() => setConfirmPassVisible(!isConfirmPassVisible)} isPasswordVisible={isConfirmPassVisible} />
      </View>

      {/* 🐛 CORREGIDO: Botón ahora deshabilita y muestra un spinner al cargar */}
      <Pressable style={[styles.button, isLoading && styles.buttonDisabled]} onPress={handleChangePassword} disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Guardar cambios</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 15,
    textAlign: "center",
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  inputPassword: {
    flex: 1,
    padding: 10,
  },
  eyeIcon: {
    padding: 10,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 6,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: '#A9A9A9',
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});
