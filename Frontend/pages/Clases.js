import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Alert, FlatList } from "react-native";

export default function Clases({ id_alumno, cupoMensual = 4 }) {
  const baseUrl = "https://buvle-backend.onrender.com";

  const [loading, setLoading] = useState(true);
  const [clasesPasadas, setClasesPasadas] = useState([]);
  const [clasesRestantes, setClasesRestantes] = useState(cupoMensual);

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

  const loadData = useCallback(async () => {
    const ahora = new Date(); // recálculo cada carga
    setLoading(true);

    // Si no llega id_alumno, mostramos un mensaje y no colgamos el spinner
    if (!id_alumno) {
      setClasesPasadas([]);
      setClasesRestantes(cupoMensual);
      setLoading(false);
      return;
    }

    const { start, end } = monthBounds(new Date());

    try {
      const res = await fetch(
        `${baseUrl}/reservas-rango?from=${ymdLocal(start)}&to=${ymdLocal(end)}`
      );
      const json = await res.json();

      // Mis reservas del mes
      const miasMes = (json.events || []).filter(
        (e) => String(e.id_alumno) === String(id_alumno)
      );

      // Mapear fechas y clasificar pasadas
      const mapped = miasMes.map((e) => {
        const inicio = new Date(e.start);
        const fin = new Date(e.end);
        return { ...e, start: inicio, end: fin, isPast: inicio <= ahora };
      });

      // Pasadas ordenadas (más recientes primero)
      const pasadas = mapped
        .filter((e) => e.isPast)
        .sort((a, b) => b.start - a.start)
        .map((e) => ({
          id: e.id,
          fechaLarga: e.start.toLocaleDateString("es-ES", {
            weekday: "long",
            day: "numeric",
            month: "long",
          }),
          horario: `${e.start.toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
          })} - ${e.end.toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
          })}`,
        }));

      setClasesPasadas(pasadas);

      // Restantes (aprox) = cupoMensual - reservas del mes (vigentes o pasadas)
      const usadasEsteMes = miasMes.length;
      setClasesRestantes(Math.max(0, cupoMensual - usadasEsteMes));
    } catch (err) {
      console.error("❌ Error en Clases.js:", err);
      Alert.alert("Error", "No se pudieron cargar tus clases");
      setClasesPasadas([]);
      setClasesRestantes(cupoMensual);
    } finally {
      setLoading(false);
    }
  }, [id_alumno, cupoMensual]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Tus clases</Text>
      <Text style={styles.disponibles}>Te quedan {clasesRestantes} clases este mes</Text>

      <Text style={styles.subtitulo}>Clases pasadas (este mes)</Text>

      {clasesPasadas.length === 0 ? (
        <Text style={styles.text}>
          {id_alumno
            ? "Aún no tienes clases pasadas este mes"
            : "No se recibió tu identificador. Vuelve desde el login o tu área personal."}
        </Text>
      ) : (
        <FlatList
          data={clasesPasadas}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.claseItem}>
              <Text style={styles.fecha}>{item.fechaLarga}</Text>
              <Text style={styles.horario}>{item.horario}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  titulo: { fontSize: 22, fontWeight: "bold", marginBottom: 8, textAlign: "center" },
  disponibles: { fontSize: 16, marginBottom: 16, textAlign: "center", color: "green" },
  subtitulo: { fontSize: 18, fontWeight: "bold", marginTop: 6, marginBottom: 8 },
  text: { fontSize: 16, textAlign: "center", marginTop: 16 },
  claseItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#eee" },
  fecha: { fontSize: 16, fontWeight: "600" },
  horario: { fontSize: 14, color: "#555" },
});
