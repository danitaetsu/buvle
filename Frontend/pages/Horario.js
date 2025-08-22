import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Alert,
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
} from "react-native";
import { Calendar } from "react-native-big-calendar";

export default function Horario({ id_alumno }) {
  const baseUrl = "https://buvle-backend.onrender.com";

  const [allEvents, setAllEvents] = useState([]); // todas las reservas
  const [events, setEvents] = useState([]); // eventos que se pintan en el calendario
  const [turnos, setTurnos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [plazasDia, setPlazasDia] = useState([]);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const today = new Date();

  const franjas = [
    { hi: "12:00", hf: "14:00" },
    { hi: "17:00", hf: "19:00" },
    { hi: "19:00", hf: "21:00" },
  ];

  const ymdLocal = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const monthBounds = (date) => ({
    start: new Date(date.getFullYear(), date.getMonth(), 1),
    end: new Date(date.getFullYear(), date.getMonth() + 1, 0),
  });

  // 🔒 Días bloqueados
  const blockedDates = [
    { start: "2025-12-08", end: "2025-12-08" },
    { start: "2025-12-24", end: "2026-01-06" },
    { start: "2026-03-30", end: "2026-04-03" },
    { start: "2026-05-01", end: "2026-05-01" },
    { start: "2026-05-15", end: "2026-05-15" },
  ];

  const isBlockedDate = (date) => {
    const ymd = ymdLocal(date);
    return blockedDates.some((r) => ymd >= r.start && ymd <= r.end);
  };

  const loadData = useCallback(
    async (date) => {
      setLoading(true);
      const { start, end } = monthBounds(date);

      try {
        // Turnos
        const resTurnos = await fetch(`${baseUrl}/turnos`);
        const jsonTurnos = await resTurnos.json();
        setTurnos(jsonTurnos.turnos || []);

        // Reservas del rango
        const resReservas = await fetch(
          `${baseUrl}/reservas-rango?from=${ymdLocal(start)}&to=${ymdLocal(end)}`
        );
        const jsonReservas = await resReservas.json();

        // Mapear a eventos del calendario
        const mapped = (jsonReservas.events || []).map((e) => {
          const inicio = new Date(e.start);
          const fin = new Date(e.end);
          const isMine = Number(e.id_alumno) === Number(id_alumno);
          const evtId = e.id ?? e.id_reserva ?? `${e.id_turno}-${e.start}`;
          return {
            ...e,
            id: evtId,
            start: inicio,
            end: fin,
            title: e.title || "Reserva",
            isMine,
          };
        });

        // Orden por día -> MIS eventos primero -> hora -> id (estable)
        mapped.sort((a, b) => {
          const dayA = ymdLocal(a.start);
          const dayB = ymdLocal(b.start);
          if (dayA !== dayB) return dayA < dayB ? -1 : 1;
          if (a.isMine !== b.isMine) return a.isMine ? -1 : 1; // míos arriba
          if (a.start.getTime() !== b.start.getTime())
            return a.start.getTime() - b.start.getTime();
          return String(a.id).localeCompare(String(b.id));
        });

        setAllEvents(mapped);
        setEvents(mapped);
      } catch (err) {
        console.error("❌ Error en loadData:", err);
        Alert.alert("Error", "No se pudieron cargar los datos");
      } finally {
        setLoading(false);
      }
    },
    [id_alumno]
  );

  useEffect(() => {
    loadData(currentMonth);
  }, [loadData, currentMonth]);

  const openDayModal = (date) => {
    if (isBlockedDate(date)) {
      Alert.alert("Día no disponible", "Este día está bloqueado");
      return;
    }

    setSelectedDate(date);

    const dia = date.getDay() === 0 ? 7 : date.getDay();
    const plazas = [];

    for (const fr of franjas) {
      const turno = turnos.find(
        (t) => t.dia === dia && t.hora_inicio === fr.hi && t.hora_fin === fr.hf
      );
      if (turno) {
        const reservasTurno = allEvents.filter(
          (e) =>
            e.id_turno === turno.id_turno &&
            ymdLocal(e.start) === ymdLocal(date)
        );
        plazas.push({
          ...turno,
          ocupadas: reservasTurno.length,
          alumnos: reservasTurno.map((r) => r.title),
        });
      }
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
          fecha_clase: ymdLocal(selectedDate),
        }),
      });
      const json = await res.json();
      if (json.success) {
        Alert.alert("Éxito", "Reserva creada con éxito");
        setModalVisible(false);
        loadData(selectedDate);
      } else {
        Alert.alert("Error", json.message || "No se pudo reservar");
      }
    } catch (err) {
      console.error("❌ Error en reservarTurno:", err);
      Alert.alert("Error", "Fallo de conexión");
    }
  };

  const cancelarTurno = async (id_turno) => {
    try {
      const res = await fetch(`${baseUrl}/cancelar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_alumno,
          id_turno,
          fecha_clase: ymdLocal(selectedDate),
        }),
      });
      const json = await res.json();
      if (json.success) {
        Alert.alert("Éxito", "Reserva cancelada correctamente");
        setModalVisible(false);
        loadData(selectedDate);
      } else {
        Alert.alert("Error", json.message || "No se pudo cancelar");
      }
    } catch (err) {
      console.error("❌ Error en cancelarTurno:", err);
      Alert.alert("Error", "Fallo de conexión");
    }
  };

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" />;
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Encabezado */}
      <View style={styles.header}>
        <Pressable
          onPress={() =>
            setCurrentMonth(
              new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
            )
          }
        >
          <Text style={styles.arrow}>◀</Text>
        </Pressable>

        <Text style={styles.monthTitle}>
          {currentMonth.toLocaleDateString("es-ES", {
            month: "long",
            year: "numeric",
          })}
        </Text>

        <Pressable
          onPress={() =>
            setCurrentMonth(
              new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
            )
          }
        >
          <Text style={styles.arrow}>▶</Text>
        </Pressable>
      </View>

      <Calendar
        key={`${currentMonth.getFullYear()}-${currentMonth.getMonth()}-${events.length}`}
        date={new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)}
        events={events}
        height={600}
        mode="month"
        weekStartsOn={1}
        locale="es"
        onPressCell={openDayModal}
        onPressEvent={(event) => openDayModal(event.start)}
        // 👉 Colores: mis eventos rojos, otros verdes
        eventCellStyle={(event) => ({
          backgroundColor: event.isMine ? "red" : "green",
        })}
        // 👉 Respetar nuestro orden
        sortedMonthView={false}
        isEventOrderingEnabled={false}
        dayHeaderStyle={(date) => {
          const day = date.getDay();
          if (day === 0 || day === 6) {
            return { opacity: 0.5, fontSize: 10 };
          }
          return {};
        }}
        calendarCellStyle={(date) => {
          if (isBlockedDate(date)) {
            return { backgroundColor: "#b0b0b0", opacity: 0.6 }; // bloqueado
          }
          const day = date.getDay();
          if (day === 0 || day === 6) {
            return { backgroundColor: "#d6d6d6", opacity: 0.8 };
          }
          return { backgroundColor: "#fff" };
        }}
      />

      {/* Modal reservas */}
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

            {plazasDia.length === 0 && (
              <Text>No hay turnos disponibles este día</Text>
            )}

            {plazasDia.map((t) => {
              const tengoReserva = allEvents.some(
                (e) =>
                  e.id_turno === t.id_turno &&
                  ymdLocal(e.start) === ymdLocal(selectedDate) &&
                  e.isMine
              );

              const turnoDate = new Date(
                `${ymdLocal(selectedDate)}T${t.hora_inicio}:00`
              );
              const turnoPasado = turnoDate <= today;

              return (
                <View key={t.id_turno} style={styles.turnoRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.turnoText}>
                      {t.hora_inicio} - {t.hora_fin} ({t.ocupadas}/
                      {t.max_alumnos} ocupadas)
                    </Text>
                    {t.alumnos && t.alumnos.length > 0 && (
                      <Text style={{ fontSize: 14, color: "#333", marginLeft: 5 }}>
                        {t.alumnos.join(", ")}
                      </Text>
                    )}
                  </View>

                  {tengoReserva ? (
                    <Pressable
                      style={[
                        styles.botonReserva,
                        { backgroundColor: turnoPasado ? "gray" : "orange" },
                      ]}
                      disabled={turnoPasado}
                      onPress={() => cancelarTurno(t.id_turno)}
                    >
                      <Text style={styles.botonText}>Cancelar</Text>
                    </Pressable>
                  ) : (
                    <Pressable
                      style={[
                        styles.botonReserva,
                        (t.ocupadas >= t.max_alumnos || turnoPasado) && {
                          backgroundColor: "gray",
                        },
                      ]}
                      disabled={t.ocupadas >= t.max_alumnos || turnoPasado}
                      onPress={() => reservarTurno(t.id_turno)}
                    >
                      <Text style={styles.botonText}>Reservar</Text>
                    </Pressable>
                  )}
                </View>
              );
            })}

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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 10,
  },
  monthTitle: { fontSize: 18, fontWeight: "bold", textTransform: "capitalize" },
  arrow: { fontSize: 24, color: "#333" },

  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "white",
    borderRadius: 8,
    padding: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 15 },
  turnoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 5,
  },
  turnoText: { fontSize: 16 },
  botonReserva: {
    backgroundColor: "green",
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  botonText: { color: "white", fontWeight: "bold" },
});
