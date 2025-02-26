import React from 'react';
import { BiUserPlus,  BiTrash,  BiUpload, } from 'react-icons/bi';

const courses = [
    {
      title: 'Crear Cliente',
      icon: <BiUserPlus />,
    },
    {
      title: 'Eliminar Cliente',
      duration: '2 Hours',
      icon: <BiTrash />,
    },
    {
      title: 'Subir Archivo',
      duration: '2 Hours',
      icon: <BiUpload />,
    },
  ];
  
  const Card = () => {
    return (
      <div className="card--container">
        {courses.map((item) => (
          <div className="card">
            <div className="card--cover">{item.icon}</div>
            <div className="card--title">
              <h2>{item.title}</h2>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  

export default Card;