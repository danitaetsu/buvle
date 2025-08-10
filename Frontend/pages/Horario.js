import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator
} from 'react-native';

export default function Horario({ id_alumno = 1, nombreAlumno = 'Ana Garcia' }) {
  const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  const franjas = ['10:00 - 12:00', '12:00 - 14:00', '17:00 - 19:00', '19:00 - 21:00'];

  const [monthRef, setMonthRef] = useState(new Date());
  const [turnos, setTurnos] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔹 Nuevo: estado para selección local
  const [seleccionadas, setSeleccionadas] = useState(new Set());

  const toggleSeleccion = (fechaISO, franja) => {
    const key = `${fechaISO}_${franja}`;
    setSeleccionadas(prev => {
      const nuevo = new Set(prev);
      if (nuevo.has(key)) {
        nuevo.delete(key);
      } else {
        nuevo.add(key);
      }
      return nuevo;
    });
  };

  const BASE = 'http://localhost:3000';

  useEffect(() => {
    const year = monthRef.getFullYear();
    const month = String(monthRef.getMonth() + 1).padStart(2, '0');

    setLoading(true);
    Promise.all([
      fetch(`${BASE}/turnos`).then(r => r.ok ? r.json() : Promise.reject('turnos error')),
      fetch(`${BASE}/reservas?mes=${year}-${month}`).then(r => r.ok ? r.json() : Promise.reject('reservas error'))
    ])
      .then(([turnosData, reservasData]) => {
        setTurnos(turnosData);
        setReservas(reservasData);
      })
      .catch(err => {
        console.error('Error cargando datos:', err);
        Alert.alert('Error', 'No se pudieron cargar turnos o reservas. Revisa el backend.');
      })
      .finally(() => setLoading(false));
  }, [monthRef]);

  const addDays = (d, n) => {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
  };
  const formatISO = d => d.toISOString().slice(0, 10);

  const buildWeeksForMonth = (refDate) => {
    const firstDay = new Date(refDate.getFullYear(), refDate.getMonth(), 1);
    const lastDay = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0);

    const start = new Date(firstDay);
    const day = start.getDay();
    const diffToMonday = (day === 0 ? -6 : 1) - day;
    start.setDate(start.getDate() + diffToMonday);
    start.setHours(0,0,0,0);

    const weeks = [];
    let cursor = new Date(start);

    while (cursor <= lastDay) {
      const week = [];
      for (let i = 0; i < 5; i++) {
        week.push(addDays(cursor, i));
      }
      weeks.push(week);
      cursor = addDays(cursor, 7);
    }
    return weeks;
  };

  const weeks = buildWeeksForMonth(monthRef);

  if (loading) return (
    <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
      <ActivityIndicator size="large" />
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Horario mensual</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10 }}>
        <TouchableOpacity onPress={() => setMonthRef(new Date(monthRef.getFullYear(), monthRef.getMonth() - 1, 1))}><Text>◀️ Mes anterior</Text></TouchableOpacity>
        <Text style={styles.subtitulo}>{monthRef.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}</Text>
        <TouchableOpacity onPress={() => setMonthRef(new Date(monthRef.getFullYear(), monthRef.getMonth() + 1, 1))}><Text>Mes siguiente ▶️</Text></TouchableOpacity>
      </View>

      {weeks.map((week, wi) => {
        const firstDayOfMonth = new Date(monthRef.getFullYear(), monthRef.getMonth(), 1);
        const lastDayOfMonth = new Date(monthRef.getFullYear(), monthRef.getMonth() + 1, 0);

        const diasEnMes = week.filter(d => d >= firstDayOfMonth && d <= lastDayOfMonth);
        const titulo = diasEnMes.length > 0
          ? `Semana del ${diasEnMes[0].getDate()} al ${diasEnMes[diasEnMes.length - 1].getDate()}`
          : `Semana del ${week[0].getDate()} al ${week[4].getDate()}`;

        return (
          <View key={`week-${wi}`} style={styles.tabla}>
            <View style={styles.fila}>
              <View style={styles.celdaHora}></View>
              {dias.map((dia) => (
                <View key={dia} style={styles.celdaCabecera}>
                  <Text style={styles.textoCabecera}>{dia}</Text>
                </View>
              ))}
            </View>

            <View style={{ padding: 8, backgroundColor: '#fafafa', borderBottomWidth: 1, borderColor: '#eee' }}>
              <Text style={styles.weekTitle}>{titulo}</Text>
            </View>

            {franjas.map((franja) => (
              <View key={`${wi}-${franja}`} style={styles.fila}>
                <View style={styles.celdaHora}>
                  <Text style={styles.textoHora}>{franja}</Text>
                </View>

                {week.map((day) => {
                  const fechaISO = formatISO(day);
                  const inMonth = day.getMonth() === monthRef.getMonth();

                  const key = `${fechaISO}_${franja}`;
                  const isSelected = seleccionadas.has(key);

                  const cellStyles = [styles.celda];
                  if (isSelected) cellStyles.push(styles.celdaActiva);
                  else if (!inMonth) cellStyles.push(styles.celdaFueraMes);

                  return (
                    <TouchableOpacity
                      key={fechaISO + franja}
                      style={cellStyles}
                      onPress={() => toggleSeleccion(fechaISO, franja)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.diaNumero}>{day.getDate()}</Text>

                      <View style={styles.checkboxContainer}>
                        <View style={[
                          styles.checkboxBox,
                          isSelected && styles.checkboxBoxChecked
                        ]}>
                          {isSelected && <Text style={styles.checkmark}>✓</Text>}
                        </View>
                      </View>

                      <Text style={styles.textoCelda}>{isSelected ? nombreAlumno : ''}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        );
      })}
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
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 4, textAlign: 'center' },
  subtitulo: { fontSize: 16, textAlign: 'center', marginBottom: 10, fontWeight: '600' },
  tabla: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, overflow: 'hidden', marginVertical: 8 },
  fila: { flexDirection: 'row' },
  celdaHora: {
    width: 100,
    backgroundColor: '#e0e0e0',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoHora: { fontWeight: '600', fontSize: 12 },
  celdaCabecera: {
    flex: 1,
    backgroundColor: '#ddd',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  textoCabecera: { fontWeight: 'bold' },
  weekTitle: { fontWeight: '700' },
  celda: {
    flex: 1,
    paddingTop: 6,
    paddingBottom: 6,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: '#fff',
    minHeight: 64,
  },
  diaNumero: { position: 'absolute', left: 6, top: 4, fontSize: 11, color: '#333' },
  textoCelda: { fontSize: 12, marginTop: 12, fontWeight: '600', textAlign: 'center' },
  celdaActiva: { backgroundColor: '#c8f7c5' },
  celdaFueraMes: { backgroundColor: '#fafafa', opacity: 0.5 },
  checkboxContainer: {
    position: 'absolute',
    right: 6,
    top: 4,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderWidth: 1,
    borderColor: '#666',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 3,
  },
  checkboxBoxChecked: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 16,
    fontWeight: '700',
  },
});
