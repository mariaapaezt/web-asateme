// js/vistas/carga.js

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

    async cargarDatos() {
        await ligaState.init();
        const [resPartidos, resEquipos] = await Promise.all([
            window.supabase.from('fixture').select('*'),
            window.supabase.from('equipos').select('*')
        ]);

        this.partidosCache = resPartidos.data || [];
        (resEquipos.data || []).forEach(eq => this.equiposMapa[eq.id] = eq.nombre || `Club ${eq.id}`);

        this.poblarFechas();
        this.actualizarDesplegablePartidos();
    }

    conectarEventos(container) {
        container.querySelector('#form-envio-planilla')?.addEventListener('submit', (e) => this.guardar(e));

        const chkLocal = container.querySelector('#wo-local-check');
        const chkVisitante = container.querySelector('#wo-visitante-check');

        chkLocal?.addEventListener('change', () => this.manejarCambioWO('LOCAL'));
        chkVisitante?.addEventListener('change', () => this.manejarCambioWO('VISITANTE'));
    }

    // --- LIMPIEZA DE FORMULARIO DELEGADA A CADA COMPONENTE ---
    limpiarFormularioCompleto() {
        const seccionIttf = document.getElementById('seccion-partidos-ittf');
        if (seccionIttf) seccionIttf.classList.add('hidden');

        const chkLocal = document.getElementById('wo-local-check');
        const chkVisitante = document.getElementById('wo-visitante-check');
        if (chkLocal) chkLocal.checked = false;
        if (chkVisitante) chkVisitante.checked = false;

        this.actualizarTotales(0, 0);

        if (document.getElementById('txt-nombre-local')) document.getElementById('txt-nombre-local').textContent = 'Equipo Local';
        if (document.getElementById('txt-nombre-visitante')) document.getElementById('txt-nombre-visitante').textContent = 'Equipo Visitante';

        // Delegación limpia a los componentes
        this.acordeon.resetearEstado();
        this.comprobantes.limpiar();
    }

    // --- MANEJO DE WALKOVER (W.O.) ---
    manejarCambioWO(tipo) {
        const chkLocal = document.getElementById('wo-local-check');
        const chkVisitante = document.getElementById('wo-visitante-check');
        const seccionIttf = document.getElementById('seccion-partidos-ittf');

        if (!chkLocal || !chkVisitante) return;

        if (tipo === 'LOCAL' && chkLocal.checked) {
            chkVisitante.checked = false;
            this.actualizarTotales(0, 5);
            if (seccionIttf) seccionIttf.classList.add('hidden');

        } else if (tipo === 'VISITANTE' && chkVisitante.checked) {
            chkLocal.checked = false;
            this.actualizarTotales(5, 0);
            if (seccionIttf) seccionIttf.classList.add('hidden');

        } else {
            this.actualizarTotales(0, 0);
            if (this.partidoId) {
                this.alSeleccionarPartido(this.partidoId);
            }
        }
    }

    // --- MÉTODOS INVOCADOS POR SELECTORPARTIDO ---
    cambiarLiga(liga) {
        if (this.ligaActual === liga) return;
        this.ligaActual = liga;
        this.limpiarFormularioCompleto();
        this.actualizarEstiloBotonesLiga();
        this.poblarFechas();
        this.actualizarDesplegablePartidos();
    }

    cambiarFecha(fecha) {
        this.fechaActual = Number(fecha);
        this.limpiarFormularioCompleto();
        this.actualizarDesplegablePartidos();
    }

    async alSeleccionarPartido(partidoId) {
        this.partidoId = partidoId;
        this.limpiarFormularioCompleto();

        if (!partidoId) return;

        const partido = this.partidosCache.find(p => String(p.id) === String(partidoId));
        if (!partido) return;

        const estadoNormalizado = (partido.estado || '').toLowerCase();
        const estaCerrado = estadoNormalizado === 'finalizado' ||
            estadoNormalizado === 'cerrado' ||
            partido.score_local !== null ||
            partido.walkover !== null;

        if (estaCerrado) {
            this.actualizarTotales(partido.score_local ?? 0, partido.score_visitante ?? 0);
            alert("🔒 Esta serie se encuentra cerrada y no permite la carga de nuevos resultados.");
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

    poblarFechas() {
        const selectFechas = document.getElementById('select-fecha-num');
        if (!selectFechas) return;

        const partidosDeLiga = this.partidosCache.filter(
            p => (p.liga || '').toUpperCase() === this.ligaActual.toUpperCase()
        );

        const numerosFecha = [...new Set(
            partidosDeLiga.map(p => Number(p.fecha_numero))
        )].filter(n => !isNaN(n) && n > 0).sort((a, b) => a - b);

        if (numerosFecha.length === 0) {
            selectFechas.innerHTML = '<option value="">No hay fechas programadas</option>';
            return;
        }

        selectFechas.innerHTML = numerosFecha.map(num =>
            `<option value="${num}">Fecha ${num}</option>`
        ).join('');

        this.fechaActual = numerosFecha[0];
    }

    actualizarDesplegablePartidos() {
        const select = document.getElementById('select-partido-id');
        if (!select) return;

        const filtrados = this.partidosCache.filter(p =>
            (p.liga || '').toUpperCase() === this.ligaActual.toUpperCase() &&
            Number(p.fecha_numero || 1) === Number(this.fechaActual)
        );

        let html = '<option value="">-- Seleccioná la serie en juego --</option>';

        html += filtrados.map(p => {
            const nombreLocal = this.equiposMapa[p.local_id] || p.local_id;
            const nombreVisitante = this.equiposMapa[p.visitante_id] || p.visitante_id;

            const estadoNormalizado = (p.estado || '').toLowerCase();
            const estaCerrado = estadoNormalizado === 'finalizado' ||
                estadoNormalizado === 'cerrado' ||
                p.score_local !== null ||
                p.walkover !== null;

            if (estaCerrado) {
                return `<option value="${p.id}" class="bg-gray-100 text-gray-400 font-normal">
                    ${nombreLocal} vs ${nombreVisitante} ( 🔒 Cerrada )
                </option>`;
            } else {
                return `<option value="${p.id}">
                    ${nombreLocal} vs ${nombreVisitante}
                </option>`;
            }
        }).join('');

        select.innerHTML = html;
    }

    // --- PROCESO DE ENVÍO Y TRANSACCIÓN COMPLETA DE RESULTADOS ---
    async guardar(e) {
        e.preventDefault();

        if (!this.partidoId) {
            return alert("⚠️ Por favor, seleccioná un partido del desplegable.");
        }

        const partidoSeleccionado = this.partidosCache.find(p => String(p.id) === String(this.partidoId));
        if (!partidoSeleccionado) {
            return alert("⚠️ Error: No se encontró el partido en memoria.");
        }

        if (partidoSeleccionado.estado === "Finalizado" || partidoSeleccionado.walkover !== null) {
            return alert("🔒 Esta serie ya fue enviada y se encuentra cerrada.");
        }

        const chkLocalWO = document.getElementById('wo-local-check')?.checked;
        const chkVisitanteWO = document.getElementById('wo-visitante-check')?.checked;
        const esWalkover = chkLocalWO || chkVisitanteWO;

        let estadoPlanilla = {};

        // 1. Validaciones según modalidad (Norma ITTF o Walkover)
        if (!esWalkover) {
            estadoPlanilla = this.acordeon.obtenerEstadoPlanilla();

            for (let i = 1; i <= 5; i++) {
                const part = estadoPlanilla[`partido${i}`];
                if (!part || !part.terminado) {
                    return alert(`⚠️ Planilla incompleta. El Partido ${i} no registra un ganador reglamentario.`);
                }
                if (!part.local1 || !part.vis1 || (part.modalidad === 'DOBLES' && (!part.local2 || !part.vis2))) {
                    return alert(`⚠️ Falta asignar jugadores o parejas en el Partido ${i}.`);
                }
            }
        }

        // 2. Validación de adjuntos y Token desde ComprobantesForm
        const datosComprobantes = this.comprobantes.obtenerArchivosYToken();
        if (!datosComprobantes.valido) {
            return alert(datosComprobantes.mensajeError);
        }

        const scoreLocal = parseInt(document.getElementById('score-local-input')?.value) || 0;
        const scoreVisitante = parseInt(document.getElementById('score-visitante-input')?.value) || 0;

        const btnEnviar = document.querySelector('#form-envio-planilla button[type="submit"]') || document.getElementById('btn-enviar-planilla');
        const textoOriginalBtn = btnEnviar ? btnEnviar.innerHTML : '';

        if (btnEnviar) {
            btnEnviar.disabled = true;
            btnEnviar.innerHTML = `<i class="fas fa-spinner fa-spin mr-1.5"></i> Validando Token...`;
        }

        try {
            // A. Validar Token del Club contra Supabase
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
                return;
            }

            // B. Subida paralela de Comprobantes mediante storage-helper
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

            // C. Inserción en 'fixture_detalles' si no es Walkover
            if (!esWalkover) {
                if (btnEnviar) {
                    btnEnviar.innerHTML = `<i class="fas fa-spinner fa-spin mr-1.5"></i> Guardando detalles...`;
                }

                const filasDetalle = [];
                for (let i = 1; i <= 5; i++) {
                    const part = estadoPlanilla[`partido${i}`];
                    filasDetalle.push({
                        partido_id: this.partidoId,
                        orden: i,
                        modalidad: part.modalidad,
                        local_jugador1_id: parseInt(part.local1),
                        local_jugador2_id: part.local2 ? parseInt(part.local2) : null,
                        visitante_jugador1_id: parseInt(part.vis1),
                        visitante_jugador2_id: part.vis2 ? parseInt(part.vis2) : null,
                        sets_local: part.setsL,
                        sets_visitante: part.setsV,
                        score_sets_local: part.scoreL,
                        score_sets_visitante: part.scoreV
                    });
                }

                const { error: errDetalle } = await window.supabase.from('fixture_detalles').insert(filasDetalle);
                if (errDetalle) throw errDetalle;
            }

            // D. Actualización final de la tabla 'fixture'
            if (btnEnviar) {
                btnEnviar.innerHTML = `<i class="fas fa-spinner fa-spin mr-1.5"></i> Finalizando serie...`;
            }

            let valorWalkover = null;
            if (chkLocalWO) valorWalkover = "LOCAL";
            if (chkVisitanteWO) valorWalkover = "VISITANTE";

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

            alert("¡Resultados y comprobantes cargados con éxito absoluto!");
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
        return `...`;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const vista = new CargaVista();
    await vista.cargarDatos();
    vista.conectarEventos(document);
});