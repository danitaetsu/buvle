import React, { useState } from "react";
import { View, Text, TextInput, Pressable, Alert, StyleSheet } from "react-native";

export default function Login({ 
  setIsLoggedIn, 
  setNombre, 
  setIdAlumno, 
  setIsRegistering, 
  setIsRecovering,
  setTipoPago, 
  setMesMatricula, 
  setPlanClases 
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const baseUrl = "https://buvle-backend.onrender.com";

  const handleLogin = async () => {
    try {
      const res = await fetch(`${baseUrl}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();

      if (json.success) {
        // Guardar la info básica
        setNombre(json.alumno.nombre);
        setIdAlumno(json.alumno.id_alumno);

        // Guardar nuevos campos
        if (setTipoPago) setTipoPago(json.alumno.tipo_pago);
        if (setMesMatricula) setMesMatricula(json.alumno.mes_matricula);
        if (setPlanClases) setPlanClases(json.alumno.plan_clases);

        setIsLoggedIn(true);
      } else {
        Alert.alert("Error", json.message || "Credenciales inválidas");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "No se pudo conectar al servidor");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Iniciar Sesión</Text>

      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Pressable style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Entrar</Text>
      </Pressable>

      <Pressable onPress={() => setIsRegistering(true)}>
        <Text style={styles.link}>¿No tienes cuenta? Regístrate</Text>
      </Pressable>

      <Pressable onPress={() => setIsRecovering(true)}>
        <Text style={styles.link}>¿Has olvidado tu contraseña?</Text>
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
