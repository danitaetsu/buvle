import React, { useState, useEffect } from "react";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

// --- Configuración ---
const API_URL = "https://buvle-backend.onrender.com";
const PUBLISHABLE_KEY = "pk_live_51Q2sLs04VOrKio1OOc0cM0yNNrMAFuOqRIuM4Vrh8QqhqSdyNUB8fPj5jVdZauiOjyAA8pWxFMtvdarnzPeHic2m00IiftIRS1";
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
  // Contenedor principal: flexible para no tapar el menú
  container: {
    flex: 1,
    width: '100%',
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: "2rem",
  },
  // La caja blanca que contiene el formulario o los botones
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
    backgroundColor: "#007bff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    marginBottom: '10px',
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
// Su única misión es recibir un 'clientSecret' y confirmar el pago
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
  const [mesesPagados, setMesesPagados] = useState([]);
  const [clientSecret, setClientSecret] = useState(null);
  const [precio, setPrecio] = useState(0);
  const [mesMatricula, setMesMatricula] = useState(null);


  useEffect(() => {
  const fetchMesesPagados = async () => {
    if (!idAlumno) return;
    try {
      const res = await fetch(`${API_URL}/meses-pagados/${idAlumno}`);
      const data = await res.json();
      setMesesPagados(data);
    } catch (err) {
      console.error("Error al cargar meses pagados:", err);
    }
  };

  const fetchAlumno = async () => {
    if (!idAlumno) return;
    try {
      const res = await fetch(`${API_URL}/alumno/${idAlumno}`);
      const data = await res.json();
      if (data.success) {
        setMesMatricula(data.alumno.mes_matricula);
      }
    } catch (err) {
      console.error("Error al cargar alumno:", err);
    }
  };

  fetchMesesPagados();
  fetchAlumno();
}, [idAlumno, status]);


  const hoy = new Date();
  const mesActual = { anio: hoy.getFullYear(), mes: hoy.getMonth() + 1 };
  const fechaSiguiente = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1);
  const mesSiguiente = { anio: fechaSiguiente.getFullYear(), mes: fechaSiguiente.getMonth() + 1 };
  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  const haPagadoMesActual = mesesPagados.some(m => m.anio === mesActual.anio && m.mes === mesActual.mes);
  const haPagadoMesSiguiente = mesesPagados.some(m => m.anio === mesSiguiente.anio && m.mes === mesSiguiente.mes);

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
                  Pagar otro mes
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

          return (
            <div style={styles.form}>
              <p style={styles.title}>Selecciona el bono a pagar</p>
              <button style={styles.button} onClick={() => iniciarPagoParaMes(mesActual)} disabled={haPagadoMesActual}>
                {haPagadoMesActual ? `Pagado ${monthNames[mesActual.mes - 1]}` : `Pagar ${monthNames[mesActual.mes - 1]}`}
              </button>
              <button style={styles.button} onClick={() => iniciarPagoParaMes(mesSiguiente)} disabled={haPagadoMesSiguiente}>
                {haPagadoMesSiguiente ? `Pagado ${monthNames[mesSiguiente.mes - 1]}` : `Pagar ${monthNames[mesSiguiente.mes - 1]}`}
              </button>

                {/* Botón matrícula en gris */}
<button 
  style={{ ...styles.button, ...styles.cancelButton }} 
  onClick={() => console.log("Pago matrícula")}
>
  {mesMatricula 
    ? `Matrícula (${monthNames[mesMatricula - 1]})` 
    : "Matrícula"}
</button>


              {error && <p style={styles.error}>{error}</p>}
            </div>
          );
        })()}
      </Elements>
    </div>
  );
}