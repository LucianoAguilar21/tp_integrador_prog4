import { Auth }                             from './auth.js';
import { Api }                              from './api.js';
import { Toast, Modal, Paginacion, Helpers } from './utils.js';
import { CONFIG }                           from './config.js';
import { Sidebar } from './sidebar.js';


if (!Auth.requireAuth()) throw new Error();
Auth.renderUsuario();
Sidebar.init();
document.getElementById('btnLogout')
  ?.addEventListener('click', () => Auth.cerrarSesion());

// ─── Estado local ──────────────────────────────────────────────────────────────
let estado = {
  pagina:    1,
  busqueda:  '',
  id_estado: '',
};

// ID del curso actualmente visible en el modal de inscriptos
let cursoSeleccionadoId = null;

// ─── Cargar estados en filtro y formulario ─────────────────────────────────────
async function cargarEstados() {
  try {
    const { data } = await Api.get('/cursos/estados');

    // Filtro
    const filtro = document.getElementById('filtroEstado');
    data.forEach(e => {
      filtro.innerHTML += `<option value="${e.id}">${e.descripcion}</option>`;
    });

    // Select del formulario
    const select = document.getElementById('id_curso_estado');
    data.forEach(e => {
      select.innerHTML += `<option value="${e.id}">${e.descripcion}</option>`;
    });
  } catch (err) {
    Toast.error('Error al cargar estados', err.message);
  }
}

// ─── Cargar tabla ──────────────────────────────────────────────────────────────
async function cargarCursos() {
  const tbody = document.getElementById('tablaBody');
  tbody.innerHTML = `<tr><td colspan="6" class="tabla-vacia">
    <div class="spinner spinner-dark"></div></td></tr>`;

  try {
    const res = await Api.get('/cursos', {
      busqueda:  estado.busqueda,
      id_estado: estado.id_estado,
      page:      estado.pagina,
      limit:     CONFIG.ITEMS_PAGINA,
    });

    if (!res.data.length) {
      tbody.innerHTML = `<tr><td colspan="6">
        <div class="estado-vacio">
          <div class="estado-vacio-icono">📚</div>
          <h3>No se encontraron cursos</h3>
          <p>Pruebe con otros criterios de búsqueda</p>
        </div></td></tr>`;
    } else {
      // tbody.innerHTML = res.data.map(c => `
      //   <tr>
      //     <td>
      //       <div style="font-weight:600;color:var(--color-primario)">${c.nombre}</div>
      //       ${c.descripcion
      //         ? `<div style="font-size:.78rem;color:var(--color-texto-sec);
      //                        white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
      //                        max-width:280px">${c.descripcion}</div>`
      //         : ''}
      //     </td>
      //     <td style="white-space:nowrap">${Helpers.formatFecha(c.fecha_inicio)}</td>
      //     <td style="text-align:center">${c.cantidad_horas}h</td>
      //     <td>${Helpers.cupoHtml(c.inscriptos_actuales, c.inscriptos_max)}</td>
      //     <td>${Helpers.badgeEstadoCurso(c.estado)}</td>
      //     <td>
      //       <div class="acciones">
      //         <button class="btn-icon" title="Ver inscriptos"
      //           onclick="verInscriptos(${c.id}, '${escapar(c.nombre)}')">👥</button>
      //         <button class="btn-icon exito" title="Editar"
      //           onclick="editarCurso(${c.id})">✏️</button>
      //         <button class="btn-icon" title="Descargar listado PDF"
      //           onclick="descargarListado(${c.id}, '${escapar(c.nombre)}', this)">📄</button>
      //         <button class="btn-icon peligro" title="Desactivar"
      //           onclick="eliminarCurso(${c.id}, '${escapar(c.nombre)}')">🗑</button>
      //       </div>
      //     </td>
      //   </tr>`).join('');
      tbody.innerHTML = res.data.map(c => `
  <tr>
    <td data-label="Nombre">
      <div style="font-weight:600;color:var(--color-primario)">${c.nombre}</div>
      ${c.descripcion
        ? `<div style="font-size:.78rem;color:var(--color-texto-sec);
                       max-width:260px;overflow:hidden;text-overflow:ellipsis;
                       white-space:nowrap">${c.descripcion}</div>`
        : ''}
    </td>
    <td data-label="Inicio" style="white-space:nowrap">
      ${Helpers.formatFecha(c.fecha_inicio)}
    </td>
    <td data-label="Horas" style="text-align:center">${c.cantidad_horas}h</td>
    <td data-label="Cupo">${Helpers.cupoHtml(c.inscriptos_actuales, c.inscriptos_max)}</td>
    <td data-label="Estado">${Helpers.badgeEstadoCurso(c.estado)}</td>
    <td class="td-acciones">
      <div class="acciones">
        <button class="btn-icon" title="Ver inscriptos"
          onclick="verInscriptos(${c.id}, '${escapar(c.nombre)}')">👥</button>
        <button class="btn-icon exito" title="Editar"
          onclick="editarCurso(${c.id})">✏️</button>
        <button class="btn-icon" title="Descargar PDF"
          onclick="descargarListado(${c.id}, '${escapar(c.nombre)}', this)">📄</button>
        <button class="btn-icon peligro" title="Desactivar"
          onclick="eliminarCurso(${c.id}, '${escapar(c.nombre)}')">🗑</button>
      </div>
    </td>
  </tr>`).join('');
    }

    Paginacion.render('paginacionContainer', res.paginacion, (nuevaPag) => {
      estado.pagina = nuevaPag;
      cargarCursos();
    });

  } catch (err) {
    Toast.error('Error al cargar cursos', err.message);
    tbody.innerHTML = `<tr><td colspan="6" class="tabla-vacia">Error al cargar datos</td></tr>`;
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
// Escapa comillas simples para uso en atributos HTML onclick
function escapar(str) {
  return (str || '').replace(/'/g, "\\'");
}

// ─── Ver inscriptos en modal ────────────────────────────────────────────────────
window.verInscriptos = async (id, nombre) => {
  cursoSeleccionadoId = id;
  document.getElementById('modalInscriptosTitulo').textContent = `👥 Inscriptos — ${nombre}`;
  const tbody = document.getElementById('tablaInscriptos');
  tbody.innerHTML = `<tr><td colspan="6" class="tabla-vacia">
    <div class="spinner spinner-dark"></div></td></tr>`;

  Modal.abrir('modalInscriptos');

  try {
    const { data } = await Api.get(`/cursos/${id}/inscriptos`);
    const { inscriptos } = data;

    if (!inscriptos.length) {
      tbody.innerHTML = `<tr><td colspan="6">
        <div class="estado-vacio">
          <div class="estado-vacio-icono">👥</div>
          <h3>Sin inscriptos</h3>
          <p>Aún no hay estudiantes inscriptos en este curso</p>
        </div></td></tr>`;
    } else {
      tbody.innerHTML = inscriptos.map((i, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td><code style="font-size:.82rem">${i.documento}</code></td>
          <td><strong>${i.apellido}</strong>, ${i.nombre}</td>
          <td style="font-size:.82rem">${i.email}</td>
          <td style="font-size:.78rem;white-space:nowrap">
            ${Helpers.formatFechaHora(i.fecha_hora_inscripcion)}</td>
          <td>${Helpers.badgeEstadoInscripcion(i.estado_inscripcion)}</td>
        </tr>`).join('');
    }
  } catch (err) {
    Toast.error('Error al cargar inscriptos', err.message);
    tbody.innerHTML = `<tr><td colspan="6" class="tabla-vacia">Error al cargar datos</td></tr>`;
  }
};

// Botón descargar dentro del modal de inscriptos
document.getElementById('btnDescargarListado')
  ?.addEventListener('click', async function () {
    if (!cursoSeleccionadoId) return;
    const btn = this;
    Helpers.setLoading(btn, true);
    try {
      const nombre = document.getElementById('modalInscriptosTitulo')
        .textContent.replace('👥 Inscriptos — ', '');
      await Api.descargarPdf(
        `/cursos/${cursoSeleccionadoId}/pdf/listado`,
        `listado-${nombre.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.pdf`
      );
      Toast.exito('PDF generado', 'El listado se descargó correctamente');
    } catch (err) {
      Toast.error('Error al generar PDF', err.message);
    } finally {
      Helpers.setLoading(btn, false, '📄 Descargar PDF');
    }
  });

// ─── Descargar listado desde la tabla (botón de fila) ─────────────────────────
window.descargarListado = async (id, nombre, btnEl) => {
  Helpers.setLoading(btnEl, true);
  try {
    await Api.descargarPdf(
      `/cursos/${id}/pdf/listado`,
      `listado-${nombre.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.pdf`
    );
    Toast.exito('PDF generado', 'El listado se descargó correctamente');
  } catch (err) {
    Toast.error('Error al generar PDF', err.message);
  } finally {
    Helpers.setLoading(btnEl, false, '📄');
  }
};

// ─── Abrir formulario (crear / editar) ─────────────────────────────────────────
function abrirFormulario(curso = null) {
  Helpers.limpiarErrores('formCurso');

  document.getElementById('cursoId').value          = curso?.id              || '';
  document.getElementById('nombre').value           = curso?.nombre          || '';
  document.getElementById('descripcion').value      = curso?.descripcion     || '';
  document.getElementById('fecha_inicio').value     =
    curso?.fecha_inicio?.split('T')[0]              || '';
  document.getElementById('cantidad_horas').value   = curso?.cantidad_horas  || '';
  document.getElementById('inscriptos_max').value   = curso?.inscriptos_max  || '';
  document.getElementById('id_curso_estado').value  = curso?.id_curso_estado || '';

  document.getElementById('modalTitulo').innerHTML =
    curso ? '✏️ Editar Curso' : '📚 Nuevo Curso';

  Modal.abrir('modalCurso');
  setTimeout(() => document.getElementById('nombre').focus(), 100);
}

window.editarCurso = async (id) => {
  try {
    const { data } = await Api.get(`/cursos/${id}`);
    abrirFormulario(data);
  } catch (err) {
    Toast.error('Error al cargar el curso', err.message);
  }
};

document.getElementById('btnNuevo')
  ?.addEventListener('click', () => abrirFormulario());
document.getElementById('btnCerrarModal')
  ?.addEventListener('click', () => Modal.cerrar('modalCurso'));
document.getElementById('btnCancelarForm')
  ?.addEventListener('click', () => Modal.cerrar('modalCurso'));

// ─── Guardar (crear / actualizar) ─────────────────────────────────────────────
document.getElementById('btnGuardar')
  ?.addEventListener('click', async () => {
    Helpers.limpiarErrores('formCurso');

    const id    = document.getElementById('cursoId').value;
    const datos = {
      nombre:          document.getElementById('nombre').value.trim(),
      descripcion:     document.getElementById('descripcion').value.trim() || null,
      fecha_inicio:    document.getElementById('fecha_inicio').value,
      cantidad_horas:  parseInt(document.getElementById('cantidad_horas').value),
      inscriptos_max:  parseInt(document.getElementById('inscriptos_max').value),
      id_curso_estado: parseInt(document.getElementById('id_curso_estado').value),
    };

    // Validación client-side
    let ok = true;
    if (!datos.nombre) {
      Helpers.marcarError('nombre', 'El nombre es requerido'); ok = false;
    }
    if (!datos.fecha_inicio) {
      Helpers.marcarError('fecha_inicio', 'La fecha de inicio es requerida'); ok = false;
    }
    if (!datos.cantidad_horas || datos.cantidad_horas < 1) {
      Helpers.marcarError('cantidad_horas', 'Debe ser al menos 1 hora'); ok = false;
    }
    if (!datos.inscriptos_max || datos.inscriptos_max < 1) {
      Helpers.marcarError('inscriptos_max', 'Debe ser al menos 1'); ok = false;
    }
    if (!datos.id_curso_estado) {
      Helpers.marcarError('id_curso_estado', 'Seleccione un estado'); ok = false;
    }
    if (!ok) return;

    const btn = document.getElementById('btnGuardar');
    Helpers.setLoading(btn, true);

    try {
      if (id) {
        await Api.put(`/cursos/${id}`, datos);
        Toast.exito('Curso actualizado', datos.nombre);
      } else {
        await Api.post('/cursos', datos);
        Toast.exito('Curso creado', datos.nombre);
      }
      Modal.cerrar('modalCurso');
      estado.pagina = 1;
      cargarCursos();
    } catch (err) {
      if (err.data?.errors) {
        err.data.errors.forEach(e => Helpers.marcarError(e.path, e.msg));
      } else {
        Toast.error('Error al guardar', err.message);
      }
    } finally {
      Helpers.setLoading(btn, false, '💾 Guardar');
    }
  });

// ─── Desactivar curso ─────────────────────────────────────────────────────────
window.eliminarCurso = (id, nombre) => {
  Modal.confirmar({
    titulo:         '⚠️ Desactivar Curso',
    mensaje:        `¿Desea desactivar el curso <strong>${nombre}</strong>?<br><br>
                     <small style="color:var(--color-texto-sec)">
                     Solo se puede desactivar si no tiene inscriptos activos.<br>
                     El estado cambiará a "Inactivo".</small>`,
    labelConfirmar: 'Desactivar',
    tipo:           'peligro',
    onConfirm: async () => {
      try {
        await Api.delete(`/cursos/${id}`);
        Toast.advertencia('Curso desactivado', nombre);
        cargarCursos();
      } catch (err) {
        Toast.error('No se puede desactivar', err.message);
      }
    },
  });
};

// ─── Filtros ──────────────────────────────────────────────────────────────────
document.getElementById('btnBuscar')
  ?.addEventListener('click', () => {
    estado.pagina    = 1;
    estado.busqueda  = document.getElementById('filtroBusqueda').value.trim();
    estado.id_estado = document.getElementById('filtroEstado').value;
    cargarCursos();
  });

document.getElementById('btnLimpiar')
  ?.addEventListener('click', () => {
    document.getElementById('filtroBusqueda').value = '';
    document.getElementById('filtroEstado').value   = '';
    estado = { pagina: 1, busqueda: '', id_estado: '' };
    cargarCursos();
  });

document.getElementById('filtroBusqueda')
  ?.addEventListener('keypress', e => {
    if (e.key === 'Enter') document.getElementById('btnBuscar').click();
  });

// ─── Init ─────────────────────────────────────────────────────────────────────
cargarEstados();
cargarCursos();