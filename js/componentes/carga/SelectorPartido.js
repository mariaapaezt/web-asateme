// js/componentes/carga/SelectorPartido.js

export class SelectorPartido {
    constructor({ onCambioLiga, onCambioFecha, onSeleccionarPartido }) {
        this.onCambioLiga = onCambioLiga;
        this.onCambioFecha = onCambioFecha;
        this.onSeleccionarPartido = onSeleccionarPartido;

        this.init();
    }

    init() {
        document.getElementById('btn-liga-a')?.addEventListener('click', () => this.onCambioLiga('LIGA_A'));
        document.getElementById('btn-liga-b')?.addEventListener('click', () => this.onCambioLiga('LIGA_B'));

        document.getElementById('select-fecha-num')?.addEventListener('change', (e) => {
            const val = e.target.value;
            const fecha = isNaN(val) ? val : Number(val);
            this.onCambioFecha(fecha);
        });

        const selectPartido = document.getElementById('select-partido-id');
        if (selectPartido) {
            selectPartido.addEventListener('change', (e) => {
                const partidoId = e.target.value;

                if (typeof this.onSeleccionarPartido === 'function') {
                    this.onSeleccionarPartido(partidoId);
                } else {
                    console.error("⚠️ 'onSeleccionarPartido' no está definida como función en SelectorPartido.");
                }
            });
        }
    }

    actualizarBotonesLiga(ligaActual) {
        const btnA = document.getElementById('btn-liga-a');
        const btnB = document.getElementById('btn-liga-b');
        if (!btnA || !btnB) return;

        const activo = "py-2.5 px-4 rounded-xl font-bold text-xs border text-center transition-all bg-asatemeBlue text-white border-asatemeBlue cursor-pointer";
        const inactivo = "py-2.5 px-4 rounded-xl font-bold text-xs border text-center transition-all bg-white text-gray-700 border-gray-200 cursor-pointer";

        btnA.className = (ligaActual === 'LIGA_A') ? activo : inactivo;
        btnB.className = (ligaActual === 'LIGA_B') ? activo : inactivo;
    }

    // Recibe fechaSeleccionada para mantener el valor activo
    // MODIFICACIÓN: Preserva visualmente la fecha/instancia seleccionada en el combo
    renderFechas(numerosFecha, fechaSeleccionada = null) {
        const selectFechas = document.getElementById('select-fecha-num');
        if (!selectFechas) return;

        let html = '';

        // 1. Grupo Fase Regular
        if (numerosFecha && numerosFecha.length > 0) {
            html += `<optgroup label="Fase Regular">`;
            html += numerosFecha.map(num => {
                const esSel = String(num) === String(fechaSeleccionada) ? 'selected' : '';
                return `<option value="${num}" ${esSel}>Fecha ${num}</option>`;
            }).join('');
            html += `</optgroup>`;
        } else {
            html += `<optgroup label="Fase Regular">
                <option value="" disabled>Sin fechas disponibles</option>
            </optgroup>`;
        }

        // 2. Grupo Playoffs / Fase Final
        const isQ = String(fechaSeleccionada) === 'PLAYOFF_CUARTOS' ? 'selected' : '';
        const isS = String(fechaSeleccionada) === 'PLAYOFF_SEMI' ? 'selected' : '';
        const isF = String(fechaSeleccionada) === 'PLAYOFF_FINAL' ? 'selected' : '';

        html += `
            <optgroup label="🏆 Fase Final / Playoffs">
                <option value="PLAYOFF_CUARTOS" ${isQ}>Cuartos de Final</option>
                <option value="PLAYOFF_SEMI" ${isS}>Semifinales</option>
                <option value="PLAYOFF_FINAL" ${isF}>Gran Final</option>
            </optgroup>
        `;

        selectFechas.innerHTML = html;

        // FORZADO EXPLÍCITO EN DOM
        if (fechaSeleccionada !== null && fechaSeleccionada !== undefined) {
            selectFechas.value = String(fechaSeleccionada);
        }
    }
    
    renderPartidos(partidos, equiposMapa) {
        const select = document.getElementById('select-partido-id');
        if (!select) return;

        if (!partidos || partidos.length === 0) {
            select.innerHTML = '<option value="">No hay partidos agendados para este filtro.</option>';
            return;
        }

        let html = '<option value="">-- Seleccioná la serie en juego --</option>';
        html += partidos.map(p => {
            const locId = p.local_id || p.equipo_1_id;
            const visId = p.visitante_id || p.equipo_2_id;

            const nombreLocal = equiposMapa[locId] || p.origen_equipo_1 || `Equipo ${locId || 'TBD'}`;
            const nombreVisitante = equiposMapa[visId] || p.origen_equipo_2 || `Equipo ${visId || 'TBD'}`;

            if (!locId || !visId) {
                return `<option value="" disabled class="text-gray-400">
                    ${p.codigo_llave || 'Cruce'}: Por definir clasificados
                </option>`;
            }

            const estadoNormalizado = String(p.estado || '').toLowerCase().trim();

            let estaCerrado = false;
            if (p.esPlayoff) {
                estaCerrado = (estadoNormalizado === 'finalizado' || estadoNormalizado === 'cerrado');
            } else {
                estaCerrado = (
                    estadoNormalizado === 'finalizado' ||
                    estadoNormalizado === 'cerrado' ||
                    (p.score_local !== null && p.score_local !== undefined) ||
                    p.walkover !== null
                );
            }

            const estadoTxt = estaCerrado ? " ( 🔒 Cerrada )" : "";

            return `<option value="${p.id}">${nombreLocal} vs ${nombreVisitante}${estadoTxt}</option>`;
        }).join('');

        select.innerHTML = html;
    }
}