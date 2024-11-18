import React, { useState } from 'react';
import { StyleSheet, View, Text, Button } from 'react-native';
import Menu from '../components/Menu';
import Horario from './Horario';
import Proyectos from './Proyectos';
import Clases from './Clases';
import Pagos from './Pagos';

export default function PersonalArea({ nombre, setIsLoggedIn }) {
  const [currentPage, setCurrentPage] = useState('home');

  const renderPage = () => {
    switch (currentPage) {
        case 'home': // Se asegura que "home" cargue la bienvenida
        return <Text style={styles.welcome}>Bienvenida/o, {nombre}!</Text>;
      case 'horario':
        return <Horario />;
      case 'proyectos':
        return <Proyectos />;
      case 'clases':
        return <Clases />;
      case 'pagos':
        return <Pagos />;
      default:
        return <Text style={styles.welcome}>Bienvenida/o, {nombre}!</Text>;
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
