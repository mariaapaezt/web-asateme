// js/main.js

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 ASATEME Web: Inicializado con éxito.');

    const menuToggle = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');

    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });

        // Cerrar menú mobile al hacer clic en un enlace
        const mobileLinks = mobileMenu.querySelectorAll('a');
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.add('hidden');
            });
        });
    }
});

// js/main.js

// 1. Configuración global del Theme de Tailwind para ASATEME
if (window.tailwind) {
    window.tailwind.config = {
        theme: {
            extend: {
                colors: {
                    asatemeBlue: '#003366', // Azul institucional
                    asatemeRed: '#E31B23',  // Rojo competitivo
                    asatemeGray: '#F4F6F9'  // Gris claro de fondo
                }
            }
        }
    };
}

console.log("🚀 ASATEME Web: Inicializado con éxito.");