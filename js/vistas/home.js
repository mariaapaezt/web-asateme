document.addEventListener("DOMContentLoaded", async function () {
    const container = document.getElementById('carousel-container');
    const indicatorsContainer = document.getElementById('carousel-indicators');
    const spinner = document.getElementById('carousel-spinner');
    const gridContainer = document.getElementById('lista-noticias-grid');

    if (!container) return; // Si no estamos en el home, se interrumpe limpiamente

    let noticiasCarrusel = [];
    let noticiasRestantes = [];
    let currentSlide = 0;
    let carouselInterval;

    // 1. Cargar datos del JSON
    fetch('data/noticias.json')
        .then(response => response.json())
        .then(data => {
            if (!data || data.length === 0) throw new Error("No hay noticias cargadas.");

            const limiteCarrusel = 4;
            noticiasCarrusel = data.slice(0, limiteCarrusel);
            noticiasRestantes = data.slice(limiteCarrusel);

            initCarousel();
            renderNoticiasSecundarias();
        })
        .catch(err => {
            console.error("Error al cargar las novedades:", err);
            if (spinner) spinner.innerHTML = "<p class='text-red-400 font-semibold p-4'>Error al sincronizar las novedades</p>";
            if (gridContainer) gridContainer.innerHTML = "<p class='text-gray-500 text-sm col-span-full text-center py-6'>No se pudieron cargar las noticias secundarias.</p>";
        });

    function initCarousel() {
        container.innerHTML = "";
        indicatorsContainer.innerHTML = "";

        noticiasCarrusel.forEach((noticia, i) => {
            const slide = document.createElement('div');
            slide.className = `absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out ${i === 0 ? 'opacity-100 z-10' : 'opacity-0 z-0'}`;
            slide.innerHTML = `
                <div class="absolute inset-0 bg-cover bg-center" style="background-image: url('${noticia.imagenPortada}')"></div>
                <div class="absolute inset-0 bg-gradient-to-r from-asatemeBlue/95 via-asatemeBlue/70 to-transparent"></div>
                <div class="container mx-auto px-6 h-full flex items-center relative z-10">
                    <div class="max-w-2xl text-white">
                        <span class="bg-asatemeRed text-white text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded mb-4 inline-block">Destacado</span>
                        <h2 class="text-3xl md:text-5xl lg:text-6xl font-extrabold mb-4 leading-tight drop-shadow-md">${noticia.titulo}</h2>
                        <p class="mb-6 text-gray-200 text-sm md:text-base max-w-xl line-clamp-3">${noticia.resumen || ''}</p>
                        <a href="detalle-noticia.html?id=${noticia.id}" class="inline-block bg-asatemeRed hover:bg-red-700 px-8 py-3 rounded-lg font-bold tracking-wide transition transform hover:-translate-y-0.5 shadow-lg">Leer más</a>
                    </div>
                </div>
            `;
            container.appendChild(slide);

            const dot = document.createElement('button');
            dot.className = `h-2.5 rounded-full transition-all duration-300 ${i === 0 ? 'bg-asatemeRed w-8' : 'bg-white/40 w-2.5'}`;
            dot.setAttribute('aria-label', `Ir a noticia ${i + 1}`);
            dot.onclick = () => goToSlide(i);
            indicatorsContainer.appendChild(dot);
        });

        const prevBtn = document.getElementById('prev-slide');
        const nextBtn = document.getElementById('next-slide');

        if (prevBtn) prevBtn.onclick = () => goToSlide((currentSlide - 1 + noticiasCarrusel.length) % noticiasCarrusel.length);
        if (nextBtn) nextBtn.onclick = () => goToSlide((currentSlide + 1) % noticiasCarrusel.length);

        startAutoplay();
    }

    function renderNoticiasSecundarias() {
        if (!gridContainer) return;
        gridContainer.innerHTML = "";

        if (noticiasRestantes.length === 0) {
            gridContainer.innerHTML = `
                <div class="col-span-full text-center py-8 bg-white rounded-xl border border-gray-100 shadow-sm">
                    <p class="text-gray-400 text-sm">Próximamente verás más novedades publicadas en esta sección.</p>
                </div>
            `;
            return;
        }

        noticiasRestantes.forEach(noticia => {
            const card = document.createElement('div');
            card.className = "bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-xl transition duration-300 flex flex-col justify-between";
            card.innerHTML = `
                <div>
                    <div class="h-48 bg-gray-200 relative overflow-hidden">
                        <img src="${noticia.imagenPortada}" alt="${noticia.titulo}" class="w-full h-full object-cover transition duration-500 hover:scale-105">
                    </div>
                    <div class="p-5">
                        <span class="text-asatemeRed font-bold text-xs uppercase tracking-wider block mb-1">Novedades</span>
                        <h3 class="text-lg font-bold text-gray-800 line-clamp-2 mb-2 hover:text-asatemeBlue transition">
                            <a href="detalle-noticia.html?id=${noticia.id}">${noticia.titulo}</a>
                        </h3>
                        <p class="text-gray-500 text-sm line-clamp-3">${noticia.resumen || ''}</p>
                    </div>
                </div>
                <div class="px-5 pb-5 pt-2 border-t border-gray-50 flex justify-between items-center bg-gray-50/50">
                    <span class="text-xs text-gray-400"><i class="far fa-calendar-alt mr-1"></i> Info Oficial</span>
                    <a href="detalle-noticia.html?id=${noticia.id}" class="text-asatemeBlue hover:text-asatemeRed font-bold text-xs inline-flex items-center gap-1 transition">
                        Ver noticia <i class="fas fa-arrow-right text-[10px]"></i>
                    </a>
                </div>
            `;
            gridContainer.appendChild(card);
        });
    }

    function goToSlide(index) {
        currentSlide = index;
        const slides = container.children;

        Array.from(slides).forEach((s, i) => {
            s.classList.toggle('opacity-100', i === index);
            s.classList.toggle('opacity-0', i !== index);
            s.classList.toggle('z-10', i === index);
            s.classList.toggle('z-0', i !== index);
        });

        const dots = indicatorsContainer.children;
        Array.from(dots).forEach((d, i) => {
            d.classList.toggle('bg-asatemeRed', i === index);
            d.classList.toggle('w-8', i === index);
            d.classList.toggle('bg-white/40', i !== index);
            d.classList.toggle('w-2.5', i !== index);
        });

        resetAutoplay();
    }

    function startAutoplay() {
        carouselInterval = setInterval(() => {
            if (noticiasCarrusel.length > 0) {
                goToSlide((currentSlide + 1) % noticiasCarrusel.length);
            }
        }, 5500);
    }

    function resetAutoplay() {
        clearInterval(carouselInterval);
        startAutoplay();
    }

    // Agregar dentro del DOMContentLoaded de js/vistas/home.js
    fetch('data/destacados.json')
        .then(res => res.json())
        .then(atletas => {
            const grid = document.getElementById('destacados-grid');
            if (!grid) return;
            grid.innerHTML = atletas.map(atleta => `
            <div class="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                <div class="h-56 bg-gray-100 relative overflow-hidden">
                    <img src="${atleta.imagen}" alt="${atleta.nombre}" class="w-full h-full object-cover object-top">
                </div>
                <div class="p-5">
                    <h3 class="text-lg font-bold text-gray-800">${atleta.nombre}</h3>
                    <p class="text-asatemeRed font-semibold text-sm mb-1">${atleta.categoria}</p>
                    <p class="text-gray-500 text-sm"><i class="fas fa-flag mr-1"></i> ${atleta.ciudad}</p>
                </div>
            </div>
        `).join('');
        })
        .catch(err => console.error("Error al cargar atletas destacados:", err));
});