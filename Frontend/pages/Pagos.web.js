import React, { useState, useEffect } from "react";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

// --- Configuración ---
const API_URL = "https://buvle-pruebas.onrender.com";
const PUBLISHABLE_KEY = "pk_live_51H1CwxHRXfYIbKT9Wbwmvy7KVoC90E2WSEWGUxQjPKfsRc7kO4xpOXqTwQj92z9rJu2O5pnOcYXxXnFFH3is7lq700x4fByHde";
const stripePromise = loadStripe(PUBLISHABLE_KEY);

// --- Estilos ---
const cardElementOptions = {
  style: {
    base: {
      color: "#32325d",
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSize: "16px",
      "::placeholder": { color: "#aab7c4" },
    },
    invalid: { color: "#fa755a", iconColor: "#fa755a" },
  },
};

const styles = {
  container: {
    flex: 1,
    width: '100%',
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: "2rem",
  },
  form: {
    width: "100%",
    maxWidth: "400px",
    backgroundColor: "white",
    padding: "24px",
    borderRadius: "12px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
  },
  title: {
    fontSize: "20px",
    fontWeight: "bold",
    marginBottom: "20px",
    textAlign: "center",
    color: "#333",
  },
  cardWrapper: {
    padding: "12px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    marginBottom: "20px",
  },
  button: {
    width: "100%",
    padding: "12px",
    fontSize: "16px",
    fontWeight: "bold",
    color: "white",
    backgroundColor: "#007bff", // Estilo para botón activo (azul)
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    marginBottom: '10px',
    transition: 'background-color 0.3s ease',
  },
  disabledButton: { // ✨ NUEVO: Estilo para botón deshabilitado (gris)
    backgroundColor: '#6c757d',
    cursor: 'not-allowed',
  },
  error: {
    marginTop: "12px",
    fontSize: "14px",
    color: "#dc3545",
    textAlign: "center",
  },
  status: {
    fontSize: "18px",
    fontWeight: "bold",
    textAlign: "center",
    marginTop: "20px",
  },
  cancelButton: {
    backgroundColor: '#6c757d',
    marginTop: '10px',
  }
};

// --- Componente del Formulario de Pago ---
const CheckoutForm = ({ setStatus, setError, clientSecret, price, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!stripe || !elements) return;

    const { error } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: elements.getElement(CardElement) },
    });

    if (error) {
      setError(error.message);
    } else {
      setStatus("success");
    }
    setLoading(false);
  };

  return (
    <div style={styles.form}>
      <p style={styles.title}>Finalizar Pago</p>
      <div style={styles.cardWrapper}>
        <CardElement options={cardElementOptions} />
      </div>
      <button style={styles.button} onClick={handleSubmit} disabled={!stripe || loading}>
        {loading ? "Procesando..." : `Pagar ${price.toFixed(2)} €`}
      </button>
      <button onClick={onCancel} style={{...styles.button, ...styles.cancelButton}}>
        Cancelar
      </button>
    </div>
  );
};

// --- Componente Principal ---
export default function PagosWeb({ tipoPago, idAlumno }) {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [clientSecret, setClientSecret] = useState(null);
  const [precio, setPrecio] = useState(0);
  
  // ✨ NUEVO: Estados para manejar la lógica de pagos
  const [isLoading, setIsLoading] = useState(true);
  const [mesesPagados, setMesesPagados] = useState([]);
  const [mesMatricula, setMesMatricula] = useState(null);
  const [haPagadoMatriculaAnual, setHaPagadoMatriculaAnual] = useState(false);


  // ✨ ACTUALIZADO: useEffect para cargar todos los datos necesarios
  useEffect(() => {
    const fetchData = async () => {
        if (!idAlumno) return;
        setIsLoading(true);
        try {
            const anioActual = new Date().getFullYear();

            // 1. Fetch meses pagados
            const resMeses = await fetch(`${API_URL}/meses-pagados/${idAlumno}`);
            if (!resMeses.ok) throw new Error('Error al cargar meses pagados');
            const dataMeses = await resMeses.json();
            setMesesPagados(dataMeses);

            // 2. Fetch datos del alumno (incluido mes_matricula)
            const resAlumno = await fetch(`${API_URL}/alumno/${idAlumno}`);
            if (!resAlumno.ok) throw new Error('Error al cargar datos del alumno');
            const dataAlumno = await resAlumno.json();
            if (dataAlumno.success) {
                setMesMatricula(dataAlumno.alumno.mes_matricula);
            }

            // 3. Fetch si la matrícula anual está pagada
            const resMatricula = await fetch(`${API_URL}/matricula-pagada/${idAlumno}/${anioActual}`);
            if (!resMatricula.ok) throw new Error('Error al verificar la matrícula');
            const dataMatricula = await resMatricula.json();
            setHaPagadoMatriculaAnual(dataMatricula.pagada);

        } catch (err) {
            console.error("Error al cargar datos de pago:", err);
            setError("No se pudieron cargar los datos de pago. Inténtalo de nuevo.");
        } finally {
            setIsLoading(false);
        }
    };

    fetchData();
  }, [idAlumno, status]); // 'status' fuerza el refresco después de un pago


  // ✨ NUEVO: Lógica central para determinar el estado de los botones
  const hoy = new Date();
  const anioActual = hoy.getFullYear();
  const mesActualNumero = hoy.getMonth() + 1;
  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  // Lógica de la matrícula
  const esMesDeMatricula = mesMatricula === mesActualNumero;
  const matriculaPendiente = esMesDeMatricula && !haPagadoMatriculaAnual;

  // Lógica de mensualidades
  const mesActual = { anio: anioActual, mes: mesActualNumero };
  const fechaSiguiente = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1);
  const mesSiguiente = { anio: fechaSiguiente.getFullYear(), mes: fechaSiguiente.getMonth() + 1 };
  
  const haPagadoMesActual = mesesPagados.some(m => m.anio === mesActual.anio && m.mes === mesActual.mes);
  const haPagadoMesSiguiente = mesesPagados.some(m => m.anio === mesSiguiente.anio && m.mes === mesSiguiente.mes);

  // --- Funciones para iniciar pagos ---
  const iniciarPagoParaMes = async (datosMes) => {
    setError("");
    try {
      const res = await fetch(`${API_URL}/create-payment-intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idAlumno, anio: datosMes.anio, mes: datosMes.mes }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setClientSecret(data.clientSecret);
      setPrecio(data.amount);
    } catch (err) {
      setError(err.message);
    }
  };
  
  // ✨ NUEVO: Función para iniciar el pago de la matrícula
  const iniciarPagoMatricula = async () => {
    setError("");
    try {
        const res = await fetch(`${API_URL}/create-matricula-payment-intent`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idAlumno, anio: anioActual }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setClientSecret(data.clientSecret);
        setPrecio(data.amount);
    } catch (err) {
        setError(err.message);
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
      <div style={styles.container}>
        <p>Tu plan de pago es por domiciliación bancaria.</p>
      </div>
    );
  }


  return (
    <div style={styles.container}>
      <Elements stripe={stripePromise}>
        {(() => {
          if (status === "success") {
            return (
              <div style={styles.form}>
                <p style={styles.status}>✅ ¡Pago realizado con éxito!</p>
                <button 
                  onClick={() => { setStatus('idle'); setClientSecret(null); }} 
                  style={{...styles.button, marginTop: '20px'}}
                >
                  Volver a Pagos
                </button>
              </div>
            );
          }

          if (clientSecret) {
            return (
              <CheckoutForm 
                setStatus={setStatus} 
                setError={setError} 
                clientSecret={clientSecret} 
                price={precio}
                onCancel={() => setClientSecret(null)}
              />
            );
          }

          // ✨ ACTUALIZADO: Renderizado condicional de los botones
          return (
            <div style={styles.form}>
              <p style={styles.title}>Selecciona el bono a pagar</p>
              {isLoading ? (
                  <p style={{textAlign: 'center'}}>Cargando...</p>
              ) : (
                <>
                  <button 
                    style={{...styles.button, ...(!matriculaPendiente && styles.disabledButton)}}
                    onClick={iniciarPagoMatricula}
                    disabled={!matriculaPendiente}
                  >
                    {getMatriculaButtonText()}
                  </button>
                  
                  <button 
                    style={{...styles.button, ...((haPagadoMesActual || matriculaPendiente) && styles.disabledButton)}}
                    onClick={() => iniciarPagoParaMes(mesActual)} 
                    disabled={haPagadoMesActual || matriculaPendiente}>
                    {haPagadoMesActual ? `Pagado ${monthNames[mesActual.mes - 1]}` : `Pagar ${monthNames[mesActual.mes - 1]}`}
                  </button>

                  <button 
                    style={{...styles.button, ...((haPagadoMesSiguiente || matriculaPendiente) && styles.disabledButton)}}
                    onClick={() => iniciarPagoParaMes(mesSiguiente)} 
                    disabled={haPagadoMesSiguiente || matriculaPendiente}>
                    {haPagadoMesSiguiente ? `Pagado ${monthNames[mesSiguiente.mes - 1]}` : `Pagar ${monthNames[mesSiguiente.mes - 1]}`}
                  </button>

                  {error && <p style={styles.error}>{error}</p>}
                </>
              )}
            </div>
          );
        })()}
      </Elements>
    </div>
  );
}
