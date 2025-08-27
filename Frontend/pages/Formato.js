// Formato.js

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

// Recibimos planClases como prop
export default function Formato({ planClases }) {
  
  const getPlanDescription = () => {
    switch (planClases) {
      case 4:
        return { title: "Bono Mensual", classes: "4 clases" };
      case 2:
        return { title: "Bono Mensual", classes: "2 clases" };
      case 1:
        return { title: "Clases Sueltas", classes: "1 clase" };
      default:
        return { title: "Sin Plan Activo", classes: "N/A" };
    }
  };

  const plan = getPlanDescription();

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Tu Formato de Clases</Text>
      <View style={styles.card}>
        <Text style={styles.planTitle}>{plan.title}</Text>
        <Text style={styles.planClasses}>{plan.classes}</Text>
        <Text style={styles.planInfo}>Este es tu plan actual. Las clases se renuevan con cada pago.</Text>

        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>Cambiar de Plan</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5', // Un fondo gris claro
    padding: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 25,
    // Sombra para darle profundidad
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  planClasses: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1a202c',
    marginBottom: 12,
  },
  planInfo: {
    fontSize: 14,
    color: '#4a5568',
    marginBottom: 25,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#3182ce',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});