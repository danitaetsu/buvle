import React, { useState } from 'react';
import { StyleSheet, View, Text, Button } from 'react-native';
import Menu from '../components/Menu';
import Horario from './Horario';
import Plan from './Plan';
import Clases from './Clases';
import Pagos from './Pagos';
import Ajustes from './Ajustes';   // 👈 importamos la nueva página

export default function PersonalArea({ nombre, idAlumno, setIsLoggedIn }) {
  const [currentPage, setCurrentPage] = useState('home');

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Text style={styles.welcome}>Bienvenid@, {nombre}!</Text>;
      case 'horario':
        return <Horario id_alumno={idAlumno} />;
      case 'plan':
        return <Plan />;
      case 'clases':
        return <Clases id_alumno={idAlumno} />;
      case 'pagos':
        return <Pagos />;
      case 'ajustes':   // 👈 nueva opción
        return <Ajustes idAlumno={idAlumno} />;
      default:
        return <Text style={styles.welcome}>Bienvenid@, {nombre}!</Text>;
    }
  };

  return (
    <View style={styles.container}>
      {renderPage()}
      <Menu setCurrentPage={setCurrentPage} />
      <Button title="Cerrar Sesión" onPress={() => setIsLoggedIn(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  welcome: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
});
