import React from 'react';
import { View, Button, StyleSheet } from 'react-native';

export default function Menu({ setCurrentPage }) {
  return (
    <View style={styles.menu}>
        <Button title="Home" onPress={() => setCurrentPage('home')} />
      <Button title="Horario" onPress={() => setCurrentPage('horario')} />
      <Button title="Proyectos" onPress={() => setCurrentPage('proyectos')} />
      <Button title="Clases" onPress={() => setCurrentPage('clases')} />
      <Button title="Pagos" onPress={() => setCurrentPage('pagos')} />
    </View>
  );
}

const styles = StyleSheet.create({
  menu: {
    marginTop: 20,
  },
});
