/**
 * Gestión del sidebar responsive (drawer móvil)
 * Importar en cada página protegida
 */
const Sidebar = {
  _sidebar:  null,
  _overlay:  null,
  _btnToggle: null,

  init() {
    this._sidebar   = document.getElementById('sidebar');
    this._overlay   = document.getElementById('sidebarOverlay');
    this._btnToggle = document.getElementById('btnMenuToggle');

    if (!this._sidebar) return;

    // Crear overlay si no existe en el HTML
    if (!this._overlay) {
      this._overlay = document.createElement('div');
      this._overlay.id = 'sidebarOverlay';
      this._overlay.className = 'sidebar-overlay';
      document.body.appendChild(this._overlay);
    }

    // Botón hamburguesa
    this._btnToggle?.addEventListener('click', () => this.toggle());

    // Cerrar al hacer clic en overlay
    this._overlay.addEventListener('click', () => this.cerrar());

    // Cerrar al hacer clic en un nav-item (en móvil)
    this._sidebar.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        if (window.innerWidth <= 768) this.cerrar();
      });
    });

    // Cerrar con Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.cerrar();
    });

    // Cerrar al rotar/redimensionar si pasa a desktop
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) this.cerrar();
    });
  },

  abrir() {
    this._sidebar?.classList.add('abierto');
    this._overlay?.classList.add('activo');
    document.body.style.overflow = 'hidden';
  },

  cerrar() {
    this._sidebar?.classList.remove('abierto');
    this._overlay?.classList.remove('activo');
    document.body.style.overflow = '';
  },

  toggle() {
    if (this._sidebar?.classList.contains('abierto')) {
      this.cerrar();
    } else {
      this.abrir();
    }
  },
};

export { Sidebar };