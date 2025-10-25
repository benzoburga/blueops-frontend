// src/controllers/user.controller.js

// Simulación de usuarios (mock data)
const usuarios = [
  { id: 1, nombre: "Administrador BlueOps", rol: "admin" },
  { id: 2, nombre: "Empresa ABC", rol: "cliente_admin" },
  { id: 3, nombre: "Juan Pérez", rol: "cliente_usuario" },
  { id: 4, nombre: "Dra. García", rol: "medico" },
];

// Controlador para GET /api/usuarios
const obtenerUsuarios = (req, res) => {
  res.json(usuarios);
};

module.exports = { obtenerUsuarios };
