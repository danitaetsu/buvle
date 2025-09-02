import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { StripeProvider, useStripe } from "@stripe/stripe-react-native";

// --- Configuración ---
const PUBLISHABLE_KEY = "pk_live_51Q2sLs04VOrKio1OOc0cM0yNNrMAFuOqRIuM4Vrh8QqhqSdyNUB8fPj5jVdZauiOjyAA8pWxFMtvdarnzPeHic2m00IiftIRS1";
const API_URL = "https://buvle-backend.onrender.com";

// --- Pantalla de pagos ---
const PagosScreen = ({ idAlumno, tipoPago }) => {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);

  // Estados de negocio
  const [isLoading, setIsLoading] = useState(true);
  const [mesesPagados, setMesesPagados] = useState([]);
  const [mesMatricula, setMesMatricula] = useState(null);
  const [haPagadoMatriculaAnual, setHaPagadoMatriculaAnual] = useState(false);
  const [error, setError] = useState("");

  // 🔑 Función para cargar datos de pagos
  const fetchData = useCallback(async () => {
    if (!idAlumno) return;
    setIsLoading(true);
    setError("");
    try {
      const anioActual = new Date().getFullYear();

      const [resMeses, resAlumno, resMatricula] = await Promise.all([
        fetch(`${API_URL}/meses-pagados/${idAlumno}`),
        fetch(`${API_URL}/alumno/${idAlumno}`),
        fetch(`${API_URL}/matricula-pagada/${idAlumno}/${anioActual}`),
      ]);

      if (!resMeses.ok || !resAlumno.ok || !resMatricula.ok) {
        throw new Error("Error al cargar los datos del servidor.");
      }

      const dataMeses = await resMeses.json();
      const dataAlumno = await resAlumno.json();
      const dataMatricula = await resMatricula.json();

      setMesesPagados(dataMeses);
      if (dataAlumno.success) {
        setMesMatricula(dataAlumno.alumno.mes_matricula);
      }
      setHaPagadoMatriculaAnual(dataMatricula.pagada);
    } catch (err) {
      console.error("Error al cargar datos de pago:", err);
      setError("No se pudieron cargar los datos de pago. Inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  }, [idAlumno]);

  // Cargar datos al inicio
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Lógica de negocio ---
  const hoy = new Date();
  const anioActual = hoy.getFullYear();
  const mesActualNumero = hoy.getMonth() + 1;
  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const esMesDeMatricula = mesMatricula === mesActualNumero;
  const matriculaPendiente = esMesDeMatricula && !haPagadoMatriculaAnual;

  const mesActual = { anio: anioActual, mes: mesActualNumero };
  const fechaSiguiente = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1);
  const mesSiguiente = { anio: fechaSiguiente.getFullYear(), mes: fechaSiguiente.getMonth() + 1 };

  const haPagadoMesActual = mesesPagados.some(m => m.anio === mesActual.anio && m.mes === mesActual.mes);
  const haPagadoMesSiguiente = mesesPagados.some(m => m.anio === mesSiguiente.anio && m.mes === mesSiguiente.mes);

  // --- Pago nativo ---
  const handlePayment = async (paymentType, paymentData) => {
    setLoading(true);
    setError("");

    try {
      // 1. Crear el PaymentIntent en backend
      let endpoint = "";
      let body = {};

      if (paymentType === "matricula") {
        endpoint = "/create-matricula-payment-intent";
        body = { idAlumno, anio: paymentData.anio };
      } else {
        endpoint = "/create-payment-intent";
        body = { idAlumno, anio: paymentData.anio, mes: paymentData.mes };
      }

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const { clientSecret, error: apiError } = await response.json();

      if (apiError || !clientSecret) {
        throw new Error(apiError || "No se pudo iniciar el pago.");
      }

      // 2. Inicializar PaymentSheet
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: "Buvle Academia",
        paymentIntentClientSecret: clientSecret,
        allowsDelayedPaymentMethods: true,
        returnURL: "buvle://stripe-redirect",
      });

      if (initError) {
        throw new Error(initError.message);
      }

      // 3. Mostrar PaymentSheet
      const { error: paymentError } = await presentPaymentSheet();

      if (paymentError) {
        if (paymentError.code !== "Canceled") {
          throw new Error(paymentError.message);
        }
      } else {
        Alert.alert("Éxito", "¡Pago completado correctamente!");
        fetchData(); // 🔑 refrescar datos tras el pago
      }
    } catch (err) {
      Alert.alert("Error de Pago", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getMatriculaButtonText = () => {
    if (!mesMatricula) return "Matrícula";
    const monthName = monthNames[mesMatricula - 1];
    if (haPagadoMatriculaAnual) return `Matrícula ${anioActual} Pagada`;
    if (esMesDeMatricula) return `Pagar Matrícula (${monthName})`;
    return `Matrícula (${monthName})`;
  };

  if (tipoPago !== 1) {
    return (
      <View style={styles.container}>
        <Text style={styles.infoText}>
          Tu plan de pago es por domiciliación bancaria.
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Selecciona el bono a pagar</Text>

      {/* Matrícula */}
      <TouchableOpacity
        style={[styles.button, !matriculaPendiente && styles.disabledButton]}
        disabled={!matriculaPendiente || loading}
        onPress={() => handlePayment("matricula", { anio: anioActual })}
      >
        <Text style={styles.buttonText}>{getMatriculaButtonText()}</Text>
      </TouchableOpacity>

      {/* Mes actual */}
      <TouchableOpacity
        style={[
          styles.button,
          (haPagadoMesActual || matriculaPendiente) && styles.disabledButton,
        ]}
        disabled={haPagadoMesActual || matriculaPendiente || loading}
        onPress={() => handlePayment("mensual", mesActual)}
      >
        <Text style={styles.buttonText}>
          {haPagadoMesActual
            ? `Pagado ${monthNames[mesActual.mes - 1]}`
            : `Pagar ${monthNames[mesActual.mes - 1]}`}
        </Text>
      </TouchableOpacity>

      {/* Mes siguiente */}
      <TouchableOpacity
        style={[
          styles.button,
          (haPagadoMesSiguiente || matriculaPendiente) && styles.disabledButton,
        ]}
        disabled={haPagadoMesSiguiente || matriculaPendiente || loading}
        onPress={() => handlePayment("mensual", mesSiguiente)}
      >
        <Text style={styles.buttonText}>
          {haPagadoMesSiguiente
            ? `Pagado ${monthNames[mesSiguiente.mes - 1]}`
            : `Pagar ${monthNames[mesSiguiente.mes - 1]}`}
        </Text>
      </TouchableOpacity>

      {loading && (
        <ActivityIndicator style={{ marginTop: 20 }} size="small" color="#333" />
      )}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

// --- Wrapper con StripeProvider ---
export default function PagosNative(props) {
  return (
    <StripeProvider publishableKey={PUBLISHABLE_KEY}>
      <PagosScreen {...props} />
    </StripeProvider>
  );
}

// --- Estilos ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 25,
    color: "#333",
  },
  button: {
    width: "100%",
    backgroundColor: "#007bff",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  disabledButton: {
    backgroundColor: "#6c757d",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  infoText: {
    fontSize: 16,
    textAlign: "center",
    color: "#555",
  },
  errorText: {
    marginTop: 15,
    color: "#dc3545",
    fontSize: 14,
    textAlign: "center",
  },
});
