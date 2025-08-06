import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

export default function Horario() {
  const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  const franjas = ['10:00 - 12:00', '12:00 - 14:00', '17:00 - 19:00', '19:00 - 21:00'];
  const [seleccionado, setSeleccionado] = useState(null); // slot seleccionado

  const manejarSeleccion = (dia, franja) => {
    const slotId = `${dia}-${franja}`;
    if (seleccionado === slotId) {
      setSeleccionado(null); // deseleccionar
    } else if (!seleccionado) {
      setSeleccionado(slotId); // seleccionar
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Horario semanal</Text>
      <Text style={styles.subtitulo}>Semana del 26 mayo al 1 junio</Text>

      <View style={styles.tabla}>
        {/* Cabecera */}
        <View style={styles.fila}>
          <View style={styles.celdaHora}></View>
          {dias.map((dia) => (
            <View key={dia} style={styles.celdaCabecera}>
              <Text style={styles.textoCabecera}>{dia}</Text>
            </View>
          ))}
        </View>

        {/* Filas de franjas */}
        {franjas.map((franja) => (
          <View key={franja} style={styles.fila}>
            {/* Hora */}
            <View style={styles.celdaHora}>
              <Text style={styles.textoHora}>{franja}</Text>
            </View>

            {/* Celdas de selección */}
            {dias.map((dia) => {
              const slotId = `${dia}-${franja}`;
              const activo = seleccionado === slotId;
              const deshabilitado = seleccionado && !activo;

              return (
                <TouchableOpacity
                  key={slotId}
                  style={[
                    styles.celda,
                    activo && styles.celdaActiva,
                    deshabilitado && styles.celdaDeshabilitada,
                  ]}
                  onPress={() => manejarSeleccion(dia, franja)}
                  disabled={deshabilitado}
                >
                  <Text style={styles.textoCelda}>{activo ? '✅' : '⬜'}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f4',
    paddingTop: 40,
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitulo: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '600',
  },
  tabla: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    overflow: 'hidden',
  },
  fila: {
    flexDirection: 'row',
  },
  celdaHora: {
    width: 100,
    backgroundColor: '#e0e0e0',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoHora: {
    fontWeight: '600',
  },
  celdaCabecera: {
    flex: 1,
    backgroundColor: '#ddd',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  textoCabecera: {
    fontWeight: 'bold',
  },
  celda: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  celdaActiva: {
    backgroundColor: '#90ee90', // verde claro
  },
  celdaDeshabilitada: {
    backgroundColor: '#d3d3d3',
  },
  textoCelda: {
    fontSize: 14,
  },
});
