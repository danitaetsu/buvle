BEGIN;

-- Tabla de alumnos
CREATE TABLE IF NOT EXISTS Alumnos (
    id_alumno SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    clases_disponibles INTEGER NOT NULL DEFAULT 4
);

-- Un solo alumno de ejemplo
INSERT INTO Alumnos (nombre, email, password, clases_disponibles) VALUES
('Ana Garcia', 'ana@example.com', 'password1', 4);

-- Tabla de turnos
CREATE TABLE IF NOT EXISTS Turnos (
    id_turno SERIAL PRIMARY KEY,
    dia INTEGER NOT NULL CHECK (dia BETWEEN 1 AND 5),
    hora_inicio TEXT NOT NULL CHECK (hora_inicio IN ('12:00', '17:00', '19:00')),
    hora_fin TEXT NOT NULL CHECK (hora_fin IN ('14:00', '19:00', '21:00')),
    max_alumnos INTEGER NOT NULL DEFAULT 6
);

-- Todos los turnos
INSERT INTO Turnos (dia, hora_inicio, hora_fin, max_alumnos) VALUES
(3, '12:00', '14:00', 6),  -- id_turno = 1
(3, '17:00', '19:00', 6),  -- id_turno = 2
(1, '17:00', '19:00', 6),  -- id_turno = 3
(2, '17:00', '19:00', 6),  -- id_turno = 4
(4, '17:00', '19:00', 6),  -- id_turno = 5
(5, '17:00', '19:00', 6),  -- id_turno = 6
(1, '19:00', '21:00', 6),  -- id_turno = 7
(2, '19:00', '21:00', 6),  -- id_turno = 8
(3, '19:00', '21:00', 6),  -- id_turno = 9
(4, '19:00', '21:00', 6),  -- id_turno = 10
(5, '19:00', '21:00', 6);  -- id_turno = 11

-- Tabla de reservas
CREATE TABLE IF NOT EXISTS Reservas (
    id_reserva SERIAL PRIMARY KEY,
    id_alumno INTEGER NOT NULL REFERENCES Alumnos(id_alumno) ON DELETE CASCADE,
    id_turno INTEGER NOT NULL REFERENCES Turnos(id_turno) ON DELETE CASCADE,
    fecha_clase DATE NOT NULL
);

-- Una sola reserva: Ana en el turno 2
INSERT INTO Reservas (id_alumno, id_turno, fecha_clase) VALUES
(1, 2, '2025-08-10');

COMMIT;
