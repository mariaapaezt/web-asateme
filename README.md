# 🏓 ASATEME - Portal Web Oficial

Sitio web oficial de la **Asociación Santafesina de Tenis de Mesa** (ASATEME). Plataforma informativa y dinámica para la difusión de novedades, rankings provinciales, calendario de competencias y liga de equipos.

---

## 🚀 Arquitectura y Tecnologías

El proyecto está desarrollado bajo una arquitectura **Client-Side Rendering (CSR)** desacoplada, orientada a componentes y con patrones MVC (*Model-View-Controller*):

* **Front-End:**
  * **HTML5:** Maquetación semántica y limpia.
  * **Tailwind CSS (v3 via CDN):** Diseño responsivo, moderno y estilizado mediante CSS utilitario.
  * **JavaScript (Vanilla / ES6 Modules):** Lógica de presentación y manipulaciones del DOM dinámicas sin *frameworks* pesados.
  * **FontAwesome 6:** Iconografía.

* **Back-End & Capa de Datos:**
  * **Archivos JSON (`/data`):** Persistencia de datos estáticos y configuración de vistas (Novedades, Calendario, Atletas Destacados).
  * **Supabase (BaaS / PostgreSQL):** Infraestructura en la nube para persistencia y lectura de datos dinámicos en tiempo real (Ranking Provincial).


⚙️ Módulos Principales
Noticias & Carrusel:

Carga dinámica desde data/noticias.json.

Slider automático con rotación de portadas destacadas y grilla de novedades secundarias.

Santafesinos Destacados:

Renderizado dinámico desde data/destacados.json con fichas de atletas de selección.

Ranking Provincial:

Integración con Supabase para consulta por categorías (Primera, Segunda, Tercera, etc.).

Filtrado en tiempo real y vista extendida.

Calendario de Competencias:

Cartelera de torneos y eventos provinciales/internacionales cargados dinámicamente desde data/calendario.json.

🛠️ Mantenimiento y Actualización de Datos
Para actualizar la información del sitio sin modificar el código HTML:

Agregar/Editar Eventos: Modificar data/calendario.json.

Agregar/Editar Noticias: Modificar data/noticias.json.

Actualizar Atletas Destacados: Modificar data/destacados.json.

Actualizar Ranking: Los puntos y posiciones se gestionan directamente desde la base de datos de Supabase.

© 2026 ASATEME · Asociación Santafesina de Tenis de Mesa.

----------------------------------------------------------------------

Tu plataforma para **ASATEME** es un portal web dinámico e informativo que administra y presenta la actividad de la asociación:

* **Carrusel & Novedades:** Noticias destacadas con slider automático e historico.
* **Atletas Destacados:** Módulo dinámico con fichas de deportistas locales.
* **Ranking Provincial:** Sistema de tabla de posiciones interactivo por categorías (Primera, Segunda, etc.).
* **Calendario de Competencias:** Cartelera de torneos y eventos provinciales e internacionales.


* **Liga de Equipos & Formularios:** Vínculos para afiliaciones y la sección especial de la Liga.

---

## 🏗️ Arquitectura y Metodología Usada

Adoptamos una arquitectura **Basada en Componentes y Módulos de Vista (Client-Side Rendering - CSR)** en JavaScript nativo (vanilla JS), siguiendo principios tipo MVC (*Model-View-Controller*):

1. **Desacoplamiento total (Separación de Responsabilidades):**
* Los archivos `.html` contienen únicamente el esqueleto y la maquetación.
* La lógica de interacción, carruseles, filtrados y fetchs reside exclusivamente en la carpeta `js/` (organizada por vistas como `home.js`, `calendario.js`, `ranking.js`).


2. **Data-Driven (Inspirado en Componentes):**
* Las vistas leen datos structured de origen en formato JSON (`data/noticias.json`, `data/calendario.json`, `data/destacados.json`) o desde una base de datos externa. El DOM se construye/inyecta dinámicamente según la información recibida.




3. **Estilos Utilitarios (Atomic CSS):**
* Usamos **Tailwind CSS** vía CDN para mantener el estilo consistente, responsivo y liviano directamente desde las clases HTML.



---

## 🌗 ¿Qué parte es Front-End y qué parte es Back-End?

### 🎨 Front-End (El Cliente / Navegador)

Es todo lo que corre en el navegador del usuario y determina cómo se ve e interactúa la aplicación:

* **Estructura e Interfaz:** Archivos HTML (`index.html`, `liga-equipos.html`, `ranking.html`, `detalle-noticia.html`).
* **Estilos y Maquetación:** Tailwind CSS y FontAwesome.
* **Lógica de Presentación (JS):**
* `js/main.js` (Menú mobile, utilidades globales).
* `js/vistas/home.js` (Carrusel y grilla de novedades).
* `js/vistas/calendario.js` (Renderizado del calendario).
* `js/ranking.js` (Lógica e interacción del Ranking).



### ⚙️ Back-End & Capa de Datos (El Servidor / Persistencia)

Es el motor que almacena, procesa y provee los datos que el Front-End solicita:

* **Archivos de Datos Estáticos (API Local Mock/JSON):**
* `data/noticias.json`, `data/calendario.json`, `data/destacados.json`. Funcionan como endpoints locales que simulan o alimentan la información del sistema.


* **Servicio de Base de Datos / Backend-as-a-Service (BaaS):**
* **Supabase** (`js/supabase-config.js`): Actúa como nuestro Back-End en la nube (provee la base de datos PostgreSQL, autenticación y API en tiempo real para datos dinámicos como el ranking).