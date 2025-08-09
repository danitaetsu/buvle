const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cors());

// Conexión a Supabase PostgreSQL (Transaction Pooler)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Probar conexión al arrancar
(async () => {
  try {
    await pool.query("SELECT NOW()");
    console.log("✅ Conectado a Supabase PostgreSQL correctamente");
  } catch (err) {
    console.error("❌ Error de conexión a la base de datos:", err.message);
  }
})();

// ─────────── ENDPOINTS ───────────

// Probar conexión
app.get("/check-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ success: true, time: result.rows[0] });
  } catch (err) {
    console.error("Error comprobando conexión a DB:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Raíz
app.get("/", (req, res) => {
  res.send("API funcionando con PostgreSQL (Supabase)");
});

// LOGIN
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT id_alumno, nombre, clases_disponibles FROM alumnos WHERE email = $1 AND password = $2",
      [email, password]
    );

    if (result.rows.length > 0) {
      res.status(200).json({ success: true, alumno: result.rows[0] });
    } else {
      res.status(401).json({ success: false, message: "Usuario o contraseña incorrectos" });
    }
  } catch (err) {
    console.error("Error en login:", err.message);
    res.status(500).json({ success: false, message: "Error en el servidor" });
  }
});

// REGISTER
app.post("/register", async (req, res) => {
  const { nombre, email, password, confirmPassword } = req.body;

  if (!nombre || !email || !password || !confirmPassword) {
    return res.status(400).json({ success: false, message: "Todos los campos son obligatorios" });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ success: false, message: "Las contraseñas no coinciden" });
  }

  try {
    const checkEmail = await pool.query(
      "SELECT * FROM alumnos WHERE email = $1",
      [email]
    );
    if (checkEmail.rows.length > 0) {
      return res.status(400).json({ success: false, message: "El correo ya está registrado" });
    }

    await pool.query(
      "INSERT INTO alumnos (nombre, email, password, clases_disponibles) VALUES ($1, $2, $3, $4)",
      [nombre, email, password, 10] // Por defecto 10 clases
    );

    res.status(201).json({ success: true, message: "Alumno registrado con éxito" });
  } catch (err) {
    console.error("Error en register:", err.message);
    res.status(500).json({ success: false, message: "Error en el servidor" });
  }
});

// LISTAR TURNOS
app.get("/turnos", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id_turno, dia, hora_inicio, hora_fin, max_alumnos FROM turnos ORDER BY hora_inicio"
    );
    res.json({ success: true, turnos: result.rows });
  } catch (err) {
    console.error("Error listando turnos:", err.message);
    res.status(500).json({ success: false, message: "Error al obtener turnos" });
  }
});

// MIS RESERVAS
app.get("/mis-reservas/:id_alumno", async (req, res) => {
  const { id_alumno } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM reservas WHERE id_alumno = $1",
      [id_alumno]
    );
    res.json({ success: true, reservas: result.rows });
  } catch (err) {
    console.error("Error listando reservas:", err.message);
    res.status(500).json({ success: false, message: "Error al obtener reservas" });
  }
});

// CREAR RESERVA
app.post("/reservar", async (req, res) => {
  const { id_alumno, id_turno, fecha_clase } = req.body;

  try {
    // Comprobar si el turno está lleno
    const count = await pool.query(
      "SELECT COUNT(*) FROM reservas WHERE id_turno = $1 AND fecha_clase = $2",
      [id_turno, fecha_clase]
    );
    const turnoInfo = await pool.query(
      "SELECT max_alumnos FROM turnos WHERE id_turno = $1",
      [id_turno]
    );
    if (parseInt(count.rows[0].count) >= turnoInfo.rows[0].max_alumnos) {
      return res.status(400).json({ success: false, message: "Turno completo" });
    }

    // Comprobar si el alumno tiene clases disponibles
    const alumno = await pool.query(
      "SELECT clases_disponibles FROM alumnos WHERE id_alumno = $1",
      [id_alumno]
    );
    if (alumno.rows[0].clases_disponibles <= 0) {
      return res.status(400).json({ success: false, message: "No tienes clases disponibles" });
    }

    // Crear reserva
    await pool.query(
      "INSERT INTO reservas (id_alumno, id_turno, fecha_clase) VALUES ($1, $2, $3)",
      [id_alumno, id_turno, fecha_clase]
    );

    // Decrementar clases disponibles
    await pool.query(
      "UPDATE alumnos SET clases_disponibles = clases_disponibles - 1 WHERE id_alumno = $1",
      [id_alumno]
    );

    res.json({ success: true, message: "Reserva creada correctamente" });
  } catch (err) {
    console.error("Error creando reserva:", err.message);
    res.status(500).json({ success: false, message: "Error en el servidor" });
  }
});

// CANCELAR RESERVA
app.delete("/cancelar", async (req, res) => {
  const { id_reserva, id_alumno } = req.body;

  try {
    // Eliminar reserva
    await pool.query(
      "DELETE FROM reservas WHERE id_reserva = $1 AND id_alumno = $2",
      [id_reserva, id_alumno]
    );

    // Incrementar clases disponibles
    await pool.query(
      "UPDATE alumnos SET clases_disponibles = clases_disponibles + 1 WHERE id_alumno = $1",
      [id_alumno]
    );

    res.json({ success: true, message: "Reserva cancelada correctamente" });
  } catch (err) {
    console.error("Error cancelando reserva:", err.message);
    res.status(500).json({ success: false, message: "Error en el servidor" });
  }
});

// ─────────── INICIAR SERVIDOR ───────────
app.listen(port, "0.0.0.0", () => {
  console.log(`Servidor corriendo en http://0.0.0.0:${port}`);
});
