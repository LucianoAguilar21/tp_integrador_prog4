import { CONFIG } from './config.js';
import { Auth }   from './auth.js';

const Api = {

  /**
   * Método base de petición
   */
  async _request(endpoint, options = {}) {
    const token = Auth.getToken();

    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    let url = `${CONFIG.API_URL}${endpoint}`;

    // Convertir params a query string si se pasan
    if (options.params) {
      const qs = new URLSearchParams(
        Object.entries(options.params).filter(
          ([, v]) => v !== undefined && v !== null && v !== ''
        )
      ).toString();
      if (qs) url += `?${qs}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      // Token expirado → redirigir al login
      if (response.status === 401) {
        Auth.cerrarSesion();
        return;
      }

      // Para PDFs u otros binarios devolver la response cruda
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/pdf')) {
        if (!response.ok) throw new Error('Error al generar el PDF');
        return response.blob();
      }

      const data = await response.json();

      if (!response.ok) {
        const mensaje = data?.message || 'Error en la solicitud';
        const error   = new Error(mensaje);
        error.status  = response.status;
        error.data    = data;
        throw error;
      }

      return data;
    } catch (error) {
      if (error.name === 'TypeError') {
        throw new Error('No se puede conectar al servidor. Verifique la conexión.');
      }
      throw error;
    }
  },

  get(endpoint, params = {}) {
    return this._request(endpoint, { method: 'GET', params });
  },

  post(endpoint, body) {
    return this._request(endpoint, { method: 'POST', body });
  },

  put(endpoint, body) {
    return this._request(endpoint, { method: 'PUT', body });
  },

  patch(endpoint, body = {}) {
    return this._request(endpoint, { method: 'PATCH', body });
  },

  delete(endpoint) {
    return this._request(endpoint, { method: 'DELETE' });
  },

  // Descarga un PDF directamente abriendo nueva pestaña
  async descargarPdf(endpoint, nombreArchivo) {
    const token = Auth.getToken();
    const response = await fetch(`${CONFIG.API_URL}${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Error al generar el PDF');
    const blob = await response.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.download = nombreArchivo;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  },
};

export { Api };