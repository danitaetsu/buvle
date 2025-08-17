import React, { useCallback, useEffect, useState } from "react";
import { View, Text, Alert, ActivityIndicator, Modal, Pressable, StyleSheet } from "react-native";
import { Calendar } from "react-native-big-calendar";

export default function Horario({ id_alumno }) {
  const baseUrl = "https://buvle-backend.onrender.com";

  const [events, setEvents] = useState([]);
  const [turnos, setTurnos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [plazasDia, setPlazasDia] = useState([]);

  const franjas = [
    { hi: "12:00", hf: "14:00" },
    { hi: "17:00", hf: "19:00" },
    { hi: "19:00", hf: "21:00" }
  ];

  // YYYY-MM-DD sin UTC (evita desfases)
  const ymdLocal = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const monthBounds = (date) => ({
    start: new Date(date.getFullYear(), date.getMonth(), 1),
    end: new Date(date.getFullYear(), date.getMonth() + 1, 0)
  });

  const loadData = useCallback(async (date) => {
    setLoading(true);
    const { start, end } = monthBounds(date);

    try {
      const resTurnos = await fetch(`${baseUrl}/turnos`);
      const jsonTurnos = await resTurnos.json();
      setTurnos(jsonTurnos.turnos || []);

      const resReservas = await fetch(
        `${baseUrl}/reservas-rango?from=${ymdLocal(start)}&to=${ymdLocal(end)}`
      );
      const jsonReservas = await resReservas.json();

      const mapped = (jsonReservas.events || []).map((e) => ({
        ...e,
        start: new Date(e.start),
        end: new Date(e.end),
        title: e.title || "Reserva",
        isMine: e.id_alumno === id_alumno   // 🔴 aquí distinguimos mis reservas
      }));

      setEvents(mapped);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "No se pudieron cargar los datos");
    } finally {
      setLoading(false);
    }
  }, [id_alumno]);

  useEffect(() => {
    loadData(new Date());
  }, [loadData]);

  // Cuando se cambia de mes en el calendario
  const onChangeDate = ({ start }) => {
    loadData(start);
  };

  const openDayModal = async (date) => {
    setSelectedDate(date);
    const dia = date.getDay() === 0 ? 7 : date.getDay();
    const plazas = [];

    try {
      const res = await fetch(
        `${baseUrl}/reservas-rango?from=${ymdLocal(date)}&to=${ymdLocal(date)}`
      );
      const json = await res.json();

      for (const fr of franjas) {
        const turno = turnos.find(
          (t) => t.dia === dia && t.hora_inicio === fr.hi && t.hora_fin === fr.hf
        );
        if (turno) {
          const reservasTurno = (json.events || []).filter(e => e.id_turno === turno.id_turno);
          plazas.push({
            ...turno,
            ocupadas: reservasTurno.length
          });
        }
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "No se pudieron cargar las plazas del día");
    }

    setPlazasDia(plazas);
    setModalVisible(true);
  };

  const reservarTurno = async (id_turno) => {
    try {
      const res = await fetch(`${baseUrl}/reservar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_alumno,
          id_turno,
          fecha_clase: ymdLocal(selectedDate)
        })
      });
      const json = await res.json();
      if (json.success) {
        Alert.alert("Éxito", "Reserva creada");
        setModalVisible(false);
        loadData(selectedDate);
      } else {
        Alert.alert("Error", json.message || "No se pudo reservar");
      }
    } catch (err) {
      Alert.alert("Error", "Fallo de conexión");
    }
  };

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" />;
  }

  return (
    <View style={{ flex: 1 }}>
      <Text style={{ textAlign: "center", fontWeight: "bold", fontSize: 18, marginVertical: 8 }}>
        Horario mensual
      </Text>

      <Calendar
        events={events}
        height={600}
        mode="month"
        weekStartsOn={1}
        locale="es"
        onPressCell={openDayModal}
        onChangeDate={onChangeDate}
        // 🔴 rojo = mis reservas, 🟢 verde = reservas de otros
        eventCellStyle={(event) => ({
          backgroundColor: event.isMine ? "#ff4d4f" : "#c8f7c5"
        })}
      />

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Turnos para {selectedDate ? ymdLocal(selectedDate) : ""}
            </Text>

            {plazasDia.length === 0 && <Text>No hay turnos disponibles este día</Text>}

            {plazasDia.map((t) => (
              <View key={t.id_turno} style={styles.turnoRow}>
                <Text style={styles.turnoText}>
                  {t.hora_inicio} - {t.hora_fin} ({t.ocupadas}/{t.max_alumnos} ocupadas)
                </Text>
                <Pressable
                  style={[
                    styles.botonReserva,
                    t.ocupadas >= t.max_alumnos && { backgroundColor: "gray" }
                  ]}
                  disabled={t.ocupadas >= t.max_alumnos}
                  onPress={() => reservarTurno(t.id_turno)}
                >
                  <Text style={styles.botonText}>Reservar</Text>
                </Pressable>
              </View>
            ))}

            <Pressable
              style={[styles.botonReserva, { backgroundColor: "red", marginTop: 10 }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.botonText}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)"
  },
  modalContent: {
    width: "85%",
    backgroundColor: "white",
    borderRadius: 8,
    padding: 20
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15
  },
  turnoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 5
  },
  turnoText: {
    fontSize: 16
  },
  botonReserva: {
    backgroundColor: "green",
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 5
  },
  botonText: {
    color: "white",
    fontWeight: "bold"
  }
});
