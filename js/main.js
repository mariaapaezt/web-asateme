// js/main.js

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 ASATEME Web: Inicializando script de menú mobile.');

    const menuToggle = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');

    if (menuToggle && mobileMenu) {
        console.log('✅ Botón de menú y contenedor encontrados correctamente.');

        const toggleMenu = (e) => {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            // Alterna visibilidad
            const estaOculto = mobileMenu.classList.contains('hidden');
            if (estaOculto) {
                mobileMenu.classList.remove('hidden');
                console.log('📱 Menú desplegado');
            } else {
                mobileMenu.classList.add('hidden');
                console.log('📱 Menú ocultado');
            }
        };

        // Escuchar tanto clic en PC como toque directo en Celular
        menuToggle.addEventListener('click', toggleMenu);

        // Cerrar menú mobile al hacer clic en cualquier enlace interno
        const mobileLinks = mobileMenu.querySelectorAll('a');
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.add('hidden');
            });
        });
    } else {
        console.error("❌ No se encontraron los elementos del menú ('menu-toggle' o 'mobile-menu').");
    }
});