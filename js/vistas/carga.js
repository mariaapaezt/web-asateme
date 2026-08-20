import { ligaState } from '../state/liga-state.js';
import { SelectorPartido } from '../componentes/carga/SelectorPartido.js';
import { AcordeonITTF } from '../componentes/carga/AcordeonITTF.js';
import { ComprobantesForm } from '../componentes/carga/ComprobantesForm.js';
import { subirComprobantesPartido } from '../utils/storage-helper.js';

export class CargaVista {
    constructor() {
        this.ligaActual = 'LIGA_A';
        this.fechaActual = 1;
        this.partidoId = null;
        this.partidosCache = [];
        this.equiposMapa = {};

        // 1. Selector de partidos
        this.selector = new SelectorPartido({
            onCambioLiga: (liga) => this.cambiarLiga(liga),
            onCambioFecha: (fecha) => this.cambiarFecha(fecha),
            onSeleccionarPartido: (id) => this.alSeleccionarPartido(id)
        });

        // 2. Acordeón ITTF
        this.acordeon = new AcordeonITTF('contenedor-acordeones-partidos', {
            onCambioTotales: (l, v) => this.actualizarTotales(l, v)
        });

        // 3. Gestión de Comprobantes
        this.comprobantes = new ComprobantesForm();
    }

    async render(container) {
        container.innerHTML = this.obtenerHTMLBase();
        await this.cargarDatos();
        this.conectarEventos(container);
    }

    // --- MÉTODOS DE MANEJO DE CAMBIO DE LIGA Y FECHA/FASE ---
    cambiarLiga(liga) {
        this.ligaActual = liga;
        this.actualizarEstiloBotonesLiga();
        if (this.selector && typeof this.selector.actualizarBotonesLiga === 'function') {
            this.selector.actualizarBotonesLiga(liga);
        }
        this.poblarFechas(true); // Fuerza el reset de fecha a la 1ra opción de la nueva liga
        this.actualizarDesplegablePartidos();
        this.limpiarFormularioCompleto();
    }

    cambiarFecha(fecha) {
        this.fechaActual = fecha;
        // Sincronizamos el estado de las opciones y los partidos filtrados
        this.selector.renderFechas(this.obtenerNumerosFechas(), this.fechaActual);
        this.actualizarDesplegablePartidos();
        this.limpiarFormularioCompleto();
    }

    // Método auxiliar para obtener los números de fecha según la liga
    obtenerNumerosFechas() {
        const partidosDeLiga = this.partidosCache.filter(
            p => !p.esPlayoff && (p.liga || '').toUpperCase() === this.ligaActual.toUpperCase()
        );
        return [...new Set(
            partidosDeLiga.map(p => Number(p.fecha_numero))
        )].filter(n => !isNaN(n) && n > 0).sort((a, b) => a - b);
    }

    poblarFechas(resetearFecha = false) {
        const numerosFecha = this.obtenerNumerosFechas();

        if (resetearFecha) {
            this.fechaActual = numerosFecha.length > 0 ? numerosFecha[0] : 'PLAYOFF_CUARTOS';
        }

        this.selector.renderFechas(numerosFecha, this.fechaActual);
    }

    limpiarFormularioCompleto() {
        this.actualizarTotales(0, 0);

        const seccionIttf = document.getElementById('seccion-partidos-ittf');
        if (seccionIttf) seccionIttf.classList.add('hidden');

        if (this.acordeon && typeof this.acordeon.resetearEstado === 'function') {
            this.acordeon.resetearEstado();
        }

        if (this.comprobantes && typeof this.comprobantes.limpiar === 'function') {
            this.comprobantes.limpiar();
        }
    }

    conectarEventos(container = document) {
        // Asignación de botones de cambio de liga si existen fuera del SelectorPartido
        const btnA = container.querySelector('#btn-liga-a');
        const btnB = container.querySelector('#btn-liga-b');

        if (btnA) btnA.onclick = () => this.cambiarLiga('LIGA_A');
        if (btnB) btnB.onclick = () => this.cambiarLiga('LIGA_B');

        // Formulario principal de envío
        const formEnvio = container.querySelector('#form-envio-planilla');
        if (formEnvio) {
            formEnvio.onsubmit = (e) => this.guardar(e);
        }
    }

    async cargarDatos() {
        await ligaState.init(window.supabase);

        const [resPartidos, resEquipos, resPlayoffs] = await Promise.all([
            window.supabase.from('fixture').select('*'),
            window.supabase.from('equipos').select('*'),
            window.supabase.from('liga_playoffs').select('*')
        ]);

        const partidosRegulares = (resPartidos.data || []).map(p => ({
            ...p,
            esPlayoff: false
        }));

        const partidosPlayoffs = (resPlayoffs.data || []).map(p => ({
            ...p,
            esPlayoff: true,
            local_id: p.equipo_1_id,
            visitante_id: p.equipo_2_id,
            score_local: (p.puntos_equipo_1 !== null && p.puntos_equipo_1 !== undefined) ? p.puntos_equipo_1 : null,
            score_visitante: (p.puntos_equipo_2 !== null && p.puntos_equipo_2 !== undefined) ? p.puntos_equipo_2 : null
        }));

        // Unificamos el caché
        this.partidosCache = [...partidosRegulares, ...partidosPlayoffs];

        (resEquipos.data || []).forEach(eq => this.equiposMapa[eq.id] = eq.nombre || `Club ${eq.id}`);

        this.poblarFechas();
        this.actualizarDesplegablePartidos();
    }

    async alSeleccionarPartido(partidoId) {
        this.partidoId = partidoId;
        this.limpiarFormularioCompleto();

        if (!partidoId) return;

        // Búsqueda exacta por ID
        const partido = this.partidosCache.find(p => String(p.id) === String(partidoId));
        if (!partido) return;

        const estadoUpper = String(partido.estado || '').toUpperCase().trim();

        // REGLA DE BLOQUEO:
        let estaCerrado = false;
        if (partido.esPlayoff) {
            estaCerrado = (estadoUpper === 'FINALIZADO' || estadoUpper === 'CERRADO');
        } else {
            estaCerrado = (estadoUpper === 'FINALIZADO' || estadoUpper === 'CERRADO' || partido.score_local !== null || partido.walkover !== null);
        }

        if (estaCerrado) {
            this.actualizarTotales(partido.score_local ?? 0, partido.score_visitante ?? 0);
            alert("🔒 Esta serie se encuentra cerrada y no permite la carga de nuevos resultados.");
            return;
        }

        // Si la llave no tiene los dos equipos definidos aún
        if (!partido.local_id || !partido.visitante_id) {
            alert("⏳ Este cruce de playoffs aún no tiene los dos equipos definidos.");
            return;
        }

        const nomLoc = this.equiposMapa[partido.local_id] || `Local (${partido.local_id})`;
        const nomVis = this.equiposMapa[partido.visitante_id] || `Visitante (${partido.visitante_id})`;

        if (document.getElementById('txt-nombre-local')) document.getElementById('txt-nombre-local').textContent = nomLoc;
        if (document.getElementById('txt-nombre-visitante')) document.getElementById('txt-nombre-visitante').textContent = nomVis;
        if (document.getElementById('nombre-club-local')) document.getElementById('nombre-club-local').textContent = nomLoc;
        if (document.getElementById('nombre-club-visitante')) document.getElementById('nombre-club-visitante').textContent = nomVis;

        try {
            const [resL, resV] = await Promise.all([
                window.supabase.from('jugadores').select('*').eq('equipo_id', partido.local_id),
                window.supabase.from('jugadores').select('*').eq('equipo_id', partido.visitante_id)
            ]);

            this.acordeon.setPlanteles(resL.data || [], resV.data || []);
            this.acordeon.resetearEstado();
            this.acordeon.render();

            const seccionIttf = document.getElementById('seccion-partidos-ittf');
            if (seccionIttf) seccionIttf.classList.remove('hidden');

        } catch (error) {
            console.error("Error cargando planteles:", error);
            alert("No se pudieron obtener los planteles de los equipos.");
        }
    }

    actualizarTotales(scoreL, scoreV) {
        if (document.getElementById('score-local-input')) document.getElementById('score-local-input').value = scoreL;
        if (document.getElementById('score-visitante-input')) document.getElementById('score-visitante-input').value = scoreV;
        if (document.getElementById('marcador-parcial-txt')) document.getElementById('marcador-parcial-txt').textContent = `${scoreL} - ${scoreV}`;
    }

    // --- MÉTODOS AUXILIARES ---
    actualizarEstiloBotonesLiga() {
        const btnA = document.getElementById('btn-liga-a');
        const btnB = document.getElementById('btn-liga-b');
        if (!btnA || !btnB) return;

        const activo = ['bg-asatemeBlue', 'text-white', 'border-asatemeBlue'];
        const inactivo = ['bg-white', 'text-gray-700', 'border-gray-200'];

        if (this.ligaActual === 'LIGA_A') {
            btnA.classList.add(...activo); btnA.classList.remove(...inactivo);
            btnB.classList.add(...inactivo); btnB.classList.remove(...activo);
        } else {
            btnB.classList.add(...activo); btnB.classList.remove(...inactivo);
            btnA.classList.add(...inactivo); btnA.classList.remove(...activo);
        }
    }

    actualizarDesplegablePartidos() {
        let filtrados = [];
        const esPlayoff = String(this.fechaActual).startsWith('PLAYOFF_');

        if (esPlayoff) {
            // Se recuperan los playoffs y garantizamos que todos lleven la bandera esPlayoff = true
            const listaPlayoffsRaw = ligaState.playoffsData?.[this.ligaActual] || [];

            const listaPlayoffs = listaPlayoffsRaw.map(p => ({
                ...p,
                esPlayoff: true,
                local_id: p.equipo_1_id,
                visitante_id: p.equipo_2_id,
                score_local: p.puntos_equipo_1,
                score_visitante: p.puntos_equipo_2
            }));

            if (this.fechaActual === 'PLAYOFF_CUARTOS') {
                filtrados = listaPlayoffs.filter(p => p.fase === 'CUARTOS' || p.codigo_llave?.startsWith('QF'));
            } else if (this.fechaActual === 'PLAYOFF_SEMI') {
                filtrados = listaPlayoffs.filter(p => p.fase === 'SEMIFINAL' || p.codigo_llave?.startsWith('SF'));
            } else if (this.fechaActual === 'PLAYOFF_FINAL') {
                filtrados = listaPlayoffs.filter(p => p.fase === 'FINAL' || p.codigo_llave === 'FINAL');
            }
        } else {
            // Filtro por Fase Regular
            filtrados = this.partidosCache.filter(p =>
                !p.esPlayoff &&
                (p.liga || '').toUpperCase() === this.ligaActual.toUpperCase() &&
                Number(p.fecha_numero) === Number(this.fechaActual)
            );
        }

        this.selector.renderPartidos(filtrados, this.equiposMapa);
    }

    // --- PROCESO DE ENVÍO Y TRANSACCIÓN COMPLETA DE RESULTADOS ---
    async guardar(e) {
        if (e && typeof e.preventDefault === 'function') {
            e.preventDefault();
            e.stopPropagation();
        }

        // ----------------------------------------------------
        // 1. Validar selección de partido
        // ----------------------------------------------------
        if (!this.partidoId) {
            alert("⚠️ Por favor, seleccioná un partido del desplegable.");
            return false;
        }

        const partidoSeleccionado = this.partidosCache.find(p => String(p.id) === String(this.partidoId));
        if (!partidoSeleccionado) {
            alert("⚠️ Error: No se encontró el partido en memoria.");
            return false;
        }

        // ----------------------------------------------------
        // 2. VALIDAR COMPROBANTES Y PIN PRIMERO
        // (Si faltan, corta de inmediato sin modificar BD ni el formulario)
        // ----------------------------------------------------
        const datosComprobantes = this.comprobantes.obtenerArchivosYToken();
        if (!datosComprobantes.valido) {
            alert(datosComprobantes.mensajeError);
            return false;
        }

        // ----------------------------------------------------
        // 3. Consultar ESTADO REAL en Supabase antes de proceder
        // ----------------------------------------------------
        const esPlayoff = Boolean(partidoSeleccionado.esPlayoff || String(this.fechaActual).startsWith('PLAYOFF_'));
        const tablaTarget = esPlayoff ? 'liga_playoffs' : 'fixture';
        const columnasSelect = esPlayoff ? 'estado' : 'estado, walkover';

        try {
            const { data: partidoBD, error: errConsulta } = await window.supabase
                .from(tablaTarget)
                .select(columnasSelect)
                .eq('id', this.partidoId)
                .maybeSingle();

            if (errConsulta) {
                console.error("💥 Error devuelto por Supabase al consultar estado:", errConsulta);
                alert(`⚠️ Error al verificar el estado del partido en el servidor.\nDetalle: ${errConsulta.message || 'Error de conexión/permisos'}`);
                return false;
            }

            if (partidoBD) {
                const estadoReal = String(partidoBD.estado || '').toUpperCase().trim();
                const tieneWalkover = !esPlayoff && partidoBD.walkover !== null;

                if (estadoReal === "FINALIZADO" || estadoReal === "CERRADO" || tieneWalkover) {
                    alert("🔒 Esta serie ya fue enviada previamente y se encuentra cerrada.");
                    return false;
                }
            }
        } catch (errEstado) {
            console.error("💥 Excepción al consultar estado:", errEstado);
            alert(`⚠️ No se pudo verificar el estado actual del partido: ${errEstado.message || errEstado}`);
            return false;
        }

        // ----------------------------------------------------
        // 4. Validar estado de la planilla de partidos (si no es Walkover)
        // ----------------------------------------------------
        const chkLocalWO = document.getElementById('wo-local-check')?.checked;
        const chkVisitanteWO = document.getElementById('wo-visitante-check')?.checked;
        const esWalkover = chkLocalWO || chkVisitanteWO;

        let estadoPlanilla = {};

        if (!esWalkover) {
            estadoPlanilla = this.acordeon.obtenerEstadoPlanilla();

            for (let i = 1; i <= 5; i++) {
                const part = estadoPlanilla[`partido${i}`];
                if (!part || !part.terminado) {
                    alert(`⚠️ Planilla incompleta. El Partido ${i} no registra un ganador reglamentario.`);
                    return false;
                }
                if (!part.local1 || !part.vis1 || (part.modalidad === 'DOBLES' && (!part.local2 || !part.vis2))) {
                    alert(`⚠️ Falta asignar jugadores o parejas en el Partido ${i}.`);
                    return false;
                }
            }
        }

        // ----------------------------------------------------
        // 5. Proceso de Envío y Subida
        // ----------------------------------------------------
        const scoreLocal = parseInt(document.getElementById('score-local-input')?.value) || 0;
        const scoreVisitante = parseInt(document.getElementById('score-visitante-input')?.value) || 0;

        const btnEnviar = document.querySelector('#form-envio-planilla button[type="submit"]') || document.getElementById('btn-enviar-planilla');
        const textoOriginalBtn = btnEnviar ? btnEnviar.innerHTML : '';

        if (btnEnviar) {
            btnEnviar.disabled = true;
            btnEnviar.innerHTML = `<i class="fas fa-spinner fa-spin mr-1.5"></i> Validando Token...`;
        }

        try {
            // A. Verificación del PIN/Token en la tabla de equipos
            const { data: equiposValidados, error: errToken } = await window.supabase
                .from('equipos')
                .select('*')
                .or(`id.eq.${partidoSeleccionado.local_id},id.eq.${partidoSeleccionado.visitante_id}`)
                .eq('token', datosComprobantes.pin);

            if (errToken || !equiposValidados || equiposValidados.length === 0) {
                alert("⚠️ El Código de Validación (PIN) del Club es incorrecto.");
                if (btnEnviar) {
                    btnEnviar.disabled = false;
                    btnEnviar.innerHTML = textoOriginalBtn;
                }
                return false;
            }

            // B. Subida de archivos a Storage
            if (btnEnviar) {
                btnEnviar.innerHTML = `<i class="fas fa-spinner fa-spin mr-1.5"></i> Subiendo archivos...`;
            }

            const localNombre = this.equiposMapa[partidoSeleccionado.local_id] || `Local_${partidoSeleccionado.local_id}`;
            const visitanteNombre = this.equiposMapa[partidoSeleccionado.visitante_id] || `Visitante_${partidoSeleccionado.visitante_id}`;

            const { urlPlanilla, urlPagoLoc, urlPagoVis } = await subirComprobantesPartido({
                partidoId: this.partidoId,
                filePlanilla: datosComprobantes.archivos.acta,
                filePagoLocal: datosComprobantes.archivos.pagoLocal,
                filePagoVisitante: datosComprobantes.archivos.pagoVisitante,
                localNombre,
                visitanteNombre
            });

            // C. Guardar los 5 partidos individuales (si no es Walkover)
if (!esWalkover) {
    if (btnEnviar) {
        btnEnviar.innerHTML = `<i class="fas fa-spinner fa-spin mr-1.5"></i> Guardando detalles...`;
    }

    const tablaDetalles = esPlayoff ? 'liga_playoffs_detalles' : 'fixture_detalles';

    const filasDetalle = [];
    for (let i = 1; i <= 5; i++) {
        const part = estadoPlanilla[`partido${i}`];
        if (!part) continue;

        filasDetalle.push({
            partido_id: esPlayoff ? this.partidoId : parseInt(this.partidoId),
            orden: i,
            modalidad: part.modalidad || 'INDIVIDUAL',
            local_jugador1_id: parseInt(part.local1),
            local_jugador2_id: part.local2 ? parseInt(part.local2) : null,
            visitante_jugador1_id: parseInt(part.vis1),
            visitante_jugador2_id: part.vis2 ? parseInt(part.vis2) : null,

            // Puntos de cada set en formato Array [11, 11, 11, 0, 0]
            sets_local: Array.isArray(part.setsL) ? part.setsL : [0, 0, 0, 0, 0],
            sets_visitante: Array.isArray(part.setsV) ? part.setsV : [0, 0, 0, 0, 0],

            // Total de sets ganados en formato String "3" / "0"
            score_sets_local: String(part.scoreL ?? 0),
            score_sets_visitante: String(part.scoreV ?? 0)
        });
    }

    const { error: errDetalle } = await window.supabase
        .from(tablaDetalles)
        .insert(filasDetalle);

    if (errDetalle) throw errDetalle;
}

            let valorWalkover = null;
            if (chkLocalWO) valorWalkover = "LOCAL";
            if (chkVisitanteWO) valorWalkover = "VISITANTE";

            if (esPlayoff) {
                let ganadorId = null;
                if (scoreLocal > scoreVisitante) ganadorId = partidoSeleccionado.local_id;
                else if (scoreVisitante > scoreLocal) ganadorId = partidoSeleccionado.visitante_id;

                const { error: errUpdatePlayoff } = await window.supabase
                    .from('liga_playoffs')
                    .update({
                        puntos_equipo_1: scoreLocal,
                        puntos_equipo_2: scoreVisitante,
                        ganador_id: ganadorId,
                        estado: "FINALIZADO"
                    })
                    .eq('id', this.partidoId);

                if (errUpdatePlayoff) throw errUpdatePlayoff;

            } else {
                const { error: errUpdate } = await window.supabase
                    .from('fixture')
                    .update({
                        score_local: scoreLocal,
                        score_visitante: scoreVisitante,
                        estado: "Finalizado",
                        url_acta: urlPlanilla,
                        url_pago_local: urlPagoLoc,
                        url_pago_visitante: urlPagoVis,
                        walkover: valorWalkover
                    })
                    .eq('id', this.partidoId);

                if (errUpdate) throw errUpdate;
            }

            alert("¡Resultados y comprobantes cargados con éxito!");
            window.location.href = "liga-equipos.html";

        } catch (error) {
            console.error("💥 Error crítico al guardar:", error);
            alert(`Ocurrió un error al guardar.\n\nDetalle: ${error.message || error}`);
            if (btnEnviar) {
                btnEnviar.disabled = false;
                btnEnviar.innerHTML = textoOriginalBtn;
            }
        }
    }

    obtenerHTMLBase() {
        return ``;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const vista = new CargaVista();
    await vista.cargarDatos();
    vista.conectarEventos(document);
});