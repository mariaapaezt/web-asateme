// js/app.js

import { ligaController } from './vistas/liga.js';
import { CargaVista } from './vistas/carga.js';
import { ligaState } from './state/liga-state.js';

document.addEventListener('DOMContentLoaded', async () => {

    // 1. Verificación de seguridad de Supabase
    if (!window.supabase) {
        console.error("❌ Error crítico: 'window.supabase' no fue encontrado. Verificá 'supabase-config.js'.");
        return;
    }

    try {
        console.log("⚡ Cliente de Supabase detectado con éxito.");

        // 2. Inicializar el estado global de la liga
        await ligaState.init();

        // 3. Inicializar el controlador de la liga si corresponde
        if (ligaController?.inicializar) {
            await ligaController.inicializar(window.supabase);
        }

        // 4. Router simple basado en Hash
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
        };

        // Escuchar cambios de ruta en la URL
        window.addEventListener('hashchange', router);

        // Carga inicial según la URL actual
        await router();

    } catch (error) {
        console.error("💥 Error general durante el arranque de la aplicación:", error);
    }
});

// =============================================================================
// LÓGICA DEL MENÚ RESPONSIVO
// =============================================================================
const menuToggle = document.getElementById('menu-toggle');
const mobileMenu = document.getElementById('mobile-menu');

if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
    });

    // Cierra el menú al hacer clic en cualquier enlace interno
    mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.add('hidden');
        });
    });
}6