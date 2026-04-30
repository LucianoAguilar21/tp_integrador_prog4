// ─── Toast ────────────────────────────────────────────────────────────────────
const Toast = {
  _contenedor: null,

  _getContenedor() {
    if (!this._contenedor) {
      this._contenedor = document.getElementById('toastContenedor');
      if (!this._contenedor) {
        this._contenedor = document.createElement('div');
        this._contenedor.id = 'toastContenedor';
        this._contenedor.className = 'toast-contenedor';
        document.body.appendChild(this._contenedor);
      }
    }
    return this._contenedor;
  },

  _mostrar(tipo, titulo, mensaje, duracion = 4000) {
    const iconos = { exito: '✅', error: '❌', advertencia: '⚠️', info: 'ℹ️' };
    const el = document.createElement('div');
    el.className = `toast ${tipo}`;
    el.innerHTML = `
      <span class="toast-icono">${iconos[tipo]}</span>
      <div class="toast-texto">
        <div class="toast-titulo">${titulo}</div>
        ${mensaje ? `<div class="toast-mensaje">${mensaje}</div>` : ''}
      </div>`;

    this._getContenedor().appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateX(100%)';
      el.style.transition = '.3s ease';
      setTimeout(() => el.remove(), 300);
    }, duracion);
  },

  exito(titulo, mensaje = '')     { this._mostrar('exito',      titulo, mensaje); },
  error(titulo, mensaje = '')     { this._mostrar('error',      titulo, mensaje, 6000); },
  advertencia(titulo, mensaje='') { this._mostrar('advertencia',titulo, mensaje); },
  info(titulo, mensaje = '')      { this._mostrar('info',       titulo, mensaje); },
};

// ─── Modal ────────────────────────────────────────────────────────────────────
const Modal = {
  _stack: [],

  abrir(idModal) {
    const el = document.getElementById(idModal);
    if (!el) return;
    el.classList.add('activo');
    this._stack.push(idModal);
    document.body.style.overflow = 'hidden';
  },

  cerrar(idModal) {
    const el = document.getElementById(idModal);
    if (!el) return;
    el.classList.remove('activo');
    this._stack = this._stack.filter(id => id !== idModal);
    if (this._stack.length === 0) document.body.style.overflow = '';
  },

  cerrarActual() {
    if (this._stack.length) this.cerrar(this._stack[this._stack.length - 1]);
  },

  // Modal de confirmación genérico
  confirmar({ titulo, mensaje, labelConfirmar = 'Confirmar',
              tipo = 'peligro', onConfirm }) {
    let el = document.getElementById('modalConfirmar');
    if (!el) {
      el = document.createElement('div');
      el.id = 'modalConfirmar';
      el.className = 'modal-backdrop';
      el.innerHTML = `
        <div class="modal" style="max-width:420px">
          <div class="modal-header">
            <span class="modal-titulo" id="modalConfTitulo"></span>
            <button class="modal-cerrar" onclick="Modal.cerrar('modalConfirmar')">✕</button>
          </div>
          <div class="modal-body" id="modalConfMensaje"></div>
          <div class="modal-footer">
            <button class="btn btn-secundario" onclick="Modal.cerrar('modalConfirmar')">Cancelar</button>
            <button class="btn" id="modalConfBtn"></button>
          </div>
        </div>`;
      document.body.appendChild(el);
    }

    document.getElementById('modalConfTitulo').textContent = titulo;
    document.getElementById('modalConfMensaje').innerHTML  = mensaje;
    const btn = document.getElementById('modalConfBtn');
    btn.textContent = labelConfirmar;
    btn.className   = `btn btn-${tipo}`;
    btn.onclick = () => { Modal.cerrar('modalConfirmar'); onConfirm(); };

    this.abrir('modalConfirmar');
  },
};

// Cerrar modal al hacer clic en el backdrop
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-backdrop')) Modal.cerrarActual();
});

// ─── Paginación ───────────────────────────────────────────────────────────────
const Paginacion = {
  render(contenedorId, paginacion, onCambiar) {
    const { total, pagina, limite, total_paginas } = paginacion;
    const el = document.getElementById(contenedorId);
    if (!el) return;

    if (total === 0) { el.innerHTML = ''; return; }

    const inicio = (pagina - 1) * limite + 1;
    const fin    = Math.min(pagina * limite, total);

    // Generar botones de página
    let botonesHtml = '';
    const rango = 2;
    for (let i = 1; i <= total_paginas; i++) {
      if (
        i === 1 || i === total_paginas ||
        (i >= pagina - rango && i <= pagina + rango)
      ) {
        botonesHtml += `<button class="pag-btn ${i === pagina ? 'activo' : ''}"
          data-pagina="${i}">${i}</button>`;
      } else if (
        i === pagina - rango - 1 || i === pagina + rango + 1
      ) {
        botonesHtml += `<span style="padding:0 4px;color:var(--color-texto-sec)">…</span>`;
      }
    }

    el.innerHTML = `
      <div class="paginacion-info">
        Mostrando <strong>${inicio}–${fin}</strong> de <strong>${total}</strong> registros
      </div>
      <div class="paginacion-botones">
        <button class="pag-btn" data-pagina="${pagina - 1}" ${pagina === 1 ? 'disabled' : ''}>‹</button>
        ${botonesHtml}
        <button class="pag-btn" data-pagina="${pagina + 1}" ${pagina === total_paginas ? 'disabled' : ''}>›</button>
      </div>`;

    el.querySelectorAll('[data-pagina]').forEach(btn => {
      btn.addEventListener('click', () => {
        const nuevaPagina = parseInt(btn.dataset.pagina);
        if (!isNaN(nuevaPagina) && nuevaPagina !== pagina) {
          onCambiar(nuevaPagina);
        }
      });
    });
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const Helpers = {
  formatFecha(fechaStr) {
    if (!fechaStr) return '—';
    const d = new Date(fechaStr + (fechaStr.length === 10 ? 'T00:00:00' : ''));
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  },

  formatFechaHora(fechaStr) {
    if (!fechaStr) return '—';
    return new Date(fechaStr).toLocaleString('es-AR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  },

  badgeEstadoCurso(estado) {
    const mapa = {
      'activo':     'badge-verde',
      'inactivo':   'badge-rojo',
      'finalizado': 'badge-gris',
    };
    const clase = mapa[estado?.toLowerCase()] || 'badge-gris';
    return `<span class="badge ${clase}">${estado || '—'}</span>`;
  },

  badgeEstadoInscripcion(estado) {
    const mapa = {
      'inscripto':  'badge-azul',
      'aprobado':   'badge-verde',
      'cancelado':  'badge-rojo',
    };
    const clase = mapa[estado?.toLowerCase()] || 'badge-gris';
    return `<span class="badge ${clase}">${estado || '—'}</span>`;
  },

  badgeActivo(activo) {
    return activo
      ? '<span class="badge badge-verde">Activo</span>'
      : '<span class="badge badge-rojo">Inactivo</span>';
  },

  cupoHtml(actual, maximo) {
    const pct = maximo > 0 ? (actual / maximo) * 100 : 0;
    let clase = 'cupo-disponible';
    if (pct >= 100) clase = 'cupo-lleno';
    else if (pct >= 80) clase = 'cupo-limitado';
    return `<span class="cupo-badge ${clase}">${actual}/${maximo}</span>`;
  },

  setLoading(btnEl, cargando, textoOriginal) {
    if (cargando) {
      btnEl.disabled = true;
      btnEl._textoOriginal = btnEl.innerHTML;
      btnEl.innerHTML = `<span class="spinner"></span> Cargando…`;
    } else {
      btnEl.disabled = false;
      btnEl.innerHTML = btnEl._textoOriginal || textoOriginal || 'Aceptar';
    }
  },

  // Marcar campo inválido en formulario
  marcarError(inputId, mensaje) {
    const input = document.getElementById(inputId);
    const error = document.getElementById(`${inputId}Error`);
    if (input) input.classList.add('invalido');
    if (error) { error.textContent = mensaje; error.style.display = 'block'; }
  },

  limpiarErrores(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    form.querySelectorAll('.form-control.invalido').forEach(el => el.classList.remove('invalido'));
    form.querySelectorAll('.form-error').forEach(el => { el.textContent = ''; el.style.display = 'none'; });
  },
};

export { Toast, Modal, Paginacion, Helpers };