// Formato.js - VERSIÓN FINAL

import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';

export default function Formato({ planClases, idAlumno, onPlanChanged }) {
  const baseUrl = "https://buvle-backend.onrender.com";
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(planClases);

  const getPlanDescription = (plan) => {
    switch (plan) {
      case 4: return { title: "Bono Mensual", classes: "4 clases" };
      case 2: return { title: "Bono Mensual", classes: "2 clases" };
      case 1: return { title: "Clases Sueltas", classes: "1 clase" };
      default: return { title: "Sin Plan Activo", classes: "N/A" };
    }
  };

  const handleUpdatePlan = async () => {
    try {
      const res = await fetch(`${baseUrl}/update-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idAlumno: idAlumno, nuevoPlan: selectedPlan }),
      });
      const data = await res.json();
      if (data.success) {
        Alert.alert("Éxito", "Tu plan ha sido actualizado.");
        onPlanChanged(selectedPlan); // Notificamos a App.js del cambio
        setModalVisible(false);
      } else {
        Alert.alert("Error", data.message);
      }
    } catch (err) {
      Alert.alert("Error", "No se pudo conectar con el servidor.");
    }
  };

  const planActual = getPlanDescription(planClases);

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Tu Formato de Clases</Text>
      
      <View style={styles.card}>
        <Text style={styles.planTitle}>{planActual.title}</Text>
        <Text style={styles.planClasses}>{planActual.classes}</Text>
        <Text style={styles.planInfo}>Este es tu plan actual. Los precios se aplicarán en tu próximo pago.</Text>
        <Pressable style={styles.button} onPress={() => setModalVisible(true)}>
          <Text style={styles.buttonText}>Cambiar de Plan</Text>
        </Pressable>
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecciona tu nuevo plan</Text>
            <Picker
              selectedValue={selectedPlan}
              onValueChange={(itemValue) => setSelectedPlan(itemValue)}
            >
              <Picker.Item label="Bono 4 clases/mes" value={4} />
              <Picker.Item label="Bono 2 clases/mes" value={2} />
              <Picker.Item label="Clase suelta" value={1} />
            </Picker>
            <Pressable style={styles.button} onPress={handleUpdatePlan}>
              <Text style={styles.buttonText}>Confirmar Cambio</Text>
            </Pressable>
            <Pressable style={[styles.button, {backgroundColor: 'grey'}]} onPress={() => setModalVisible(false)}>
              <Text style={styles.buttonText}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ... tus estilos existentes ...
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
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
    color: '#333',
    marginBottom: 8,
  },
  planInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  button: {
    width: '100%',
    padding: 12,
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    backgroundColor: '#007bff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
});