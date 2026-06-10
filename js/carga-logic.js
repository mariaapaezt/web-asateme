// =========================================================================
// 1. CONFIGURACIÓN DE CONEXIÓN Y ESTADO LOCAL DE CARGA
// =========================================================================
const SUPABASE_URL = "https://gniieyrbxpodzzuaxbvr.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduaWlleXJieHBvZHp6dWF4YnZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwOTE2MjUsImV4cCI6MjA5NjY2NzYyNX0.L1mmw4aGZPkmES63pyMc6gWKPnvKEUbq63nJXvMlzxE";

console.log("🔌 Inicializando cliente de Supabase...");
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let PARTIDOS_BACKUP = [];
let EQUIPOS_MAPA = {};

let FILTROS_CARGA = {
    liga: 'LIGA_A',
    fechaNum: 1,
    partidoSeleccionadoId: null
};

// =========================================================================
// 2. DESCARGA E INICIALIZACIÓN DE DATOS DIRECTA
// =========================================================================
async function inicializarPantallaCarga() {
    console.log("📥 Intentando descargar datos desde Supabase...");
    try {
        const [resPartidos, resEquipos] = await Promise.all([
            supabaseClient.from('fixture').select('*'),
            supabaseClient.from('equipos').select('id, nombre')
        ]);

        if (resPartidos.error) {
            console.error("❌ Error en tabla 'fixture':", resPartidos.error);
            return;
        }
        if (resEquipos.error) {
            console.error("❌ Error en tabla 'equipos':", resEquipos.error);
            return;
        }

        PARTIDOS_BACKUP = resPartidos.data;
        console.log(`✅ Partidos cargados con éxito (${PARTIDOS_BACKUP.length} encontrados)`);

        EQUIPOS_MAPA = {};
        resEquipos.data.forEach(eq => {
            EQUIPOS_MAPA[eq.id] = eq.nombre;
        });
        console.log(`✅ Mapa de equipos generado (${Object.keys(EQUIPOS_MAPA).length} clubes mapeados)`);

        // Dibujamos las opciones en el combo
        actualizarDesplegablePartidos();

    } catch (error) {
        console.error("💥 Error crítico inesperado en la conexión:", error);
    }
}

// =========================================================================
// 3. LÓGICA DE INTERFACES Y FILTROS INTERACTIVOS
// =========================================================================
function seleccionarFiltroLiga(ligaId) {
    FILTROS_CARGA.liga = ligaId;
    FILTROS_CARGA.partidoSeleccionadoId = null;

    const btnA = document.getElementById('btn-liga-a');
    const btnB = document.getElementById('btn-liga-b');

    if (ligaId === 'LIGA_A') {
        btnA.className = "py-2.5 px-4 rounded-xl font-bold text-xs border text-center transition-all bg-asatemeBlue text-white border-asatemeBlue cursor-pointer";
        btnB.className = "py-2.5 px-4 rounded-xl font-bold text-xs border text-center transition-all bg-white text-gray-700 border-gray-200 cursor-pointer";
    } else {
        btnB.className = "py-2.5 px-4 rounded-xl font-bold text-xs border text-center transition-all bg-asatemeBlue text-white border-asatemeBlue cursor-pointer";
        btnA.className = "py-2.5 px-4 rounded-xl font-bold text-xs border text-center transition-all bg-white text-gray-700 border-gray-200 cursor-pointer";
    }

    actualizarDesplegablePartidos();
    resetearNombresMarcador();
}

function actualizarDesplegablePartidos() {
    const selectPartido = document.getElementById('select-partido-id');
    if (!selectPartido) return;

    const partidosFiltrados = PARTIDOS_BACKUP.filter(p =>
        p.liga === FILTROS_CARGA.liga || p.liga === FILTROS_CARGA.liga // Doble chequeo de string
    ).filter(p => p.fecha_numero === parseInt(FILTROS_CARGA.fechaNum));

    selectPartido.innerHTML = '<option value="">-- Seleccioná la serie en juego --</option>';

    if (partidosFiltrados.length === 0) {
        selectPartido.innerHTML = '<option value="">No hay partidos agendados para este filtro.</option>';
        return;
    }

    partidosFiltrados.forEach(partido => {
        const nombreLocal = EQUIPOS_MAPA[partido.local_id] || partido.local_id;
        const nombreVisitante = EQUIPOS_MAPA[partido.visitante_id] || partido.visitante_id;
        const estadoTxt = partido.estado === "Finalizado" ? " (Editar)" : "";

        const option = document.createElement('option');
        option.value = partido.id;
        option.textContent = `${nombreLocal} vs ${nombreVisitante}${estadoTxt}`;
        selectPartido.appendChild(option);
    });
}

function manejarCambioPartido(partidoId) {
    FILTROS_CARGA.partidoSeleccionadoId = partidoId;

    const lblLocal = document.getElementById('txt-nombre-local');
    const lblVisitante = document.getElementById('txt-nombre-visitante');

    if (!partidoId) {
        resetearNombresMarcador();
        return;
    }

    const partido = PARTIDOS_BACKUP.find(p => p.id == partidoId);
    if (partido) {
        lblLocal.textContent = EQUIPOS_MAPA[partido.local_id] || "Local";
        lblVisitante.textContent = EQUIPOS_MAPA[partido.visitante_id] || "Visitante";

        document.getElementById('score-local-input').value = partido.score_local !== null ? partido.score_local : "";
        document.getElementById('score-visitante-input').value = partido.score_visitante !== null ? partido.score_visitante : "";
    }
}

function resetearNombresMarcador() {
    document.getElementById('txt-nombre-local').textContent = "Equipo Local";
    document.getElementById('txt-nombre-visitante').textContent = "Equipo Visitante";
    document.getElementById('score-local-input').value = "";
    document.getElementById('score-visitante-input').value = "";
}

// =========================================================================
// 4. CONEXIÓN DE EVENTOS DE ENTRADA (LISTENERS)
// =========================================================================
function conectarEventosFormulario() {
    console.log("🎮 Vinculando listeners de la interfaz...");

    const selectFecha = document.getElementById('select-fecha-num');
    if (selectFecha) {
        selectFecha.addEventListener('change', (e) => {
            FILTROS_CARGA.fechaNum = e.target.value;
            actualizarDesplegablePartidos();
            resetearNombresMarcador();
        });
    }

    const selectPartido = document.getElementById('select-partido-id');
    if (selectPartido) {
        selectPartido.addEventListener('change', (e) => {
            manejarCambioPartido(e.target.value);
        });
    }

    const inputArchivo = document.getElementById('archivo-planilla-input');
    if (inputArchivo) {
        inputArchivo.addEventListener('change', (e) => {
            const txtNombre = document.getElementById('archivo-seleccionado-nombre');
            if (e.target.files.length > 0) {
                txtNombre.textContent = `✓ Seleccionado: ${e.target.files[0].name}`;
                txtNombre.className = "text-[10px] text-green-600 font-bold truncate";
            } else {
                txtNombre.textContent = "Formatos: JPG, PNG o PDF";
                txtNombre.className = "text-[10px] text-gray-400 truncate";
            }
        });
    }
}

// =========================================================================
// 5. ENVÍO, VALIDACIÓN Y GUARDADO REAL EN SUPABASE
// =========================================================================
async function procesarEnvioResultado(event) {
    event.preventDefault(); // Evita que el celular recargue la página y pierda los datos

    const partidoId = FILTROS_CARGA.partidoSeleccionadoId;
    const scoreLocal = parseInt(document.getElementById('score-local-input').value);
    const scoreVisitante = parseInt(document.getElementById('score-visitante-input').value);
    const tokenIngresado = document.getElementById('token-club-input').value.trim();
    const inputArchivo = document.getElementById('archivo-planilla-input');

    // Validaciones básicas de interfaz antes de tocar la base de datos
    if (!partidoId) {
        alert("Por favor, seleccioná un partido del desplegable.");
        return;
    }
    if (isNaN(scoreLocal) || isNaN(scoreVisitante)) {
        alert("Por favor, ingresá un marcador válido para ambos equipos.");
        return;
    }
    if (!inputArchivo.files || inputArchivo.files.length === 0) {
        alert("Es obligatorio adjuntar la foto de la planilla firmada.");
        return;
    }

    const archivoActa = inputArchivo.files[0];
    const partidoSeleccionado = PARTIDOS_BACKUP.find(p => p.id == partidoId);

    // Cambiamos temporalmente el texto del botón para que el usuario sepa que está cargando
    const btnEnviar = event.target.querySelector('button[type="submit"]');
    const textoOriginalBtn = btnEnviar.innerHTML;
    btnEnviar.disabled = true;
    btnEnviar.innerHTML = `<i class="fas fa-spinner fa-spin mr-1.5"></i> Procesando envío...`;

    try {
        console.log("🔐 Validando credenciales del club...");

        // 1. PASO DE SEGURIDAD: Validamos el token contra la tabla de equipos en Supabase
        // Buscamos si el equipo local o visitante coincide con el ID del partido y tiene ese PIN secreto
        console.log("🔐 Validando credenciales del club...");

        // CORRECCIÓN: Quitamos .single() y dejamos que traiga la lista de coincidencias si existen
        const { data: equiposValidados, error: errToken } = await supabaseClient
            .from('equipos')
            .select('id, nombre, token')
            .or(`id.eq.${partidoSeleccionado.local_id},id.eq.${partidoSeleccionado.visitante_id}`)
            .eq('token', tokenIngresado); // Filtramos por el PIN ingresado

        // Verificamos si hubo error o si la lista volvió vacía (lo que significa PIN incorrecto)
        if (errToken || !equiposValidados || equiposValidados.length === 0) {
            console.warn("⚠️ Intento de carga con código PIN incorrecto o error de consulta.");
            alert("El Código de Validación del Club es incorrecto. Verificá el PIN de tu equipo.");
            btnEnviar.disabled = false;
            btnEnviar.innerHTML = textoOriginalBtn;
            return;
        }

        // Si encontró el equipo, tomamos el primero de la lista devuelta
        const equipoValidado = equiposValidados[0];
        console.log(`✓ Club autenticado con éxito: ${equipoValidado.nombre}`);
        console.log("📸 Subiendo imagen del acta al Storage de Supabase...");

        // 2. PASO DE STORAGE: Subimos el archivo adjunto
        // Creamos un nombre de archivo único usando el ID del partido y el tiempo actual
        const extension = archivoActa.name.split('.').pop();
        const nombreLimpioArchivo = `acta_${partidoId}_${Date.now()}.${extension}`;

        // Subimos el archivo a un bucket que debés tener creado en Supabase llamado 'planillas'
        const { data: resStorage, error: errStorage } = await supabaseClient
            .storage
            .from('planillas')
            .upload(nombreLimpioArchivo, archivoActa, {
                cacheControl: '3600',
                upsert: false
            });

        if (errStorage) {
            console.error("❌ Error al subir el archivo al Storage:", errStorage);
            throw new Error("No se pudo subir la foto de la planilla. Asegurate de tener el bucket 'planillas' creado en Supabase.");
        }

        // Obtenemos la URL pública del archivo recién subido
        const { data: resUrl } = supabaseClient
            .storage
            .from('planillas')
            .getPublicUrl(nombreLimpioArchivo);

        const urlPublicaActa = resUrl.publicUrl;
        console.log("✓ Archivo subido con éxito. URL:", urlPublicaActa);

        console.log("💾 Actualizando el registro del partido en la tabla fixture...");

        // 3. PASO DE GUARDADO: Actualizamos la fila del partido en la tabla 'fixture'
        // Cambiamos scores, estado a Finalizado y agregamos la URL del acta
        const { error: errUpdate } = await supabaseClient
            .from('fixture')
            .update({
                score_local: scoreLocal,
                score_visitante: scoreVisitante,
                estado: "Finalizado",
                url_acta: urlPublicaActa // Asumiendo que tenés esta columna agregada en la tabla fixture
            })
            .eq('id', partidoId);

        if (errUpdate) throw errUpdate;

        console.log("🚀 ¡Todo el proceso se completó con éxito absoluto!");
        alert(`¡Resultado enviado con éxito!\nSerie finalizada: ${scoreLocal} - ${scoreVisitante}.\nLa tabla de posiciones se actualizará.`);

        // Redirigimos al usuario de vuelta a la página principal de la liga
        window.location.href = "liga-equipos.html";

    } catch (error) {
        console.error("💥 Error grave durante el flujo de guardado:", error);
        alert("Ocurrió un error crítico al guardar los datos. Revisá la consola del navegador.");

        // Restauramos el botón por si quiere reintentar
        btnEnviar.disabled = false;
        btnEnviar.innerHTML = textoOriginalBtn;
    }
}

// =========================================================================
// ARRANCAR DIRECTO SIN ESPERAR AL DOM (Evita el congelamiento móvil)
// =========================================================================
inicializarPantallaCarga();
conectarEventosFormulario();