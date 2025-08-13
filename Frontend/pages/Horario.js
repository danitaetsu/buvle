import React, { useCallback, useEffect, useState } from "react";
import { View, Text, Alert, ActivityIndicator } from "react-native";
import { Calendar } from "react-native-big-calendar";

export default function Horario({ id_alumno = 1, baseUrl }) {
  const [events, setEvents] = useState([]);
  const [turnos, setTurnos] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = new Date();

  const getWeekRange = (date) => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return [start, end];
  };

  const ymd = (d) => d.toISOString().split("T")[0];

  const fetchTurnos = async () => {
    const res = await fetch(`${baseUrl}/turnos`);
    const json = await res.json();
    return json.turnos || [];
  };

  const fetchReservas = async (start, end) => {
    const res = await fetch(`${baseUrl}/reservas-rango?from=${ymd(start)}&to=${ymd(end)}`);
    const json = await res.json();
    return (json.events || []).map(e => ({
      ...e,
      start: new Date(e.start),
      end: new Date(e.end)
    }));
  };

  const loadData = async (date) => {
    setLoading(true);
    const [start, end] = getWeekRange(date);
    try {
      const [t, e] = await Promise.all([fetchTurnos(), fetchReservas(start, end)]);
      setTurnos(t);
      setEvents(e);
    } catch (err) {
      Alert.alert("Error", "No se pudieron cargar datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(today);
  }, []);

  const getTurnoId = (date) => {
    const dia = date.getDay() === 0 ? 7 : date.getDay();
    const hora = date.toTimeString().slice(0,5);
    const turno = turnos.find(t => t.dia === dia && t.hora_inicio === hora);
    return turno ? turno.id_turno : null;
  };

  const onPressCell = (date) => {
    const id_turno = getTurnoId(date);
    if (!id_turno) return;

    Alert.alert(
      "Reserva",
      `¿Deseas reservar para ${ymd(date)} a las ${date.toTimeString().slice(0,5)}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "OK",
          onPress: async () => {
            try {
              const res = await fetch(`${baseUrl}/reservar`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  id_alumno,
                  id_turno,
                  fecha_clase: ymd(date)
                })
              });
              const json = await res.json();
              if (json.success) {
                loadData(date);
              } else {
                Alert.alert("Error", json.message || "No se pudo reservar");
              }
            } catch {
              Alert.alert("Error", "No se pudo conectar al servidor");
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" />;
  }

  return (
    <View style={{ flex: 1 }}>
      <Calendar
        events={events}
        height={600}
        mode="week"
        weekStartsOn={1}
        minHour={12}
        maxHour={21}
        onPressCell={onPressCell}
        eventCellStyle={{ backgroundColor: "#c8f7c5" }}
        locale="es"
      />
    </View>
  );
}
