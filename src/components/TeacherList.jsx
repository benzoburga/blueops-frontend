import React from 'react';
import '../styles/teacherList.css';
import { BiShow } from 'react-icons/bi';


const teachers = [
  { name: 'JetSmart', duration: 'Valeria Ramírez Ponce', cost: '20485632917' },
  { name: 'Banff', duration: 'Sebastián Torres Gutiérrez', cost: '20519873642' },
  { name: 'BBC Latam', duration: 'Mariana Fernández Cordero', cost: '2065438129' },
  { name: 'DIFAMEC', duration: 'Alejandro Rojas Salinas', cost: '20716598324' },
  { name: 'Granja Villa', duration: 'Camila Vargas Loyola', cost: '20345789126' },
  { name: 'Dream Company', duration: 'Diego Castillo Herrera', cost: '20987654312' },
  { name: 'Allpanay', duration: 'Lucía Morales Ibáñezn', cost: '20821347965' },
];

const TeacherList = () => {
  return (
    <div className="teacher--list">
      <div className="list--header">
        <h2>Clientes BlueOps</h2>
      </div>
      {/* 🏷️ NUEVO: Encabezados de columna */}
      <div className="column--titles">
        <span>Nombre Comercial</span>
        <span>Representante Legal</span>
        <span>RUC</span>
        <span></span> {/* Espacio para ":" */}
      </div>
      <div className="list--container">
        {teachers.map((teacher) => (
          <div className="list" key={teacher.name}>
            <div className="teacher--detail">
              <h2>{teacher.name}</h2>
            </div>
            <span>{teacher.duration}</span>
            <span>{teacher.cost}</span>
            <span className="teacher--todo tooltip">
              <BiShow />
                <span className="tooltip-text">Ver información del cliente</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeacherList;
