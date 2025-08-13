// Horario.js
import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator
} from 'react-native';

// Props:
// - id_alumno: obligatorio (del login). Para pruebas puedes dejar 1.
// - baseUrl: opcional; por defecto 'http://localhost:3000'
export default function Horario({ id_alumno = 1, baseUrl = 'http://localhost:3000' }) {
  const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  // Mantengo tu gráfica con 4 franjas. Ojo: en tu BD NO existe 10-12 -> esa franja quedará como "no reservable".
  const franjas = ['10:00 - 12:00', '12:00 - 14:00', '17:00 - 19:00', '19:00 - 21:00'];

  const [monthRef, setMonthRef] = useState(new Date());
  const [turnos, setTurnos] = useState([]);              // {id_turno,dia,hora_inicio,hora_fin,...}
  const [reservas, setReservas] = useState([]);          // {id_reserva,fecha_clase,id_turno,nombre}
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);               // evita dobles taps al reservar

  // Mapa rápido: clave `${dia}-${hora_inicio}-${hora_fin}` -> id_turno
  const turnosLookup = useMemo(() => {
    const m = new Map();
    for (const t of turnos) {
      m.set(`${t.dia}-${t.hora_inicio}-${t.hora_fin}`, t.id_turno);
    }
    return m;
  }, [turnos]);

  // Aux: pasar "Lunes..Viernes" a 1..5 como en BD
  const jsDayToDBDia = (jsDate) => {
    const d = jsDate.getDay(); // 0..6 (0=Domingo)
    return d === 0 ? 7 : d;    // 1..7 (Lunes=1,…,Domingo=7)
  };

  // Aux: de franja "17:00 - 19:00" -> {hi:'17:00', hf:'19:00'}
  const parseFranja = (franja) => {
    const [hi, hf] = franja.split(' - ').map(s => s.trim());
    return { hi, hf };
  };

  // Devuelve id_turno o null si no existe en BD
  const getTurnoId = (dayDate, franja) => {
    const dbDia = jsDayToDBDia(dayDate);
    if (dbDia < 1 || dbDia > 5) return null; // Solo lunes-viernes en tu BD
    const { hi, hf } = parseFranja(franja);
    const key = `${dbDia}-${hi}-${hf}`;
    return turnosLookup.get(key) ?? null;
  };

  const formatISO = (d) => {
    // YYYY-MM-DD (ojo con husos; para calendario mensual nos vale)
    const z = new Date(d);
    const yyyy = z.getFullYear();
    const mm = String(z.getMonth() + 1).padStart(2, '0');
    const dd = String(z.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Construye semanas (solo lunes-viernes)
  const addDays = (d, n) => {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
  };
  const buildWeeksForMonth = (refDate) => {
    const firstDay = new Date(refDate.getFullYear(), refDate.getMonth(), 1);
    const lastDay  = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0);

    const start = new Date(firstDay);
    const day = start.getDay(); // 0..6
    const diffToMonday = (day === 0 ? -6 : 1) - day;
    start.setDate(start.getDate() + diffToMonday);
    start.setHours(0,0,0,0);

    const weeks = [];
    let cursor = new Date(start);

    while (cursor <= lastDay) {
      const week = [];
      for (let i = 0; i < 5; i++) {
        week.push(addDays(cursor, i)); // Lunes..Viernes
      }
      weeks.push(week);
      cursor = addDays(cursor, 7);
    }
    return weeks;
  };

  const weeks = useMemo(() => buildWeeksForMonth(monthRef), [monthRef]);

  // Carga turnos + reservas del mes
  const fetchData = async () => {
    const year = monthRef.getFullYear();
    const month = String(monthRef.getMonth() + 1).padStart(2, '0');
    setLoading(true);
    try {
      const [tRes, rRes] = await Promise.all([
        fetch(`${baseUrl}/turnos`),
        fetch(`${baseUrl}/reservas?mes=${year}-${month}`)
      ]);
      if (!tRes.ok) throw new Error('Error turnos');
      if (!rRes.ok) throw new Error('Error reservas');
      const tJson = await tRes.json();
      const rJson = await rRes.json();
      setTurnos(tJson.turnos || []);            // backend devuelve { success, turnos }
      setReservas(rJson.reservas || []);        // backend devuelve { success, reservas }
    } catch (err) {
      console.error('Error cargando datos:', err);
      Alert.alert('Error', 'No se pudieron cargar turnos o reservas. Revisa el backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, [monthRef]);

  // Reservar en una celda
  const onPressCell = (dayDate, franja) => {
    const fechaISO = formatISO(dayDate);
    const turnoId = getTurnoId(dayDate, franja);

    if (!turnoId) {
      Alert.alert('No disponible', 'Esta franja no es reservable según la configuración de turnos.');
      return;
    }

    Alert.alert(
      'Reserva',
      `¿Deseas hacer una reserva para el ${fechaISO} en la franja ${franja}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'OK',
          onPress: async () => {
            if (busy) return;
            setBusy(true);
            try {
              const resp = await fetch(`${baseUrl}/reservar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  id_alumno,
                  id_turno: turnoId,
                  fecha_clase: fechaISO
                })
              });
              const json = await resp.json();
              if (!resp.ok || json.success === false) {
                throw new Error(json.message || 'No se pudo crear la reserva');
              }
              // refrescar reservas del mes
              await fetchData();
              Alert.alert('OK', 'Reserva creada correctamente');
            } catch (e) {
              console.error(e);
              Alert.alert('Error', e.message || 'No se pudo crear la reserva');
            } finally {
              setBusy(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

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
        const lastDayOfMonth  = new Date(monthRef.getFullYear(), monthRef.getMonth() + 1, 0);
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

                  // ¿Qué turno corresponde a esta celda?
                  const turnoId = getTurnoId(day, franja);

                  // Reservas que caen en esta celda (misma fecha + mismo turno)
                  const reservasCelda = reservas.filter(
                    r => r.fecha_clase === fechaISO && r.id_turno === turnoId
                  );

                  const isDisabled = !inMonth || !turnoId; // fuera de mes o franja sin turno en BD

                  return (
                    <TouchableOpacity
                      key={fechaISO + franja}
                      style={[
                        styles.celda,
                        !inMonth && styles.celdaFueraMes,
                        isDisabled && styles.celdaDisabled
                      ]}
                      onPress={() => !isDisabled && onPressCell(day, franja)}
                      activeOpacity={isDisabled ? 1 : 0.8}
                    >
                      <Text style={styles.diaNumero}>{day.getDate()}</Text>

                      {/* Lista de nombres reservados en esta celda */}
                      {reservasCelda.length > 0 ? (
                        <View style={{ marginTop: 16, alignItems: 'center' }}>
                          {reservasCelda.map(r => (
                            <Text key={r.id_reserva} style={styles.textoCelda}>
                              {r.nombre}
                            </Text>
                          ))}
                        </View>
                      ) : (
                        <Text style={[styles.textoCelda, { opacity: 0.3, marginTop: 16 }]}>
                          {isDisabled ? '' : '— libre —'}
                        </Text>
                      )}
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
    width: 110,
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
  textoCelda: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  celdaFueraMes: { backgroundColor: '#fafafa', opacity: 0.5 },
  celdaDisabled: { backgroundColor: '#f7f7f7' },
});
