import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";

// 👁️ Icono para mostrar/ocultar contraseñas
const EyeIcon = ({ onPress, isPasswordVisible }) => (
  <TouchableOpacity onPress={onPress} style={styles.eyeIcon}>
    <Text>{isPasswordVisible ? "🙈" : "👁️"}</Text>
  </TouchableOpacity>
);

export default function Ajustes({ idAlumno }) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isOldPassVisible, setOldPassVisible] = useState(false);
  const [isNewPassVisible, setNewPassVisible] = useState(false);
  const [isConfirmPassVisible, setConfirmPassVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(null); // "success" | "error"

  const baseUrl = "https://buvle-pruebas.onrender.com";

  const validatePasswords = () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      setMessage("Completa todos los campos");
      setMessageType("error");
      return false;
    }
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setMessage("La nueva contraseña debe tener al menos 8 caracteres y un número.");
      setMessageType("error");
      return false;
    }
    if (newPassword !== confirmPassword) {
      setMessage("Las nuevas contraseñas no coinciden");
      setMessageType("error");
      return false;
    }
    return true;
  };

  const handleChangePassword = async () => {
    if (!validatePasswords()) return;

    setIsLoading(true);
    setMessage(""); // limpia mensajes previos
    setMessageType(null);

    try {
      const res = await fetch(`${baseUrl}/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idAlumno, oldPassword, newPassword }),
      });

      const json = await res.json();
      console.log("Respuesta /change-password:", json);

      if (json.success) {
        setMessage("Contraseña actualizada correctamente ✅");
        setMessageType("success");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setMessage(json.message || "No se pudo cambiar la contraseña");
        setMessageType("error");
      }
    } catch (err) {
      console.error("❌ Error en handleChangePassword:", err);
      setMessage("No se pudo conectar al servidor");
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ajustes</Text>
      <Text style={styles.subtitle}>Cambiar contraseña</Text>

      {/* Campo contraseña actual */}
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.inputPassword}
          placeholder="Contraseña actual"
          secureTextEntry={!isOldPassVisible}
          value={oldPassword}
          onChangeText={setOldPassword}
        />
        <EyeIcon
          onPress={() => setOldPassVisible(!isOldPassVisible)}
          isPasswordVisible={isOldPassVisible}
        />
      </View>

      {/* Campo nueva contraseña */}
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.inputPassword}
          placeholder="Nueva contraseña"
          secureTextEntry={!isNewPassVisible}
          value={newPassword}
          onChangeText={setNewPassword}
        />
        <EyeIcon
          onPress={() => setNewPassVisible(!isNewPassVisible)}
          isPasswordVisible={isNewPassVisible}
        />
      </View>

      {/* Campo confirmar contraseña */}
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.inputPassword}
          placeholder="Confirmar nueva contraseña"
          secureTextEntry={!isConfirmPassVisible}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        <EyeIcon
          onPress={() => setConfirmPassVisible(!isConfirmPassVisible)}
          isPasswordVisible={isConfirmPassVisible}
        />
      </View>

      {/* Mensajes en pantalla */}
      {message ? (
        <Text
          style={[
            styles.message,
            messageType === "success" ? styles.success : styles.error,
          ]}
        >
          {message}
        </Text>
      ) : null}

      {/* Botón */}
      <Pressable
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleChangePassword}
        disabled={isLoading}
      >
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
  container: { flex: 1, justifyContent: "center", padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  subtitle: { fontSize: 18, marginBottom: 15, textAlign: "center" },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  inputPassword: { flex: 1, padding: 10 },
  eyeIcon: { padding: 10 },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 6,
    alignItems: "center",
  },
  buttonDisabled: { backgroundColor: "#A9A9A9" },
  buttonText: { color: "white", fontWeight: "bold" },
  message: { textAlign: "center", marginBottom: 15, fontSize: 16 },
  success: { color: "green" },
  error: { color: "red" },
});
