import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SectionList,
} from "react-native";

export default function Clases({ id_alumno }) {
  const baseUrl = "https://buvle-pruebas.onrender.com";

  const [loading, setLoading] = useState(true);
  const [secciones, setSecciones] = useState([]); // ← historial agrupado por mes
  const [clasesRestantes, setClasesRestantes] = useState(0);

  const ahora = new Date();

  const ymdLocal = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  // Últimos 12 meses (incluyendo el actual)
  const rangeStart = new Date(ahora.getFullYear(), ahora.getMonth() - 11, 1);
  const rangeEnd = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0);

  const loadData = useCallback(async () => {
    if (!id_alumno) {
      setSecciones([]);
      setClasesRestantes(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // 👉 1. Pedir contador al backend
      const resAlumno = await fetch(`${baseUrl}/alumno/${id_alumno}`);
      const jsonAlumno = await resAlumno.json();
      if (jsonAlumno.success) {
        setClasesRestantes(jsonAlumno.alumno.clases_disponibles);
      } else {
        throw new Error(jsonAlumno.message || "No se pudo obtener el alumno");
      }

      // 👉 2. Pedir reservas del rango
      const res = await fetch(
        `${baseUrl}/reservas-rango?from=${ymdLocal(rangeStart)}&to=${ymdLocal(
          rangeEnd
        )}`
      );
      const json = await res.json();

      // Filtrar solo las mías
      const mias = (json.events || [])
        .filter((e) => String(e.id_alumno) === String(id_alumno))
        .map((e) => ({ ...e, start: new Date(e.start), end: new Date(e.end) }));

      // Solo clases PASADAS para el historial
      const pasadas = mias
        .filter((e) => e.start <= ahora)
        .sort((a, b) => b.start - a.start);

      // Agrupar por mes-año
      const grupos = new Map();
      for (const e of pasadas) {
        const y = e.start.getFullYear();
        const m = e.start.getMonth();
        const key = `${y}-${String(m + 1).padStart(2, "0")}`;

        const label = new Intl.DateTimeFormat("es-ES", {
          month: "long",
          year: "numeric",
        }).format(new Date(y, m, 1));

        if (!grupos.has(key)) grupos.set(key, { title: label, data: [] });

        grupos.get(key).data.push({
          id: e.id,
          start: e.start,
          end: e.end,
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
        });
      }

      const sections = Array.from(grupos.entries())
        .sort(([a], [b]) => (a < b ? 1 : -1))
        .map(([, section]) => ({
          ...section,
          data: section.data.sort((x, y) => y.start - x.start),
          title:
            section.title.charAt(0).toUpperCase() + section.title.slice(1),
        }));

      setSecciones(sections);
    } catch (err) {
      console.error("❌ Error en Clases.js:", err);
      Alert.alert("Error", "No se pudieron cargar tus clases");
      setSecciones([]);
      setClasesRestantes(0);
    } finally {
      setLoading(false);
    }
  }, [id_alumno]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Tus clases</Text>

      {/* 🎯 Marcador de clases disponibles, tomado del backend */}
      <View style={styles.marcador}>
        <Text style={styles.marcadorTitulo}>Clases disponibles</Text>
        <Text
          style={[
            styles.marcadorNumero,
            clasesRestantes === 0 && { color: "#6366f1" },
          ]}
        >
          {clasesRestantes}
        </Text>
      </View>

      <Text style={styles.subtitulo}>Clases pasadas</Text>

      {secciones.length === 0 ? (
        <Text style={styles.text}>
          {id_alumno
            ? "Aún no tienes clases pasadas"
            : "No se recibió tu identificador. Vuelve desde el login o tu área personal."}
        </Text>
      ) : (
        <SectionList
          sections={secciones}
          keyExtractor={(item) => `${item.id}-${item.start.toISOString()}`}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={styles.mesHeader}>{title}</Text>
          )}
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
  titulo: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },

  marcador: {
    backgroundColor: "#f0f4ff",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  marcadorTitulo: { fontSize: 16, color: "#333", marginBottom: 4 },
  marcadorNumero: { fontSize: 40, fontWeight: "bold", color: "#6366f1" },

  subtitulo: { fontSize: 18, fontWeight: "bold", marginTop: 6, marginBottom: 8 },
  text: { fontSize: 16, textAlign: "center", marginTop: 16 },

  mesHeader: {
    fontSize: 17,
    fontWeight: "600",
    backgroundColor: "#f9f9f9",
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginTop: 12,
    borderRadius: 6,
  },

  claseItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  fecha: { fontSize: 16, fontWeight: "600" },
  horario: { fontSize: 14, color: "#555" },
});
