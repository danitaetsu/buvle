-- Creación de la tabla Alumnos

/*

--Creación de la tabla alumnos.

CREATE TABLE Alumnos (
    id_alumno INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
);

-- Creación de la tabla Turnos
CREATE TABLE Turnos (
    id_turno INTEGER PRIMARY KEY AUTOINCREMENT,
    dia INTEGER NOT NULL CHECK(dia BETWEEN 1 AND 5),  -- 1 = Lunes, ..., 5 = Viernes
    hora_inicio TEXT NOT NULL CHECK(hora_inicio IN ('17:00', '19:00')),
    hora_fin TEXT NOT NULL CHECK(hora_fin IN ('19:00', '21:00')),
    max_alumnos INTEGER NOT NULL DEFAULT 5
);

-- Creación de la tabla Reservas
CREATE TABLE Reservas (
    id_reserva INTEGER PRIMARY KEY AUTOINCREMENT,
    id_alumno INTEGER NOT NULL,
    id_turno INTEGER NOT NULL,
    FOREIGN KEY (id_alumno) REFERENCES Alumnos(id_alumno) ON DELETE CASCADE,
    FOREIGN KEY (id_turno) REFERENCES Turnos(id_turno) ON DELETE CASCADE,
    UNIQUE(id_alumno)  -- Cada alumno solo puede tener una reserva activa
);




INSERT INTO Alumnos (nombre, email, password) VALUES ('Ana García', 'ana@example.com', 'password1');
INSERT INTO Alumnos (nombre, email, password) VALUES ('Luis Martínez', 'luis@example.com', 'password2');
INSERT INTO Alumnos (nombre, email, password) VALUES ('María López', 'maria@example.com', 'password3');
INSERT INTO Alumnos (nombre, email, password) VALUES ('Carlos Sánchez', 'carlos@example.com', 'password4');
INSERT INTO Alumnos (nombre, email, password) VALUES ('Lucía Fernández', 'lucia@example.com', 'password5');


INSERT INTO Turnos (dia, hora_inicio, hora_fin) VALUES (1, '17:00', '19:00');  -- Lunes, 17:00-19:00
INSERT INTO Turnos (dia, hora_inicio, hora_fin) VALUES (1, '19:00', '21:00');  -- Lunes, 19:00-21:00
INSERT INTO Turnos (dia, hora_inicio, hora_fin) VALUES (2, '17:00', '19:00');  -- Martes, 17:00-19:00
INSERT INTO Turnos (dia, hora_inicio, hora_fin) VALUES (2, '19:00', '21:00');  -- Martes, 19:00-21:00
INSERT INTO Turnos (dia, hora_inicio, hora_fin) VALUES (3, '17:00', '19:00');  -- Miércoles, 17:00-19:00
INSERT INTO Turnos (dia, hora_inicio, hora_fin) VALUES (3, '19:00', '21:00');  -- Miércoles, 19:00-21:00
INSERT INTO Turnos (dia, hora_inicio, hora_fin) VALUES (4, '17:00', '19:00');  -- Jueves, 17:00-19:00
INSERT INTO Turnos (dia, hora_inicio, hora_fin) VALUES (4, '19:00', '21:00');  -- Jueves, 19:00-21:00
INSERT INTO Turnos (dia, hora_inicio, hora_fin) VALUES (5, '17:00', '19:00');  -- Viernes, 17:00-19:00
INSERT INTO Turnos (dia, hora_inicio, hora_fin) VALUES (5, '19:00', '21:00');  -- Viernes, 19:00-21:00


-- Reservas de Ana García
INSERT INTO Reservas (id_alumno, id_turno) VALUES (1, 1);  -- Lunes, 17:00-19:00
-- Reservas de Luis Martínez
INSERT INTO Reservas (id_alumno, id_turno) VALUES (2, 2);  -- Lunes, 19:00-21:00
-- Reservas de María López
INSERT INTO Reservas (id_alumno, id_turno) VALUES (3, 3);  -- Martes, 17:00-19:00
-- Reservas de Carlos Sánchez
INSERT INTO Reservas (id_alumno, id_turno) VALUES (4, 4);  -- Martes, 19:00-21:00
-- Reservas de Lucía Fernández
INSERT INTO Reservas (id_alumno, id_turno) VALUES (5, 5);  -- Miércoles, 17:00-19:00



SELECT *FROM Alumnos;
SELECT *FROM Turnos;
SELECT * FROM Reservas;



--Vamos a entender las consultas
-- Selecciona de la tabla alumnos a partir de su atributo nombre. AS  en una columna con titulo Alumno.
-- Luego selecciona de la tabla turnos, a partir de su atributo Dia. En una columna con nombre dia
-- Luego selecciona de la tabla turnos a partir de su atributo hora inicio. En una columna etc 
-- y lo mismo.

-- Vale, ahora el JOIN: De la tabla reservas Une id_alumno con su atributo homónimo en alumnos. 
-- Ahora un nuevo JOIN: De la tabla reservas une id_turno con su atributo homónimo en turnos
-- Ordénalo por día y horario




SELECT Turnos.dia AS Dia, Turnos.hora_inicio AS HoraInicio, Turnos.hora_fin AS HoraFin, COUNT(Reservas.id_reserva) AS NumeroAlumnos
FROM Turnos
LEFT JOIN Reservas ON Turnos.id_turno = Reservas.id_turno
GROUP BY Turnos.id_turno
ORDER BY Dia, HoraInicio;

*/




SELECT Alumnos.nombre AS Alumno, Turnos.dia AS Dia, Turnos.hora_inicio AS HoraInicio, Turnos.hora_fin AS HoraFin
FROM Reservas

JOIN Alumnos ON Reservas.id_alumno = Alumnos.id_alumno
JOIN Turnos ON Reservas.id_turno = Turnos.id_turno
ORDER BY Dia, HoraInicio;
