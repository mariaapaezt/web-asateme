// js/componentes/SelectorPartido.js

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
            const fecha = Number(e.target.value) || 1;
            this.onCambioFecha(fecha);
        });

        const selectPartido = document.getElementById('select-partido-id');
        if (selectPartido) {
            selectPartido.addEventListener('change', (e) => {
                const partidoId = e.target.value;

                // Verificamos que la función callback existe y fue pasada en el constructor
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

    renderFechas(numerosFecha) {
        const selectFechas = document.getElementById('select-fecha-num');
        if (!selectFechas) return;

        if (numerosFecha.length === 0) {
            selectFechas.innerHTML = '<option value="">No hay fechas programadas</option>';
            return;
        }

        selectFechas.innerHTML = numerosFecha.map(num =>
            `<option value="${num}">Fecha ${num}</option>`
        ).join('');
    }

    renderPartidos(partidos, equiposMapa) {
        const select = document.getElementById('select-partido-id');
        if (!select) return;

        if (partidos.length === 0) {
            select.innerHTML = '<option value="">No hay partidos agendados para este filtro.</option>';
            return;
        }

        let html = '<option value="">-- Seleccioná la serie en juego --</option>';
        html += partidos.map(p => {
            const nombreLocal = equiposMapa[p.local_id] || `Local (${p.local_id})`;
            const nombreVisitante = equiposMapa[p.visitante_id] || `Visitante (${p.visitante_id})`;

            const estaCerrado = p.estado === 'Finalizado' || p.score_local !== null;
            const estadoTxt = estaCerrado ? " ( 🔒 Cerrada )" : "";

            return `<option value="${p.id}">${nombreLocal} vs ${nombreVisitante}${estadoTxt}</option>`;
        }).join('');

        select.innerHTML = html;
    }
}