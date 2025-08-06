// components/CalendarioSemana.js
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const franjas = ['10:00 - 12:00', '12:00 - 14:00', '17:00 - 19:00', '19:00 - 21:00'];

export default function CalendarioSemana() {
  return (
    <ScrollView>
      <View style={styles.header}>
        <Text style={styles.title}>Semana del 26 mayo al 1 junio</Text>
      </View>
      <View style={styles.table}>
        <View style={styles.row}>
          <Text style={styles.cellHeader}></Text>
          {diasSemana.map((dia, index) => (
            <Text key={index} style={styles.cellHeader}>{dia}</Text>
          ))}
        </View>

        {franjas.map((franja, i) => (
          <View key={i} style={styles.row}>
            <Text style={styles.cellHeader}>{franja}</Text>
            {diasSemana.map((dia, j) => (
              <View key={j} style={styles.cell}>
                <Text style={styles.cellText}>[HUECOS]</Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginVertical: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  table: {
    marginHorizontal: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cellHeader: {
    flex: 1,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 5,
    backgroundColor: '#ddd',
    borderWidth: 1,
    borderColor: '#aaa',
  },
  cell: {
    flex: 1,
    height: 60,
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellText: {
    fontSize: 12,
  },
});
