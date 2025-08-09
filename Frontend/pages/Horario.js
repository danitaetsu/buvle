import React, { useState, useEffect } from "react";
import axios from "axios";

const API_URL = "http://localhost:3000"; // cambia a tu dominio/render

export default function Horario({ idAlumno }) {
  const [horario, setHorario] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [semanas, setSemanas] = useState([]);

  // Generar semanas dinámicamente (ejemplo Agosto)
  const generarSemanas = () => {
    const inicioMes = new Date(2025, 7, 8); // Agosto 2025 empieza desde 8
    let semanasTemp = [];
    for (let i = 0; i < 5; i++) {
      let inicio = new Date(inicioMes);
      inicio.setDate(inicio.getDate() + i * 7);
      let fin = new Date(inicio);
      fin.setDate(fin.getDate() + 6);
      semanasTemp.push({
        inicio: inicio.toLocaleDateString("es-ES"),
        fin: fin.toLocaleDateString("es-ES"),
      });
    }
    setSemanas(semanasTemp);
  };

  // Cargar horarios desde la base de datos (turnos)
  const cargarHorario = async () => {
    try {
      const res = await axios.get(`${API_URL}/turnos`); // Este endpoint debe devolver todos los turnos
      setHorario(res.data.turnos);
    } catch (err) {
      console.error("Error cargando horario:", err.message);
    }
  };

  // Cargar reservas del alumno
  const cargarReservas = async () => {
    try {
      const res = await axios.get(`${API_URL}/mis-reservas/${idAlumno}`);
      setReservas(res.data.reservas);
    } catch (err) {
      console.error("Error cargando reservas:", err.message);
    }
  };

  // Reservar o cancelar
  const manejarClick = async (idTurno, fecha) => {
    const reservaExistente = reservas.find(
      (r) => r.id_turno === idTurno && r.fecha_clase === fecha
    );

    if (reservaExistente) {
      if (window.confirm("¿Quieres cancelar esta reserva?")) {
        await axios.delete(`${API_URL}/cancelar`, {
          data: { id_reserva: reservaExistente.id_reserva, id_alumno: idAlumno },
        });
        await cargarReservas();
      }
    } else {
      if (window.confirm("¿Quieres reservar este turno?")) {
        await axios.post(`${API_URL}/reservar`, {
          id_alumno: idAlumno,
          id_turno: idTurno,
          fecha_clase: fecha,
        });
        await cargarReservas();
      }
    }
  };

  useEffect(() => {
    generarSemanas();
    cargarHorario();
    cargarReservas();
  }, []);

  return (
    <div>
      {semanas.map((semana, i) => (
        <div key={i} className="semana">
          <h3>
            Semana {i + 1} ({semana.inicio} - {semana.fin})
          </h3>
          <div className="tabla-horario">
            <div className="header">
              <div></div>
              {["L", "M", "X", "J", "V"].map((dia, index) => (
                <div key={index} className="dia">
                  {dia}
                </div>
              ))}
            </div>
            {horario.map((turno) => (
              <div key={turno.id_turno} className="fila">
                <div className="hora">
                  {turno.hora_inicio} - {turno.hora_fin}
                </div>
                {[1, 2, 3, 4, 5].map((diaNum) => {
                  const fecha = new Date(semana.inicio.split("/").reverse().join("-"));
                  fecha.setDate(fecha.getDate() + (diaNum - 1));
                  const fechaStr = fecha.toISOString().split("T")[0];

                  const estaReservado = reservas.some(
                    (r) =>
                      r.id_turno === turno.id_turno &&
                      r.fecha_clase === fechaStr
                  );

                  return (
                    <div
                      key={diaNum}
                      className={`celda ${estaReservado ? "reservado" : ""}`}
                      onClick={() => manejarClick(turno.id_turno, fechaStr)}
                    >
                      {estaReservado ? "✅" : ""}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ))}
      <style jsx>{`
        .tabla-horario {
          display: grid;
          grid-template-columns: 100px repeat(5, 1fr);
          border: 1px solid #ccc;
          margin-bottom: 20px;
        }
        .header, .fila {
          display: contents;
        }
        .dia, .hora, .celda {
          border: 1px solid #ccc;
          padding: 10px;
          text-align: center;
        }
        .reservado {
          background-color: #90ee90;
        }
        .celda:hover {
          cursor: pointer;
          background-color: #e0e0e0;
        }
      `}</style>
    </div>
  );
}
