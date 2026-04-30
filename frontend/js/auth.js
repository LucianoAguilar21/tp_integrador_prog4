import { CONFIG } from './config.js';

const Auth = {

  getToken() {
    return localStorage.getItem(CONFIG.TOKEN_KEY);
  },

  getUsuario() {
    const raw = localStorage.getItem(CONFIG.USUARIO_KEY);
    try { return raw ? JSON.parse(raw) : null; }
    catch { return null; }
  },

  guardarSesion(token, usuario) {
    localStorage.setItem(CONFIG.TOKEN_KEY, token);
    localStorage.setItem(CONFIG.USUARIO_KEY, JSON.stringify(usuario));
  },

  cerrarSesion() {
    localStorage.removeItem(CONFIG.TOKEN_KEY);
    localStorage.removeItem(CONFIG.USUARIO_KEY);
    window.location.href = '/index.html';
  },

  estaAutenticado() {
    return !!this.getToken();
  },

  // Llama esta función al inicio de cada página protegida
  requireAuth() {
    if (!this.estaAutenticado()) {
      window.location.href = '/index.html';
      return false;
    }
    return true;
  },

  // Rellena el sidebar con datos del usuario
  renderUsuario() {
    const usuario = this.getUsuario();
    if (!usuario) return;

    const avatar = document.getElementById('usuarioAvatar');
    const nombre = document.getElementById('usuarioNombre');
    const rol    = document.getElementById('usuarioRol');

    if (avatar) avatar.textContent =
      (usuario.nombre?.[0] || '') + (usuario.apellido?.[0] || '');
    if (nombre) nombre.textContent =
      `${usuario.nombre} ${usuario.apellido}`;
    if (rol) rol.textContent = 'Administrador';
  },
};

export { Auth };