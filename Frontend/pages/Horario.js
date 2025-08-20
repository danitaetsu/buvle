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

  const [currentMonth, setCurrentMonth] = useState(new Date()); // 👉 mes que se está viendo
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

  const loadData = useCallback(
    async (date) => {
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

        const mapped = (jsonReservas.events || []).map((e) => {
          const inicioTurno = new Date(e.start);
          const isMine = String(e.id_alumno) === String(id_alumno);
          return {
            ...e,
            start: inicioTurno,
            end: new Date(e.end),
            title: e.title || "Reserva",
            isMine,
            isPast: inicioTurno <= today,
          };
        });

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
    if (
      date.getMonth() !== today.getMonth() ||
      date.getFullYear() !== today.getFullYear()
    ) {
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
        const reservasTurno = events.filter(
          (e) =>
            e.id_turno === turno.id_turno &&
            e.start.toDateString() === date.toDateString()
        );
        plazas.push({
          ...turno,
          ocupadas: reservasTurno.length,
          alumnos: reservasTurno.map((r) => r.title), // 👈 guardo nombres
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
      {/* Encabezado con flechas */}
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
        events={events}
        height={600}
        mode="month"
        weekStartsOn={1}
        locale="es"
        onPressCell={openDayModal}
        onPressEvent={(event) => openDayModal(event.start)}
        eventCellStyle={(event) => ({
          backgroundColor:
            currentMonth.getMonth() !== today.getMonth() ||
            currentMonth.getFullYear() !== today.getFullYear()
              ? "lightgray"
              : event.isPast
              ? "lightgray"
              : event.isMine
              ? "red"
              : "#c8f7c5",
        })}
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
              const tengoReserva = events.some(
                (e) =>
                  e.id_turno === t.id_turno &&
                  e.start.toDateString() === selectedDate.toDateString() &&
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
              style={[
                styles.botonReserva,
                { backgroundColor: "red", marginTop: 10 },
              ]}
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
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
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
