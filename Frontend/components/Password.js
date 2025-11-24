import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";

export default function Password({ setIsRecovering }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(null); // "success" | "error"
  const baseUrl = "https://buvle-pruebas.onrender.com";

  const handleRecover = async () => {
    if (!email) {
      setMessage("Introduce tu correo");
      setMessageType("error");
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
        setMessage("✅ Se ha enviado una nueva contraseña a tu correo");
        setMessageType("success");
        // Opcional: esperar unos segundos y volver al login
        setTimeout(() => setIsRecovering(false), 2500);
      } else {
        setMessage(json.message || "No se pudo enviar la contraseña");
        setMessageType("error");
      }
    } catch (err) {
      console.error(err);
      setMessage("No se pudo conectar al servidor");
      setMessageType("error");
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

      {/* Mensaje en pantalla */}
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
  message: {
    textAlign: "center",
    marginBottom: 15,
    fontSize: 16,
  },
  success: { color: "green" },
  error: { color: "red" },
});
