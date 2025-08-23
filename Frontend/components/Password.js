import React, { useState } from "react";
import { View, Text, TextInput, Pressable, Alert, StyleSheet } from "react-native";

export default function Password({ setIsRecovering }) {
  const [email, setEmail] = useState("");
  const baseUrl = "https://buvle-backend.onrender.com";

  const handleRecover = async () => {
    if (!email) {
      Alert.alert("Error", "Introduce tu correo");
      return;
    }
    try {
      const res = await fetch(`${baseUrl}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (json.success) {
        Alert.alert("Éxito", "Se ha enviado una nueva contraseña a tu correo");
        setIsRecovering(false); // volver al login
      } else {
        Alert.alert("Error", json.message || "No se pudo enviar la contraseña");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "No se pudo conectar al servidor");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recuperar Contraseña</Text>

      <TextInput
        style={styles.input}
        placeholder="Introduce tu correo"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />

      <Pressable style={styles.button} onPress={handleRecover}>
        <Text style={styles.buttonText}>Enviar</Text>
      </Pressable>

      <Pressable onPress={() => setIsRecovering(false)}>
        <Text style={styles.link}>Volver al inicio de sesión</Text>
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
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 6,
    marginBottom: 15,
  },
  button: {
    backgroundColor: "green",
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  link: {
    marginTop: 15,
    color: "blue",
    textAlign: "center",
  },
});
