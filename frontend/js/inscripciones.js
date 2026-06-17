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
  pagina:        1,
  id_curso:      '',
  id_estudiante: '',
  id_estado:     '',
};

// Cache de cursos para el info de cupo
let cacheCursos = [];

// Estados de inscripciones (cargados desde API)
let estadosInscripciones = [];

// ─── Cargar selects de filtros y formulario ────────────────────────────────────
async function cargarSelects() {
  try {
    // Cargar en paralelo
    const [resCursos, resEstudiantes, resEstados] = await Promise.all([
      Api.get('/cursos',      { limit: 200 }),
      Api.get('/estudiantes', { limit: 500, activo: 'true' }),
      Api.get('/inscripciones/estados'),
    ]);

    cacheCursos = resCursos.data;

    // ── Selects de FILTRO ──────────────────────────────────────────────────
    const filtroCurso = document.getElementById('filtroCurso');
    resCursos.data.forEach(c => {
      filtroCurso.innerHTML +=
        `<option value="${c.id_curso}">${c.nombre} (${c.estado})</option>`;
    });

    const filtroEst = document.getElementById('filtroEstudiante');
    resEstudiantes.data.forEach(e => {
      filtroEst.innerHTML +=
        `<option value="${e.id_estudiante}">${e.apellido}, ${e.nombres} — ${e.documento}</option>`;
    });

    const filtroEst2 = document.getElementById('filtroEstado');
    estadosInscripciones = resEstados.data;
    resEstados.data.forEach(e => {
      filtroEst2.innerHTML += `<option value="${e.id_estado}">${e.descripcion}</option>`;
    });

    // ── Select FORMULARIO — solo cursos activos ────────────────────────────
    const formCurso = document.getElementById('id_curso');
    formCurso.innerHTML = '<option value="">Seleccione un curso…</option>';
    
    resCursos.data
      .filter(c => c.estado.toLowerCase() == 'INSCRIPCIÓN ABIERTA'.toLowerCase())
      .forEach(c => {
        const cupoLabel = c.inscriptos_actuales >= c.inscriptos_max
          ? '🔴 Sin cupo'
          : `🟢 ${c.cupo_disponible ?? (c.inscriptos_max - c.inscriptos_actuales)} disponibles`;
        formCurso.innerHTML +=
          `<option value="${c.id_curso}"
            ${c.inscriptos_actuales >= c.inscriptos_max ? 'disabled' : ''}>
            ${c.nombre} — ${cupoLabel}
          </option>`;
      });

    // ── Select FORMULARIO — estudiantes activos ────────────────────────────
    const formEst = document.getElementById('id_estudiante');
    formEst.innerHTML = '<option value="">Seleccione un estudiante…</option>';
    resEstudiantes.data.forEach(e => {
      formEst.innerHTML +=
        `<option value="${e.id_estudiante}">${e.apellido}, ${e.nombres} — ${e.documento}</option>`;
    });

  } catch (err) {
    Toast.error('Error al cargar datos', err.message);
  }
}

// ── Mostrar info de cupo al elegir un curso en el formulario ───────────────────
document.getElementById('id_curso')
  ?.addEventListener('change', function () {
    const infoCupo = document.getElementById('infoCupo');
    const curso = cacheCursos.find(c => c.id_curso === parseInt(this.value));

    if (!curso) { infoCupo.style.display = 'none'; return; }

    const disponible = curso.inscriptos_max - curso.inscriptos_actuales;
    const pct = Math.round((curso.inscriptos_actuales / curso.inscriptos_max) * 100);

    let color = 'var(--color-info-bg)';
    let borde  = '#bbdefb';
    let texto  = 'var(--color-info)';
    if (disponible === 0) {
      color = 'var(--color-error-bg)'; borde = '#ffcdd2'; texto = 'var(--color-error)';
    } else if (pct >= 80) {
      color = 'var(--color-advertencia-bg)'; borde = '#ffe082'; texto = 'var(--color-advertencia)';
    }

    infoCupo.style.cssText = `display:block;margin-bottom:16px;padding:10px 14px;
      border-radius:var(--radio);font-size:.85rem;
      background:${color};color:${texto};border:1px solid ${borde}`;

    infoCupo.innerHTML = `
      <strong>${curso.nombre}</strong><br>
      📅 Inicio: ${Helpers.formatFecha(curso.fecha_inicio)} &nbsp;·&nbsp;
      ⏱ ${curso.cantidad_horas}h &nbsp;·&nbsp;
      👥 Inscriptos: ${curso.inscriptos_actuales}/${curso.inscriptos_max}
      (${disponible > 0 ? `${disponible} lugar${disponible !== 1 ? 'es' : ''} disponible${disponible !== 1 ? 's' : ''}` : 'Sin cupo disponible'})`;
  });

// ─── Cargar tabla ──────────────────────────────────────────────────────────────
async function cargarInscripciones() {
  const tbody = document.getElementById('tablaBody');
  tbody.innerHTML = `<tr><td colspan="5" class="tabla-vacia">
    <div class="spinner spinner-dark"></div></td></tr>`;

  try {
    const res = await Api.get('/inscripciones', {
      id_curso:      estado.id_curso,
      id_estudiante: estado.id_estudiante,
      id_estado:     estado.id_estado,
      page:          estado.pagina,
      limit:         CONFIG.ITEMS_PAGINA,
    });

    if (!res.data.length) {
      tbody.innerHTML = `<tr><td colspan="5">
        <div class="estado-vacio">
          <div class="estado-vacio-icono">📝</div>
          <h3>No se encontraron inscripciones</h3>
          <p>Pruebe con otros criterios de búsqueda</p>
        </div></td></tr>`;
    } else {
      // tbody.innerHTML = res.data.map(i => {
      //   // Botones de acción según estado
      //   const esInscripto = i.estado?.toLowerCase() === 'inscripto';
      //   const esAprobado  = i.estado?.toLowerCase() === 'aprobado';
      //   const esCancelado = i.estado?.toLowerCase() === 'cancelado';

      //   return `
      //   <tr>
      //     <td>
      //       <div style="font-weight:600">${i.estudiante}</div>
      //       <div style="font-size:.78rem;color:var(--color-texto-sec)">
      //         ${i.documento} · ${i.email}
      //       </div>
      //     </td>
      //     <td>
      //       <div style="font-weight:500;color:var(--color-primario)">${i.curso}</div>
      //       <div style="font-size:.78rem;color:var(--color-texto-sec)">
      //         📅 ${Helpers.formatFecha(i.fecha_inicio)} · ⏱ ${i.cantidad_horas}h
      //       </div>
      //     </td>
      //     <td style="font-size:.82rem;white-space:nowrap">
      //       ${Helpers.formatFechaHora(i.fecha_hora_inscripcion)}
      //     </td>
      //     <td>${Helpers.badgeEstadoInscripcion(i.estado)}</td>
      //     <td>
      //       <div class="acciones">
      //         <button class="btn-icon" title="Ver detalle"
      //           onclick="verDetalle(${i.id})">👁</button>

      //         ${esInscripto ? `
      //           <button class="btn-icon exito" title="Aprobar"
      //             onclick="aprobarInscripcion(${i.id}, '${escapar(i.estudiante)}')">✅</button>
      //           <button class="btn-icon peligro" title="Cancelar inscripción"
      //             onclick="cancelarInscripcion(${i.id}, '${escapar(i.estudiante)}')">❌</button>
      //         ` : ''}

      //         ${esAprobado ? `
      //           <button class="btn-icon exito" title="Descargar diploma"
      //             onclick="descargarDiploma(${i.id}, '${escapar(i.estudiante)}', this)">🏅</button>
      //         ` : ''}

      //         ${esCancelado ? `
      //           <span style="font-size:.75rem;color:var(--color-texto-sec);padding:0 4px">
      //             Cancelado
      //           </span>
      //         ` : ''}
      //       </div>
      //     </td>
      //   </tr>`;
      // }).join('');
      tbody.innerHTML = res.data.map(i => {
  const esInscripto = i.estado?.toLowerCase() === 'inscripto';
  const esAprobado  = i.estado?.toLowerCase() === 'aprobado';
  const esCancelado = i.estado?.toLowerCase() === 'cancelado';

  return `
  <tr>
    <td data-label="Estudiante">
      <div style="font-weight:600">${i.estudiante}</div>
      <div style="font-size:.78rem;color:var(--color-texto-sec)">
        ${i.documento}
      </div>
    </td>
    <td data-label="Curso">
      <div style="font-weight:500;color:var(--color-primario)">${i.curso}</div>
      <div style="font-size:.78rem;color:var(--color-texto-sec)">
        📅 ${Helpers.formatFecha(i.fecha_inicio)} · ⏱ ${i.cantidad_horas}h
      </div>
    </td>
    <td data-label="Fecha" style="font-size:.82rem;white-space:nowrap">
      ${Helpers.formatFechaHora(i.fecha_hora_inscripcion)}
    </td>
    <td data-label="Estado">${Helpers.badgeEstadoInscripcion(i.estado)}</td>
    <td class="td-acciones">
      <div class="acciones">
        <button class="btn-icon" title="Ver detalle"
          onclick="verDetalle(${i.id_inscripcion ?? i.id})">👁</button>
        ${esInscripto ? `
          <button class="btn-icon exito" title="Aprobar"
            onclick="aprobarInscripcion(${i.id_inscripcion ?? i.id}, '${escapar(i.estudiante)}')">✅</button>
          <button class="btn-icon peligro" title="Cancelar"
            onclick="cancelarInscripcion(${i.id_inscripcion ?? i.id}, '${escapar(i.estudiante)}')">❌</button>
        ` : ''}
        ${esAprobado ? `
          <button class="btn-icon exito" title="Diploma"
            onclick="descargarDiploma(${i.id_inscripcion ?? i.id}, '${escapar(i.estudiante)}', this)">🏅</button>
        ` : ''}
      </div>
    </td>
  </tr>`;
}).join('');
    }

    Paginacion.render('paginacionContainer', res.paginacion, (nuevaPag) => {
      estado.pagina = nuevaPag;
      cargarInscripciones();
    });

  } catch (err) {
    Toast.error('Error al cargar inscripciones', err.message);
    tbody.innerHTML = `<tr><td colspan="5" class="tabla-vacia">Error al cargar datos</td></tr>`;
  }
}

// ─── Helper ────────────────────────────────────────────────────────────────────
function escapar(str) {
  return (str || '').replace(/'/g, "\\'");
}

// ─── Ver detalle ───────────────────────────────────────────────────────────────
window.verDetalle = async (id) => {
  if (!id) {
    Toast.error('Error', 'ID de inscripción inválido');
    return;
  }

  try {
    const { data: i } = await Api.get(`/inscripciones/${id}`);

    const esAprobado = i.estado?.toLowerCase() === 'aprobado';

    document.getElementById('modalDetalleBody').innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;font-size:.875rem">
        <div style="grid-column:1/-1">
          <strong style="font-size:.75rem;text-transform:uppercase;
            color:var(--color-texto-sec);letter-spacing:.05em">Estudiante</strong>
          <div style="font-size:1.05rem;font-weight:600;margin-top:2px">${i.estudiante}</div>
          <div style="color:var(--color-texto-sec)">${i.documento} · ${i.email}</div>
        </div>
        <div style="grid-column:1/-1;border-top:1px solid var(--color-borde);padding-top:14px">
          <strong style="font-size:.75rem;text-transform:uppercase;
            color:var(--color-texto-sec);letter-spacing:.05em">Curso</strong>
          <div style="font-size:1.05rem;font-weight:600;margin-top:2px">${i.curso}</div>
          <div style="color:var(--color-texto-sec)">
            📅 Inicio: ${Helpers.formatFecha(i.fecha_inicio)} &nbsp;·&nbsp; ⏱ ${i.cantidad_horas}h
          </div>
        </div>
        <div>
          <strong>Estado</strong><br>
          ${Helpers.badgeEstadoInscripcion(i.estado)}
        </div>
        <div>
          <strong>Fecha de Inscripción</strong><br>
          ${Helpers.formatFechaHora(i.fecha_hora_inscripcion)}
        </div>
        <div>
          <strong>Última modificación</strong><br>
          <span style="color:var(--color-texto-sec)">
            ${Helpers.formatFechaHora(i.fecha_hora_modificacion)}
          </span>
        </div>
        <div>
          <strong>Modificado por</strong><br>
          <span style="color:var(--color-texto-sec)">${i.usuario_modificacion || '—'}</span>
        </div>
      </div>`;

    // Mostrar botón diploma solo si está aprobado
    const footer = document.getElementById('modalDetalleFooter');
    footer.innerHTML = `
      <button class="btn btn-secundario" onclick="Modal.cerrar('modalDetalle')">Cerrar</button>
      ${esAprobado
        ? `<button class="btn btn-exito"
             onclick="descargarDiploma(${i.id}, '${escapar(i.estudiante)}', this)">
             🏅 Descargar Diploma
           </button>`
        : ''}`;

    Modal.abrir('modalDetalle');
  } catch (err) {
    Toast.error('Error al cargar el detalle', err.message);
  }
};

// ─── Aprobar inscripción ───────────────────────────────────────────────────────
window.aprobarInscripcion = (id, nombre) => {
  Modal.confirmar({
    titulo:         '✅ Aprobar Inscripción',
    mensaje:        `¿Desea aprobar la inscripción de <strong>${nombre}</strong>?<br><br>
                     <small style="color:var(--color-texto-sec)">
                     Se habilitará la generación del diploma.</small>`,
    labelConfirmar: 'Aprobar',
    tipo:           'exito',
    onConfirm: async () => {
      try {
        await Api.patch(`/inscripciones/${id}/aprobar`);
        Toast.exito('Inscripción aprobada', nombre);
        cargarInscripciones();
      } catch (err) {
        Toast.error('Error al aprobar', err.message);
      }
    },
  });
};

// ─── Cancelar inscripción ──────────────────────────────────────────────────────
window.cancelarInscripcion = (id, nombre) => {
  Modal.confirmar({
    titulo:         '❌ Cancelar Inscripción',
    mensaje:        `¿Desea cancelar la inscripción de <strong>${nombre}</strong>?<br><br>
                     <small style="color:var(--color-error)">
                     Esta acción no se puede deshacer.</small>`,
    labelConfirmar: 'Cancelar Inscripción',
    tipo:           'peligro',
    onConfirm: async () => {
      try {
        await Api.patch(`/inscripciones/${id}/cancelar`);
        Toast.advertencia('Inscripción cancelada', nombre);
        cargarInscripciones();
      } catch (err) {
        Toast.error('Error al cancelar', err.message);
      }
    },
  });
};

// ─── Descargar diploma ────────────────────────────────────────────────────────
window.descargarDiploma = async (id, nombre, btnEl) => {
  if (btnEl) Helpers.setLoading(btnEl, true);
  try {
    await Api.descargarPdf(
      `/inscripciones/${id}/diploma`,
      `diploma-${nombre.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.pdf`
    );
    Toast.exito('Diploma generado', `Diploma de ${nombre} descargado`);
  } catch (err) {
    Toast.error('Error al generar diploma', err.message);
  } finally {
    if (btnEl) Helpers.setLoading(btnEl, false, '🏅');
  }
};

// ─── Abrir modal nueva inscripción ────────────────────────────────────────────
document.getElementById('btnNueva')
  ?.addEventListener('click', () => {
    Helpers.limpiarErrores('formInscripcion');
    document.getElementById('id_curso').value      = '';
    document.getElementById('id_estudiante').value = '';
    document.getElementById('infoCupo').style.display = 'none';
    Modal.abrir('modalInscripcion');
  });

document.getElementById('btnCerrarModal')
  ?.addEventListener('click', () => Modal.cerrar('modalInscripcion'));
document.getElementById('btnCancelarForm')
  ?.addEventListener('click', () => Modal.cerrar('modalInscripcion'));

// ─── Guardar inscripción ──────────────────────────────────────────────────────
document.getElementById('btnGuardar')
  ?.addEventListener('click', async () => {
    Helpers.limpiarErrores('formInscripcion');

    const id_curso      = parseInt(document.getElementById('id_curso').value);
    const id_estudiante = parseInt(document.getElementById('id_estudiante').value);

    let ok = true;
    if (!id_curso) {
      Helpers.marcarError('id_curso', 'Seleccione un curso'); ok = false;
    }
    if (!id_estudiante) {
      Helpers.marcarError('id_estudiante', 'Seleccione un estudiante'); ok = false;
    }
    if (!ok) return;

    const btn = document.getElementById('btnGuardar');
    Helpers.setLoading(btn, true);

    try {
      const payload = { id_curso, id_estudiante };
      const estadoConfirmada = estadosInscripciones.find(s => s.descripcion.toUpperCase() === 'CONFIRMADA');
      if (estadoConfirmada) payload.id_estado = estadoConfirmada.id_estado;

      await Api.post('/inscripciones', payload);
      Toast.exito('Inscripción realizada', 'El estudiante fue inscripto exitosamente');
      Modal.cerrar('modalInscripcion');
      estado.pagina = 1;
      // Refrescar selects para actualizar cupos
      await cargarSelects();
      cargarInscripciones();
    } catch (err) {
      if (err.data?.errors) {
        err.data.errors.forEach(e => Helpers.marcarError(e.path, e.msg));
      } else {
        Toast.error('Error al inscribir', err.message);
      }
    } finally {
      Helpers.setLoading(btn, false, '📝 Inscribir');
    }
  });

// ─── Filtros ──────────────────────────────────────────────────────────────────
document.getElementById('btnBuscar')
  ?.addEventListener('click', () => {
    estado.pagina        = 1;
    estado.id_curso      = document.getElementById('filtroCurso').value;
    estado.id_estudiante = document.getElementById('filtroEstudiante').value;
    estado.id_estado     = document.getElementById('filtroEstado').value;
    cargarInscripciones();
  });

document.getElementById('btnLimpiar')
  ?.addEventListener('click', () => {
    document.getElementById('filtroCurso').value      = '';
    document.getElementById('filtroEstudiante').value = '';
    document.getElementById('filtroEstado').value     = '';
    estado = { pagina: 1, id_curso: '', id_estudiante: '', id_estado: '' };
    cargarInscripciones();
  });

// ─── Init ─────────────────────────────────────────────────────────────────────
cargarSelects();
cargarInscripciones();