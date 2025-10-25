// src/Modulos/Auth/NewLoginForm.jsx+
import React, { useState } from 'react';
import axios from 'axios'
import { useNavigate } from 'react-router-dom';
import '../../styles/LoginForm/LoginForm.css';
import { FaUser, FaLock } from "react-icons/fa";

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// opcional: fija la baseURL para el resto de llamadas
axios.defaults.baseURL = API;

const NewLoginForm = () => {
  const [dni, setDni] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // puede ser no-op si el componente no está bajo <Router>

  const safeRedirect = (path, replace = true) => {
  try { navigate(path, { replace }); return; } catch {}
  // fallback por si el componente no está bajo <Router>
  replace ? window.location.replace(path) : window.location.assign(path);
};

  const routeForUser = (user) => {
  switch (user?.rol) {
    case 'admin':           return '/admin';
    case 'cliente_admin':   return '/cliente-admin/lista-trabajadores'; // directo a la lista
    case 'cliente_usuario': return '/cliente-usuario';
    case 'medico':          return '/medico';
    default:                return '/';
  }
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dni: String(dni), password }),
      });

      if (!res.ok) {
        const msg = (await res.json().catch(() => ({})))?.msg || 'Credenciales incorrectas';
        setError(msg);
        setLoading(false);
        return;
      }

      const data = await res.json();
      console.log('Respuesta del backend:', data);

      const user = data?.user;
      const token = data?.token;
      if (!user?.id) {
        setError('Respuesta inválida del servidor (sin id).');
        setLoading(false);
        return;
      }

      // Guardar sesión
      const store = remember ? localStorage : sessionStorage;
      store.setItem('authUser', JSON.stringify(user));
      if (token) store.setItem('token', token);

      // Guardar sesión (aplanado: user + token), y limpiar el otro storage
     const payload = { ...user, token };
     if (remember) {
       localStorage.setItem('authUser', JSON.stringify(payload));
       sessionStorage.removeItem('authUser');
     } else {
       sessionStorage.setItem('authUser', JSON.stringify(payload));
       localStorage.removeItem('authUser');
     }

     // Configura Axios para que todas las requests lleven el Bearer
     if (token) {
       axios.defaults.headers.common.Authorization = `Bearer ${token}`;
     }

      // Construye y ejecuta la redirección
      const target = routeForUser(user);
      if (!target) {
        setError('No se pudo determinar la ruta para tu rol.');
        setLoading(false);
        return;
      }

      // Redirige (React Router o fallback)
      safeRedirect(target);

    } catch (err) {
      console.error(err);
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className='login-box'>
        <h2 className="welcome-message">BIENVENIDO AL SISTEMA DE GESTIÓN BLUE OPS</h2>

        <form onSubmit={handleSubmit}>
          <h1>Iniciar Sesión</h1>

          <div className="input-box">
            <input
              type="text"
              placeholder='DNI'
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              required
            />
            <FaUser className='icon' />
          </div>

          <div className="input-box">
            <input
              type="password"
              placeholder='Contraseña'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <FaLock className='icon' />
          </div>

          {error && <p style={{ color: 'red', fontSize: '0.9rem' }}>{error}</p>}

          <div className="remember-forgot">
            <label>
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              /> Recuérdame
            </label>
            <a href="#">¿Olvidaste tu contraseña?</a>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Ingresando…' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewLoginForm;
