import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator
} from 'react-native';

/**
 * Horario.js
 * - Mantiene diseño original (Lunes-Viernes, franjas).
 * - Multiplica la "semana" tantas veces como haga falta para cubrir el mes.
 * - Integra con backend: GET /turnos, GET /reservas?mes=YYYY-MM, POST /reservas, DELETE /reservas/:id
 *
 * Props opcionales:
 *  - id_alumno (number)   -> id del usuario (si no se pasa, por compatibilidad: 1)
 *  - nombreAlumno (string)-> nombre para mostrar en celdas propias (si no se pasa, 'Ana Garcia')
 */

export default function Horario({ id_alumno = 1, nombreAlumno = 'Ana Garcia' }) {
  // Mantenemos los días y franjas como en tu versión original
  const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  const franjas = ['10:00 - 12:00', '12:00 - 14:00', '17:00 - 19:00', '19:00 - 21:00'];

  const [monthRef, setMonthRef] = useState(new Date()); // mes mostrado
  const [turnos, setTurnos] = useState([]); // desde DB: { id_turno, dia (1-5), hora_inicio, hora_fin, max_alumnos }
  const [reservas, setReservas] = useState([]); // desde DB: { id_reserva, id_alumno, id_turno, fecha_clase, nombre_alumno (opcional) }
  const [loading, setLoading] = useState(true);

  const BASE = 'http://localhost:3000'; // ajusta a tu URL (Render / Supabase proxy)

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

  // util fechas
  const addDays = (d, n) => {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
  };
  const formatISO = d => d.toISOString().slice(0, 10);

  // Construye semanas "perfectas" (lunes-viernes) que cubran el mes:
  const buildWeeksForMonth = (refDate) => {
    const firstDay = new Date(refDate.getFullYear(), refDate.getMonth(), 1);
    const lastDay = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0);

    // calcular lunes en o antes del primer día del mes
    const start = new Date(firstDay);
    const day = start.getDay(); // 0 dom .. 6 sab
    const diffToMonday = (day === 0 ? -6 : 1) - day; // mueve al lunes anterior/igual
    start.setDate(start.getDate() + diffToMonday);
    start.setHours(0,0,0,0);

    const weeks = [];
    let cursor = new Date(start);

    // iterar hasta cubrir el último día del mes (incluye semanas parcialmente fuera del mes)
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

  // Buscar turno en DB para una fecha y franja concreta
  const findTurnoFor = (dateObj, franja) => {
    const weekday = dateObj.getDay(); // 1..5 Monday..Friday (Sunday 0)
    if (weekday < 1 || weekday > 5) return null;
    const [hi, hf] = franja.split(' - ').map(s => s.trim());
    // turnos tiene campo dia (1..5), hora_inicio, hora_fin
    return turnos.find(t => t.dia === weekday && t.hora_inicio === hi && t.hora_fin === hf) || null;
  };

  // Buscar reserva por fecha y turno
  const findReserva = (fechaISO, id_turno) => reservas.find(r => r.fecha_clase === fechaISO && r.id_turno === id_turno);

  // acciones: crear / borrar reserva
  const crearReserva = async (id_turno, fecha_clase) => {
    try {
      const res = await fetch(`${BASE}/reservas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_alumno, id_turno, fecha_clase })
      });
      if (!res.ok) {
        const err = await res.json().catch(()=>({ message: 'Error' }));
        Alert.alert('Error', err.message || 'No se pudo crear la reserva');
        return;
      }
      const nueva = await res.json();
      // backend idealmente devuelve la reserva con id_reserva y nombre_alumno
      setReservas(prev => [...prev, nueva]);
    } catch (err) {
      console.error('crearReserva', err);
      Alert.alert('Error', 'Fallo creando reserva');
    }
  };

  const borrarReserva = async (id_reserva) => {
    try {
      const res = await fetch(`${BASE}/reservas/${id_reserva}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(()=>({ message: 'Error' }));
        Alert.alert('Error', err.message || 'No se pudo cancelar');
        return;
      }
      setReservas(prev => prev.filter(r => r.id_reserva !== id_reserva));
    } catch (err) {
      console.error('borrarReserva', err);
      Alert.alert('Error', 'Fallo cancelando reserva');
    }
  };

  const onPressCell = (dateObj, franja) => {
    const fechaISO = formatISO(dateObj);
    const turno = findTurnoFor(dateObj, franja);
    if (!turno) {
      Alert.alert('No disponible', 'No hay turno programado para esa franja y día.');
      return;
    }
    const existente = findReserva(fechaISO, turno.id_turno);

    if (existente) {
      if (existente.id_alumno === id_alumno) {
        // si es tu reserva -> confirmar cancelación (y comprobar fecha/hora no pasada opcional en backend)
        Alert.alert('Cancelar clase', '¿Quieres cancelar esta clase?', [
          { text: 'No', style: 'cancel' },
          { text: 'Sí', onPress: () => borrarReserva(existente.id_reserva) }
        ]);
      } else {
        Alert.alert('Ocupado', 'Esta franja ya está reservada por otra persona.');
      }
    } else {
      // confirmar creación
      Alert.alert('Confirmar reserva', `¿Reservar el ${fechaISO} (${franja})?`, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'OK', onPress: () => crearReserva(turno.id_turno, fechaISO) }
      ]);
    }
  };

  // Navegación meses
  const prevMonth = () => setMonthRef(new Date(monthRef.getFullYear(), monthRef.getMonth() - 1, 1));
  const nextMonth = () => setMonthRef(new Date(monthRef.getFullYear(), monthRef.getMonth() + 1, 1));

  if (loading) return (
    <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
      <ActivityIndicator size="large" />
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Horario mensual</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10 }}>
        <TouchableOpacity onPress={prevMonth}><Text>◀️ Mes anterior</Text></TouchableOpacity>
        <Text style={styles.subtitulo}>{monthRef.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}</Text>
        <TouchableOpacity onPress={nextMonth}><Text>Mes siguiente ▶️</Text></TouchableOpacity>
      </View>

      {/* Repetimos la "tabla semanal" para cada semana del mes */}
      {weeks.map((week, wi) => {
        // calcular rango visible dentro del mes (para el título)
        const firstDayOfMonth = new Date(monthRef.getFullYear(), monthRef.getMonth(), 1);
        const lastDayOfMonth = new Date(monthRef.getFullYear(), monthRef.getMonth() + 1, 0);

        const diasEnMes = week.filter(d => d >= firstDayOfMonth && d <= lastDayOfMonth);
        const titulo = diasEnMes.length > 0
          ? `Semana del ${diasEnMes[0].getDate()} al ${diasEnMes[diasEnMes.length - 1].getDate()}`
          : `Semana del ${week[0].getDate()} al ${week[4].getDate()}`; // por si acaso

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
                  const turno = findTurnoFor(day, franja);
                  const existente = turno ? findReserva(fechaISO, turno.id_turno) : null;
                  const reservedByMe = existente && existente.id_alumno === id_alumno;
                  const texto = existente ? (reservedByMe ? nombreAlumno : 'Reservado') : '';

                  // estilos
                  const cellStyles = [styles.celda];
                  if (!inMonth) cellStyles.push(styles.celdaFueraMes);
                  else if (!turno) cellStyles.push(styles.celdaNoTurno);
                  else if (reservedByMe) cellStyles.push(styles.celdaActiva);
                  else if (existente) cellStyles.push(styles.celdaOcupada);

                  // deshabilitar si fuera mes o no hay turno
                  const disabled = !inMonth || !turno;

                  return (
                    <TouchableOpacity
                      key={fechaISO + franja}
                      style={cellStyles}
                      onPress={() => onPressCell(day, franja)}
                      disabled={disabled}
                    >
                      <Text style={styles.diaNumero}>{day.getDate()}</Text>
                      <Text style={styles.textoCelda}>{texto}</Text>
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

// Estilos inspirados en tu versión original
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
  celdaOcupada: { backgroundColor: '#f7d6d6' },
  celdaNoTurno: { backgroundColor: '#f2f2f2' },
  celdaFueraMes: { backgroundColor: '#fafafa', opacity: 0.5 },
});
