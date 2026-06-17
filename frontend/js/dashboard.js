import { Auth }    from './auth.js';
import { Api }     from './api.js';
import { Helpers } from './utils.js';
import { Sidebar } from './sidebar.js';

if (!Auth.requireAuth()) throw new Error('No autenticado');
Auth.renderUsuario();
Sidebar.init();

document.getElementById('btnLogout')
  ?.addEventListener('click', () => Auth.cerrarSesion());

document.getElementById('fechaHoy').textContent =
  new Date().toLocaleDateString('es-AR', { weekday:'long', day:'2-digit', month:'long', year:'numeric' });

async function cargarDashboard() {
  try {
    const { data } = await Api.get('/dashboard');
    console.log('Dashboard data:', data);
    const { totales, cursos_activos, ultimas_inscripciones } = data;

    // Stats
    document.getElementById('statEstudiantes').textContent   = totales.total_estudiantes;
    document.getElementById('statCursos').textContent        = totales.cursos_activos;
    document.getElementById('statInscripciones').textContent = totales.inscripciones_activas;
    document.getElementById('statAprobados').textContent     = totales.inscripciones_aprobadas;
    document.getElementById('statTotal').textContent         = totales.total_inscripciones;

    // Cursos activos con barra de ocupación
    const container = document.getElementById('cursosActivosContainer');
    if (!cursos_activos.length) {
      container.innerHTML = `<div class="estado-vacio">
        <div class="estado-vacio-icono">📚</div>
        <h3>No hay cursos activos</h3></div>`;
    } else {
      container.innerHTML = `<div class="cursos-grid">
        ${cursos_activos.map(c => {
          const pct   = Math.min(100, c.porcentaje_ocupacion || 0);
          const clase = pct >= 100 ? 'lleno' : pct >= 80 ? 'casi' : '';
          return `
          <div class="curso-card">
            <div class="curso-card-nombre">${c.nombre}</div>
            <div class="curso-card-meta">
              📅 ${Helpers.formatFecha(c.fecha_inicio)} &nbsp;·&nbsp; ⏱ ${c.cantidad_horas}h
            </div>
            <div class="progress-bar-wrap">
              <div class="progress-bar-fill ${clase}" style="width:${pct}%"></div>
            </div>
            <div class="progress-label">
              <span>${c.inscriptos_actuales} inscriptos</span>
              <span>${c.cupo_disponible} disponibles</span>
            </div>
          </div>`;
        }).join('')}
      </div>`;
    }

    // Últimas inscripciones
    const tbody = document.getElementById('tbodyRecientes');
    if (!ultimas_inscripciones.length) {
      tbody.innerHTML = `<tr><td colspan="4" class="tabla-vacia">Sin actividad reciente</td></tr>`;
    } else {
      tbody.innerHTML = ultimas_inscripciones.map(i => `
        <tr>
          <td><strong>${i.estudiante}</strong></td>
          <td style="font-size:.82rem">${i.curso}</td>
          <td style="font-size:.78rem;white-space:nowrap">${Helpers.formatFechaHora(i.fecha_hora_inscripcion)}</td>
          <td>${Helpers.badgeEstadoInscripcion(i.estado)}</td>
        </tr>`).join('');
    }

  } catch (err) {
    console.error('Error dashboard:', err);
  }
}

cargarDashboard();