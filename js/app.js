// js/app.js

import { ligaController } from './vistas/liga.js';
import { CargaVista } from './vistas/carga.js';
import { ligaState } from './state/liga-state.js';

// =============================================================================
// FUNCIÓN ROBUSTA PARA EL MENÚ MOBILE DE LA LIGA
// =============================================================================
function setupMobileMenu() {
    const menuToggle = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');

    if (!menuToggle || !mobileMenu) return;

    // Clonamos el botón para limpiar cualquier event listener viejo acumulado
    const newToggle = menuToggle.cloneNode(true);
    menuToggle.parentNode.replaceChild(newToggle, menuToggle);

    newToggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Forzamos visibilidad mediante style directo para no depender de clases de CSS/Tailwind
        const estaOculto = mobileMenu.style.display === 'none' || mobileMenu.style.display === '' || mobileMenu.classList.contains('hidden');

        if (estaOculto) {
            mobileMenu.style.display = 'block';
            mobileMenu.classList.remove('hidden');
        } else {
            mobileMenu.style.display = 'none';
            mobileMenu.classList.add('hidden');
        }
    });

    // Ocultar menú mobile al hacer clic en cualquier link del menú
    mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.style.display = 'none';
            mobileMenu.classList.add('hidden');
        });
    });
}

// =============================================================================
// ARRANQUE DE LA APLICACIÓN Y ROUTER
// =============================================================================
document.addEventListener('DOMContentLoaded', async () => {

    // 1. Inicializar el menú responsive de la Liga
    setupMobileMenu();

    // 2. Verificación de seguridad de Supabase
    if (!window.supabase) {
        console.error("❌ Error crítico: 'window.supabase' no fue encontrado. Verificá 'supabase-config.js'.");
        return;
    }

    try {
        console.log("⚡ Cliente de Supabase detectado con éxito.");

        // Inicializar el estado global de la liga
        await ligaState.init();

        // Inicializar el controlador de la liga si corresponde
        if (ligaController?.inicializar) {
            await ligaController.inicializar(window.supabase);
        }

        // Router simple basado en Hash
        const router = async () => {
            const container = document.getElementById('app');
            if (!container) return;

            const hash = window.location.hash || '#/liga';

            if (hash.startsWith('#/carga')) {
                const vistaCarga = new CargaVista();
                await vistaCarga.render(container);
            } else if (hash.startsWith('#/liga')) {
                if (ligaController?.render) {
                    await ligaController.render(container);
                }
            }

            // RE-ENGANCHAR EL MENÚ después de renderizar cualquier vista
            setupMobileMenu();
        };

        // Escuchar cambios de ruta en la URL
        window.addEventListener('hashchange', router);

        // Carga inicial según la URL actual
        await router();

    } catch (error) {
        console.error("💥 Error general durante el arranque de la aplicación:", error);
    }
});