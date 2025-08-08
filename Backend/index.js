const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cors());

// Conexión a Supabase (Transaction Pooler, IPv4)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL, // en Render pondrás la URI
    ssl: { rejectUnauthorized: false }
});

// Probar conexión al arrancar
(async () => {
    try {
        await pool.query('SELECT NOW()');
        console.log('✅ Conectado a Supabase PostgreSQL correctamente');
    } catch (err) {
        console.error('❌ Error de conexión a la base de datos:', err.message);
    }
})();

// Endpoint de prueba de conexión
app.get('/check-db', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({ success: true, time: result.rows[0] });
    } catch (err) {
        console.error('Error comprobando conexión a DB:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Endpoint raíz
app.get('/', (req, res) => {
    res.send('API funcionando con PostgreSQL (Supabase Transaction Pooler)');
});

// LOGIN
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await pool.query(
            'SELECT * FROM alumnos WHERE email = $1 AND password = $2',
            [email, password]
        );

        if (result.rows.length > 0) {
            res.status(200).json({ success: true, nombre: result.rows[0].nombre });
        } else {
            res.status(401).json({ success: false, message: 'Usuario no registrado o contraseña incorrecta' });
        }
    } catch (err) {
        console.error('Error en la consulta:', err.message);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
});

// REGISTER
app.post('/register', async (req, res) => {
    const { nombre, email, password, confirmPassword } = req.body;

    if (!nombre || !email || !password || !confirmPassword) {
        return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios' });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ success: false, message: 'Las contraseñas no coinciden' });
    }

    try {
        const checkEmail = await pool.query(
            'SELECT * FROM alumnos WHERE email = $1',
            [email]
        );

        if (checkEmail.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'El correo ya está registrado' });
        }

        await pool.query(
            'INSERT INTO alumnos (nombre, email, password) VALUES ($1, $2, $3)',
            [nombre, email, password]
        );

        res.status(201).json({ success: true, message: 'Alumno registrado con éxito' });
    } catch (err) {
        console.error('Error al registrar el alumno:', err.message);
        res.status(500).json({ success: false, message: 'Error al registrar al usuario' });
    }
});

// Iniciar servidor
app.listen(port, '0.0.0.0', () => {
    console.log(`Servidor corriendo en http://0.0.0.0:${port}`);
});
