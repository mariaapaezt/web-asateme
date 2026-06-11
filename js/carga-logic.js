// ==========================================
// 1. ESTADO CENTRAL DE LA PÁGINA DE CARGA
// ==========================================

// NOTA: La conexión a Supabase ahora se maneja de forma centralizada 
// en js/supabase-config.js a través de window.supabaseClient.

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
    console.log("📥 Intentando descargar datos desde Supabase mediante el cliente global...");
    try {
        // Usamos window.supabaseClient compartido en lugar de la variable local duplicada
        const [resPartidos, resEquipos] = await Promise.all([
            window.supabaseClient.from('fixture').select('*'),
            window.supabaseClient.from('equipos').select('id, nombre')
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
        p.liga === FILTROS_CARGA.liga
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
    const btnSubmit = document.querySelector('#form-envio-planilla button[type="submit"]');

    if (!partidoId) {
        resetearNombresMarcador();
        if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.textContent = "Enviar Informe Oficial";
        }
        return;
    }

    const partido = PARTIDOS_BACKUP.find(p => p.id == partidoId);
    if (partido) {
        lblLocal.textContent = EQUIPOS_MAPA[partido.local_id] || "Local";
        lblVisitante.textContent = EQUIPOS_MAPA[partido.visitante_id] || "Visitante";

        document.getElementById('score-local-input').value = partido.score_local !== null ? partido.score_local : "";
        document.getElementById('score-visitante-input').value = partido.score_visitante !== null ? partido.score_visitante : "";

        // Reseteamos checkboxes de WO al cambiar de partido
        document.getElementById('wo-local-check').checked = false;
        document.getElementById('wo-visitante-check').checked = false;

        // VALIDACIÓN DE SEGURIDAD: Si el partido ya fue finalizado previamente, bloqueamos acciones
        if (partido.estado === "Finalizado") {
            console.warn(`🔒 El partido ID ${partidoId} ya está finalizado. Bloqueando reenvío.`);

            document.getElementById('score-local-input').disabled = true;
            document.getElementById('score-visitante-input').disabled = true;
            document.getElementById('wo-local-check').disabled = true;
            document.getElementById('wo-visitante-check').disabled = true;

            if (btnSubmit) {
                btnSubmit.disabled = true;
                btnSubmit.className = "w-full bg-gray-400 text-white font-bold py-3 px-4 rounded-xl text-sm shadow-md cursor-not-allowed transition-all text-center block";
                btnSubmit.textContent = "🔒 Serie Finalizada y Registrada";
            }
        } else {
            // Si está pendiente, liberamos todo de forma normal
            document.getElementById('score-local-input').disabled = false;
            document.getElementById('score-visitante-input').disabled = false;
            document.getElementById('wo-local-check').disabled = false;
            document.getElementById('wo-visitante-check').disabled = false;

            if (btnSubmit) {
                btnSubmit.disabled = false;
                btnSubmit.className = "w-full bg-asatemeRed text-white font-bold py-3 px-4 rounded-xl text-sm shadow-md hover:bg-red-700 active:scale-[0.98] transition-all text-center block cursor-pointer";
                btnSubmit.textContent = "Enviar Informe Oficial";
            }
        }
    }
}

function resetearNombresMarcador() {
    document.getElementById('txt-nombre-local').textContent = "Equipo Local";
    document.getElementById('txt-nombre-visitante').textContent = "Equipo Visitante";
    document.getElementById('score-local-input').value = "";
    document.getElementById('score-visitante-input').value = "";
    if (document.getElementById('wo-local-check')) document.getElementById('wo-local-check').checked = false;
    if (document.getElementById('wo-visitante-check')) document.getElementById('wo-visitante-check').checked = false;
}

// Controla el comportamiento si un equipo no se presenta (W.O.) con el reglamento de 5 partidos
function manejarCambioWO(tipo) {
    const chkLocal = document.getElementById('wo-local-check');
    const chkVisitante = document.getElementById('wo-visitante-check');
    const inputScoreLocal = document.getElementById('score-local-input');
    const inputScoreVisitante = document.getElementById('score-visitante-input');

    if (!chkLocal || !chkVisitante) return;

    if (tipo === 'LOCAL' && chkLocal.checked) {
        chkVisitante.checked = false;
        inputScoreLocal.value = 0;
        inputScoreVisitante.value = 5;
        inputScoreLocal.disabled = true;
        inputScoreVisitante.disabled = true;
        console.log("🚨 W.O. Local detectado. Marcador fijado en 0 - 5.");
    } else if (tipo === 'VISITANTE' && chkVisitante.checked) {
        chkLocal.checked = false;
        inputScoreLocal.value = 5;
        inputScoreVisitante.value = 0;
        inputScoreLocal.disabled = true;
        inputScoreVisitante.disabled = true;
        console.log("🚨 W.O. Visitante detectado. Marcador fijado en 5 - 0.");
    } else {
        inputScoreLocal.disabled = false;
        inputScoreVisitante.disabled = false;
        inputScoreLocal.value = "";
        inputScoreVisitante.value = "";
        console.log("ℹ️ W.O. cancelado. Volviendo a modo de carga manual.");
    }
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

    // AJUSTE: Vinculamos el submit del formulario para capturar el botón de envío
    const formEnvio = document.getElementById('form-envio-planilla');
    if (formEnvio) {
        formEnvio.addEventListener('submit', procesarEnvioResultado);
    }
}

// Verifica si el marcador de partidos individuales ingresado cumple estrictamente el reglamento
function validarMarcadorTenisDeMesa(scoreLocal, scoreVisitante, esWO) {
    if (esWO) return true;
    if (isNaN(scoreLocal) || isNaN(scoreVisitante) || scoreLocal < 0 || scoreVisitante < 0) return false;

    // REGLA ESTRICTA: Se deben disputar los 5 partidos individuales de la serie sí o sí
    const totalPartidos = scoreLocal + scoreVisitante;
    if (totalPartidos !== 5) return false;

    if (scoreLocal >= 3 || scoreVisitante >= 3) {
        return true;
    }
    return false;
}

// =========================================================================
// 5. ENVÍO, VALIDACIÓN REGLAMENTARIA Y GUARDADO REAL EN SUPABASE
// =========================================================================
async function procesarEnvioResultado(event) {
    event.preventDefault();
    event.stopImmediatePropagation();

    const partidoId = FILTROS_CARGA.partidoSeleccionadoId;
    if (!partidoId) {
        alert("Por favor, seleccioná un partido del desplegable.");
        return;
    }

    const partidoSeleccionado = PARTIDOS_BACKUP.find(p => p.id == partidoId);

    if (partidoSeleccionado && partidoSeleccionado.estado === "Finalizado") {
        alert("Esta serie ya fue enviada y se encuentra cerrada.");
        return;
    }

    const valLocal = document.getElementById('score-local-input').value;
    const valVisitante = document.getElementById('score-visitante-input').value;
    const scoreLocal = parseInt(valLocal);
    const scoreVisitante = parseInt(valVisitante);

    const tokenIngresado = document.getElementById('token-club-input').value.trim();
    const inputArchivo = document.getElementById('archivo-planilla-input');

    const chkLocalWO = document.getElementById('wo-local-check').checked;
    const chkVisitanteWO = document.getElementById('wo-visitante-check').checked;
    const esWalkover = chkLocalWO || chkVisitanteWO;

    if (isNaN(scoreLocal) || isNaN(scoreVisitante)) {
        alert("Por favor, ingresá un marcador válido para ambos equipos.");
        return;
    }

    const marcadorValido = validarMarcadorTenisDeMesa(scoreLocal, scoreVisitante, esWalkover);
    if (!marcadorValido) {
        alert("⚠️ Marcador antirreglamentario.\nRecuerde que se deben disputar los 5 partidos individuales de la serie sí o sí (ej: 3-2, 4-1, 5-0). La suma de ambos marcadores debe ser igual a 5.");
        return;
    }

    if (!inputArchivo.files || inputArchivo.files.length === 0) {
        alert("Es obligatorio adjuntar la foto de la planilla firmada.");
        return;
    }

    const archivoActa = inputArchivo.files[0];

    const btnEnviar = event.target.querySelector('button[type="submit"]');
    const textoOriginalBtn = btnEnviar.innerHTML;
    btnEnviar.disabled = true;
    btnEnviar.innerHTML = `<i class="fas fa-spinner fa-spin mr-1.5"></i> Procesando envío...`;

    try {
        console.log("🔐 Validando credenciales del club...");

        // Usamos window.supabaseClient global
        const { data: equiposValidados, error: errToken } = await window.supabaseClient
            .from('equipos')
            .select('id, nombre, token')
            .or(`id.eq.${partidoSeleccionado.local_id},id.eq.${partidoSeleccionado.visitante_id}`)
            .eq('token', tokenIngresado);

        if (errToken || !equiposValidados || equiposValidados.length === 0) {
            console.warn("⚠️ Intento de carga con código PIN incorrecto.");
            alert("El Código de Validación del Club es incorrecto. Verificá el PIN de tu equipo.");

            btnEnviar.disabled = false;
            btnEnviar.innerHTML = textoOriginalBtn;
            return;
        }

        const equipoValidado = equiposValidados[0];
        console.log(`✓ Club autenticado: ${equipoValidado.nombre}`);
        console.log("📸 Subiendo imagen del acta al Storage de Supabase...");

        const extension = archivoActa.name.split('.').pop();
        const nombreLimpioArchivo = `acta_${partidoId}_${Date.now()}.${extension}`;

        // Usamos window.supabaseClient global
        const { data: resStorage, error: errStorage } = await window.supabaseClient
            .storage
            .from('planillas')
            .upload(nombreLimpioArchivo, archivoActa, {
                cacheControl: '3600',
                upsert: false
            });

        if (errStorage) {
            console.error("❌ Error al subir el archivo al Storage:", errStorage);
            throw new Error("No se pudo subir la foto de la planilla.");
        }

        // Usamos window.supabaseClient global
        const { data: resUrl } = window.supabaseClient
            .storage
            .from('planillas')
            .getPublicUrl(nombreLimpioArchivo);

        const urlPublicaActa = resUrl.publicUrl;
        console.log("✓ Archivo subido con éxito. URL:", urlPublicaActa);

        let valorWalkover = null;
        if (chkLocalWO) valorWalkover = "LOCAL";
        if (chkVisitanteWO) valorWalkover = "VISITANTE";

        console.log("💾 Actualizando el registro del partido en la tabla fixture...");

        // Usamos window.supabaseClient global
        const { error: errUpdate } = await window.supabaseClient
            .from('fixture')
            .update({
                score_local: scoreLocal,
                score_visitante: scoreVisitante,
                estado: "Finalizado",
                url_acta: urlPublicaActa,
                walkover: valorWalkover
            })
            .eq('id', partidoId);

        if (errUpdate) throw errUpdate;

        console.log("🚀 ¡Todo el proceso se completó con éxito absoluto!");
        alert(`¡Resultado enviado con éxito!\nSerie finalizada: ${scoreLocal} - ${scoreVisitante}.\nLa tabla de posiciones se actualizará automáticamente.`);

        window.location.href = "liga-equipos.html";

    } catch (error) {
        console.error("💥 Error grave durante el flujo de guardado:", error);
        alert("Ocurrió un error crítico al guardar los datos. Revisá la consola del navegador.");

        btnEnviar.disabled = false;
        btnEnviar.innerHTML = textoOriginalBtn;
    }
}

function toggleVisibilidadToken() {
    const inputToken = document.getElementById('token-club-input');
    const iconoOjo = document.getElementById('icono-ojo-token');

    if (!inputToken || !iconoOjo) return;

    if (inputToken.type === 'password') {
        inputToken.type = 'text';
        iconoOjo.className = 'fas fa-eye-slash text-xs text-asatemeBlue';
    } else {
        inputToken.type = 'password';
        iconoOjo.className = 'fas fa-eye text-xs text-gray-400';
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const fileInput = document.getElementById('archivo-planilla-input');
    const fileNameLabel = document.getElementById('archivo-seleccionado-nombre');

    if (fileInput && fileNameLabel) {
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                fileNameLabel.innerText = "📄 Seleccionado: " + e.target.files[0].name;
                fileNameLabel.classList.remove('text-gray-400');
                fileNameLabel.classList.add('text-green-600', 'font-bold');
            }
        });
    }
});

// =========================================================================
// ARRANCAR DIRECTO SIN ESPERAR AL DOM (Evita el congelamiento móvil)
// =========================================================================
inicializarPantallaCarga();
conectarEventosFormulario();