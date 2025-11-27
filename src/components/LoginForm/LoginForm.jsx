// src/Modulos/Auth/NewLoginForm.jsx
import React, { useState } from 'react';
import api, { setAuthToken } from '@/services/api';
import { useNavigate } from 'react-router-dom';
import '../../styles/loginform/loginform.css';
import { FaUser, FaLock } from 'react-icons/fa';

const NewLoginForm = () => {
  const [dni, setDni] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const safeRedirect = (path, replace = true) => {
    try { navigate(path, { replace }); return; } catch {}
    replace ? window.location.replace(path) : window.location.assign(path);
  };

  const routeForUser = (user) => {
    switch (user?.rol) {
      case 'admin':           return '/admin';
      case 'cliente_admin':   return '/cliente-admin/lista-trabajadores';
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
      // usamos la instancia `api` (baseURL: '/api')
      const res = await api.post('/login', { dni, password });

      const data  = res?.data || {};
      const user  = data.user;
      const token = data.token;

      if (!user?.id) {
        setError('Respuesta inválida del servidor (sin id).');
        setLoading(false);
        return;
      }

      // Guarda sesión (aplanado: user + token) en el storage elegido
      const payload = { ...user, token };
      if (remember) {
        localStorage.setItem('authUser', JSON.stringify(payload));
        sessionStorage.removeItem('authUser');
      } else {
        sessionStorage.setItem('authUser', JSON.stringify(payload));
        localStorage.removeItem('authUser');
      }

      // Inyecta el token en axios y en la instancia `api`
      if (token) setAuthToken(token);

      // Redirección según rol
      const target = routeForUser(user);
      if (!target) {
        setError('No se pudo determinar la ruta para tu rol.');
        setLoading(false);
        return;
      }
      safeRedirect(target);
    } catch (err) {
      // si el backend devuelve msg legible, muéstralo
      const msg = err?.response?.data?.msg || 'Error de conexión con el servidor';
      console.error('Login error:', err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2 className="welcome-message">BIENVENIDO AL SISTEMA DE GESTIÓN BLUE OPS</h2>

        <form onSubmit={handleSubmit}>
          <h1>Iniciar Sesión</h1>

          <div className="input-box">
            <input
              type="text"
              placeholder="DNI"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              required
            />
            <FaUser className="icon" />
          </div>

          <div className="input-box">
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <FaLock className="icon" />
          </div>

          {error && <p style={{ color: 'red', fontSize: '0.9rem' }}>{error}</p>}

          <div className="remember-forgot">
            <label>
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />{' '}
              Recuérdame
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
