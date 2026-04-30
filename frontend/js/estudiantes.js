import { Auth }                       from './auth.js';
import { Api }                        from './api.js';
import { Toast, Modal, Paginacion, Helpers } from './utils.js';
import { CONFIG }                     from './config.js';
import { Sidebar } from './sidebar.js';


if (!Auth.requireAuth()) throw new Error();
Auth.renderUsuario();
Sidebar.init();
document.getElementById('btnLogout')?.addEventListener('click', () => Auth.cerrarSesion());

// ─── Estado local ──────────────────────────────────────────────────────────────
let estadoPagina = {
  pagina:   1,
  busqueda: '',
  documento:'',
  activo:   'true',
};

// ─── Cargar tabla ──────────────────────────────────────────────────────────────
async function cargarEstudiantes() {
  const tbody = document.getElementById('tablaBody');
  tbody.innerHTML = `<tr><td colspan="6" class="tabla-vacia"><div class="spinner spinner-dark"></div></td></tr>`;

  try {
    const res = await Api.get('/estudiantes', {
      busqueda:  estadoPagina.busqueda,
      documento: estadoPagina.documento,
      activo:    estadoPagina.activo,
      page:      estadoPagina.pagina,
      limit:     CONFIG.ITEMS_PAGINA,
    });

    if (!res.data.length) {
      tbody.innerHTML = `<tr><td colspan="6">
        <div class="estado-vacio">
          <div class="estado-vacio-icono">👨‍🎓</div>
          <h3>No se encontraron estudiantes</h3>
          <p>Pruebe con otros criterios de búsqueda</p>
        </div></td></tr>`;
    } else {
      // tbody.innerHTML = res.data.map(e => `
      //   <tr>
      //     <td><code style="font-size:.83rem">${e.documento}</code></td>
      //     <td><strong>${e.apellido}</strong>, ${e.nombre}</td>
      //     <td>${e.email}</td>
      //     <td>${Helpers.formatFecha(e.fecha_nacimiento)}</td>
      //     <td>${Helpers.badgeActivo(e.activo)}</td>
      //     <td class="td-acciones">
      //       <div class="acciones">
      //         <button class="btn-icon" title="Ver detalles"
      //           onclick="verEstudiante(${e.id})">👁</button>
      //         ${e.activo
      //           ? `<button class="btn-icon exito" title="Editar"
      //                onclick="editarEstudiante(${e.id})">✏️</button>
      //              <button class="btn-icon peligro" title="Desactivar"
      //                onclick="eliminarEstudiante(${e.id}, '${e.apellido} ${e.nombre}')">🗑</button>`
      //           : `<button class="btn-icon" title="Restaurar"
      //                onclick="restaurarEstudiante(${e.id}, '${e.apellido} ${e.nombre}')">♻️</button>`
      //         }
      //       </div>
      //     </td>
      //   </tr>`).join('');
      tbody.innerHTML = res.data.map(e => `
  <tr>
    <td data-label="Documento">
      <code style="font-size:.83rem">${e.documento}</code>
    </td>
    <td data-label="Apellido y Nombre">
      <strong>${e.apellido}</strong>, ${e.nombre}
    </td>
    <td data-label="Email">${e.email}</td>
    <td data-label="Fecha Nac.">${Helpers.formatFecha(e.fecha_nacimiento)}</td>
    <td data-label="Estado">${Helpers.badgeActivo(e.activo)}</td>
    <td class="td-acciones">
      <div class="acciones">
        <button class="btn-icon" title="Ver detalles"
          onclick="verEstudiante(${e.id})">👁</button>
        ${e.activo
          ? `<button class="btn-icon exito" title="Editar"
               onclick="editarEstudiante(${e.id})">✏️</button>
             <button class="btn-icon peligro" title="Desactivar"
               onclick="eliminarEstudiante(${e.id}, '${e.apellido} ${e.nombre}')">🗑</button>`
          : `<button class="btn-icon" title="Restaurar"
               onclick="restaurarEstudiante(${e.id}, '${e.apellido} ${e.nombre}')">♻️</button>`
        }
      </div>
    </td>
  </tr>`).join('');
    }

    Paginacion.render('paginacionContainer', res.paginacion, (nuevaPag) => {
      estadoPagina.pagina = nuevaPag;
      cargarEstudiantes();
    });

  } catch (err) {
    Toast.error('Error al cargar estudiantes', err.message);
    tbody.innerHTML = `<tr><td colspan="6" class="tabla-vacia">Error al cargar datos</td></tr>`;
  }
}

// ─── Ver detalle (solo lectura) ────────────────────────────────────────────────
window.verEstudiante = async (id) => {
  try {
    const { data: e } = await Api.get(`/estudiantes/${id}`);
    Modal.confirmar({
      titulo: `👁 ${e.apellido}, ${e.nombre}`,
      mensaje: `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:.875rem">
          <div><strong>Documento:</strong><br>${e.documento}</div>
          <div><strong>Email:</strong><br>${e.email}</div>
          <div><strong>Fecha nac.:</strong><br>${Helpers.formatFecha(e.fecha_nacimiento)}</div>
          <div><strong>Estado:</strong><br>${Helpers.badgeActivo(e.activo)}</div>
          <div><strong>Últ. modificación:</strong><br>${Helpers.formatFechaHora(e.fecha_hora_modificacion)}</div>
          <div><strong>Modificado por:</strong><br>${e.usuario_modificacion || '—'}</div>
        </div>`,
      labelConfirmar: 'Cerrar',
      tipo:           'secundario',
      onConfirm:      () => {},
    });
  } catch (err) {
    Toast.error('Error', err.message);
  }
};

// ─── Formulario Crear/Editar ───────────────────────────────────────────────────
function abrirFormulario(estudiante = null) {
  Helpers.limpiarErrores('formEstudiante');
  document.getElementById('estudianteId').value       = estudiante?.id       || '';
  document.getElementById('apellido').value           = estudiante?.apellido  || '';
  document.getElementById('nombre').value             = estudiante?.nombre    || '';
  document.getElementById('documento').value          = estudiante?.documento || '';
  document.getElementById('email').value              = estudiante?.email     || '';
  document.getElementById('fecha_nacimiento').value   =
    estudiante?.fecha_nacimiento?.split('T')[0] || '';

  document.getElementById('modalTitulo').innerHTML =
    estudiante ? `✏️ Editar Estudiante` : `👨‍🎓 Nuevo Estudiante`;

  Modal.abrir('modalEstudiante');
  setTimeout(() => document.getElementById('apellido').focus(), 100);
}

window.editarEstudiante = async (id) => {
  try {
    const { data } = await Api.get(`/estudiantes/${id}`);
    abrirFormulario(data);
  } catch (err) {
    Toast.error('Error', err.message);
  }
};

document.getElementById('btnNuevo')?.addEventListener('click', () => abrirFormulario());
document.getElementById('btnCerrarModal')?.addEventListener('click', () => Modal.cerrar('modalEstudiante'));
document.getElementById('btnCancelarForm')?.addEventListener('click', () => Modal.cerrar('modalEstudiante'));

// ─── Guardar ──────────────────────────────────────────────────────────────────
document.getElementById('btnGuardar')?.addEventListener('click', async () => {
  Helpers.limpiarErrores('formEstudiante');

  const id    = document.getElementById('estudianteId').value;
  const datos = {
    apellido:         document.getElementById('apellido').value.trim(),
    nombre:           document.getElementById('nombre').value.trim(),
    documento:        document.getElementById('documento').value.trim(),
    email:            document.getElementById('email').value.trim(),
    fecha_nacimiento: document.getElementById('fecha_nacimiento').value,
  };

  // Validación client-side
  let ok = true;
  if (!datos.apellido)         { Helpers.marcarError('apellido',        'Requerido'); ok = false; }
  if (!datos.nombre)           { Helpers.marcarError('nombre',          'Requerido'); ok = false; }
  if (!datos.documento)        { Helpers.marcarError('documento',       'Requerido'); ok = false; }
  if (!datos.email)            { Helpers.marcarError('email',           'Requerido'); ok = false; }
  if (!datos.fecha_nacimiento) { Helpers.marcarError('fecha_nacimiento','Requerida'); ok = false; }
  if (!ok) return;

  const btn = document.getElementById('btnGuardar');
  Helpers.setLoading(btn, true);

  try {
    if (id) {
      await Api.put(`/estudiantes/${id}`, datos);
      Toast.exito('Estudiante actualizado', `${datos.apellido}, ${datos.nombre}`);
    } else {
      await Api.post('/estudiantes', datos);
      Toast.exito('Estudiante creado', `${datos.apellido}, ${datos.nombre}`);
    }
    Modal.cerrar('modalEstudiante');
    estadoPagina.pagina = 1;
    cargarEstudiantes();
  } catch (err) {
    // Mostrar errores de validación del servidor en los campos
    if (err.data?.errors) {
      err.data.errors.forEach(e => {
        Helpers.marcarError(e.path, e.msg);
      });
    } else {
      Toast.error('Error al guardar', err.message);
    }
  } finally {
    Helpers.setLoading(btn, false, '💾 Guardar');
  }
});

// ─── Soft Delete ──────────────────────────────────────────────────────────────
window.eliminarEstudiante = (id, nombre) => {
  Modal.confirmar({
    titulo:          '⚠️ Desactivar Estudiante',
    mensaje:         `¿Desea desactivar a <strong>${nombre}</strong>?<br><br>
                      <small style="color:var(--color-texto-sec)">
                      El registro no será eliminado, solo se marcará como inactivo.</small>`,
    labelConfirmar:  'Desactivar',
    tipo:            'peligro',
    onConfirm: async () => {
      try {
        await Api.delete(`/estudiantes/${id}`);
        Toast.advertencia('Estudiante desactivado', nombre);
        cargarEstudiantes();
      } catch (err) {
        Toast.error('Error', err.message);
      }
    },
  });
};

// ─── Restaurar ────────────────────────────────────────────────────────────────
window.restaurarEstudiante = (id, nombre) => {
  Modal.confirmar({
    titulo:         '♻️ Restaurar Estudiante',
    mensaje:        `¿Desea reactivar a <strong>${nombre}</strong>?`,
    labelConfirmar: 'Restaurar',
    tipo:           'exito',
    onConfirm: async () => {
      try {
        await Api.patch(`/estudiantes/${id}/restaurar`);
        Toast.exito('Estudiante restaurado', nombre);
        cargarEstudiantes();
      } catch (err) {
        Toast.error('Error', err.message);
      }
    },
  });
};

// ─── Filtros ──────────────────────────────────────────────────────────────────
document.getElementById('btnBuscar')?.addEventListener('click', () => {
  estadoPagina.pagina    = 1;
  estadoPagina.busqueda  = document.getElementById('filtroBusqueda').value.trim();
  estadoPagina.documento = document.getElementById('filtroDocumento').value.trim();
  estadoPagina.activo    = document.getElementById('filtroActivo').value;
  cargarEstudiantes();
});

document.getElementById('btnLimpiar')?.addEventListener('click', () => {
  document.getElementById('filtroBusqueda').value = '';
  document.getElementById('filtroDocumento').value = '';
  document.getElementById('filtroActivo').value    = 'true';
  estadoPagina = { pagina: 1, busqueda: '', documento: '', activo: 'true' };
  cargarEstudiantes();
});

// Buscar al presionar Enter
['filtroBusqueda', 'filtroDocumento'].forEach(id => {
  document.getElementById(id)?.addEventListener('keypress', e => {
    if (e.key === 'Enter') document.getElementById('btnBuscar').click();
  });
});

// ─── Init ──────────────────────────────────────────────────────────────────────
cargarEstudiantes();