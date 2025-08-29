import React, { useState, useEffect } from "react";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

// --- Configuración --
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
  container: {
    minHeight: "100vh",
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
    backgroundColor: "#007bff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
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
};

// --- Checkout Form ---
const CheckoutForm = ({ setStatus, setError, idAlumno }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [price, setPrice] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);

  // 👇 Pedimos el precio apenas se monta el componente
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch(`${API_URL}/create-payment-intent`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idAlumno }),
        });
        const data = await res.json();
        console.log("DEBUG: create-payment-intent =", data);

        if (data.clientSecret) {
          setPrice(data.amount);
          setClientSecret(data.clientSecret);
        } else {
          setError(data.error || "No se pudo obtener el precio.");
        }
      } catch (err) {
        console.error("❌ Error en fetchPrice:", err);
        setError("Error al obtener el precio del servidor.");
      }
    };

    fetchPrice();
  }, [idAlumno, setError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!stripe || !elements || !clientSecret) {
      setError("Stripe no está listo todavía.");
      setLoading(false);
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError("El formulario de tarjeta no está montado correctamente.");
      setLoading(false);
      return;
    }

    try {
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement },
      });

      if (result.error) {
        setError(result.error.message);
      } else if (result.paymentIntent?.status === "succeeded") {
        setStatus("success");
      } else {
        setError("Pago no completado. Estado: " + result.paymentIntent?.status);
      }
    } catch (err) {
      console.error("❌ Error en handleSubmit:", err);
      setError("Error en el proceso de pago.");
    }

    setLoading(false);
  };

  return (
    <form style={styles.form} onSubmit={handleSubmit}>
      <p style={styles.title}>Introduce los datos de tu tarjeta</p>
      <div style={styles.cardWrapper}>
        <CardElement options={cardElementOptions} />
      </div>

   
      <button style={styles.button} type="submit" disabled={!stripe || loading || !clientSecret}>
        {loading ? "Procesando..." : price ? `Pagar ${price.toFixed(2)} €` : "Pagar"}
      </button>
    </form>
  );
};


// --- Componente Principal ---
export default function PagosWeb({ tipoPago, idAlumno }) {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

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
        {status === "success" ? (
          <p style={styles.status}>✅ ¡Pago realizado con éxito!</p>
        ) : (
          <>
            <CheckoutForm setStatus={setStatus} setError={setError} idAlumno={idAlumno} />
            {error && <p style={styles.error}>{error}</p>}
          </>
        )}
      </Elements>
    </div>
  );
}