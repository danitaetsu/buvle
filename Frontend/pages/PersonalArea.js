import React, { useState } from 'react';
import { StyleSheet, View, Text, Button } from 'react-native';
import Menu from '../components/Menu';
import Horario from './Horario';
import Formato from './Formato';
import Clases from './Clases';
import Pagos from './Pagos.web';
import Ajustes from './Ajustes';

// Recibe la función del director y el plan actual
export default function PersonalArea({
  nombre,
  idAlumno,
  setIsLoggedIn,
  tipoPago,
  mesMatricula,
  planClases,
  onPlanChanged
}) {
  const [currentPage, setCurrentPage] = useState('home');

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Text style={styles.welcome}>Bienvenid@, {nombre}!</Text>;
      case 'horario':
        return <Horario id_alumno={idAlumno} setCurrentPage={setCurrentPage} />;
      case 'formato':
        // Pasa la información y la función de comunicación al empleado
        return <Formato
                  planClases={planClases}
                  idAlumno={idAlumno}
                  onPlanChanged={onPlanChanged}
               />;
      case 'clases':
        return <Clases id_alumno={idAlumno} />;
      case 'pagos':
        return <Pagos tipoPago={tipoPago} idAlumno={idAlumno} />;
      case 'ajustes':
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
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  welcome: { flex: 1, textAlign: 'center', marginTop: 50, fontSize: 24 }
});