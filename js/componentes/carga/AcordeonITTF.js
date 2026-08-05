// js/componentes/carga/AcordeonITTF.js

export class AcordeonITTF {
    constructor(containerId, { onCambioTotales }) {
        this.container = document.getElementById(containerId);
        this.onCambioTotales = onCambioTotales;
        this.planillaState = {};
        this.jugadoresLocales = [];
        this.jugadoresVisitantes = [];
        this.resetearEstado();
    }

    resetearEstado() {
        this.planillaState = {};
        for (let i = 1; i <= 5; i++) {
            this.planillaState[`partido${i}`] = {
                modalidad: i === 3 ? 'DOBLES' : 'SINGLE',
                local1: '', local2: '', vis1: '', vis2: '',
                setsL: [0, 0, 0, 0, 0], setsV: [0, 0, 0, 0, 0],
                scoreL: 0, scoreV: 0, terminado: false,
                abiertoManual: i === 1
            };
        }
    }

    /**
     * MÉTODO PÚBLICO: Expone el estado interno para la recolección
     * y validación al procesar el envío de la planilla.
     */
    obtenerEstadoPlanilla() {
        return this.planillaState;
    }

    setPlanteles(locales, visitantes) {
        this.jugadoresLocales = locales;
        this.jugadoresVisitantes = visitantes;
    }

    render() {
        if (!this.container) return;

        let html = '';
        const modalidades = ["Single 1", "Single 2", "Dobles (Parejas)", "Single 3", "Single 4"];
        let tabIndex = 1;

        for (let i = 1; i <= 5; i++) {
            const p = this.planillaState[`partido${i}`];
            const esDobles = p.modalidad === 'DOBLES';

            const iconoEstado = p.terminado
                ? "fas fa-check-circle text-green-500 text-base"
                : "far fa-circle text-gray-300 text-base";

            const resumen = p.terminado
                ? `<span class="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-md font-bold">Confirmado (${p.scoreL}-${p.scoreV})</span>`
                : `<span class="text-[11px] text-gray-400 font-normal">En carga</span>`;

            html += `
                <div class="border border-gray-200 rounded-xl overflow-hidden shadow-2xs bg-white transition-all duration-200">
                    <div class="bg-gray-50 p-3.5 flex justify-between items-center cursor-pointer select-none border-b border-gray-100 hover:bg-gray-100/70 transition-colors" data-toggle="${i}">
                        <div class="flex items-center gap-2.5">
                            <i class="${iconoEstado}"></i>
                            <span class="font-bold text-xs text-gray-700 uppercase tracking-wider">Partido ${i}: ${modalidades[i - 1]}</span>
                        </div>
                        <div class="flex items-center gap-3">
                            ${resumen}
                            <i class="fas ${p.abiertoManual ? 'fa-chevron-up' : 'fa-chevron-down'} text-xs text-gray-400"></i>
                        </div>
                    </div>

                    <div class="${p.abiertoManual ? '' : 'hidden'} p-4 bg-white space-y-4">
                        <div class="grid grid-cols-2 gap-3">
                            <div class="space-y-2">
                                <label class="block text-[10px] font-bold text-gray-400 uppercase">Alineación Local</label>
                                <select data-p="${i}" data-campo="local1" class="select-jugador w-full bg-gray-50 border rounded-lg p-2 text-xs font-medium text-gray-700 focus:outline-none focus:border-asatemeBlue">
                                    <option value="">-- Seleccionar Jugador --</option>
                                    ${this.jugadoresLocales.map(j => `<option value="${j.id}" ${p.local1 == j.id ? 'selected' : ''}>${j.nombre || j.name}</option>`).join('')}
                                </select>
                                ${esDobles ? `
                                <select data-p="${i}" data-campo="local2" class="select-jugador w-full bg-gray-50 border rounded-lg p-2 text-xs font-medium text-gray-700 focus:outline-none focus:border-asatemeBlue">
                                    <option value="">-- Pareja Jugador 2 --</option>
                                    ${this.jugadoresLocales.map(j => `<option value="${j.id}" ${p.local2 == j.id ? 'selected' : ''}>${j.nombre || j.name}</option>`).join('')}
                                </select>` : ''}
                            </div>
                            <div class="space-y-2">
                                <label class="block text-[10px] font-bold text-gray-400 uppercase text-right">Alineación Visitante</label>
                                <select data-p="${i}" data-campo="vis1" class="select-jugador w-full bg-gray-50 border rounded-lg p-2 text-xs font-medium text-gray-700 focus:outline-none focus:border-asatemeBlue">
                                    <option value="">-- Seleccionar Jugador --</option>
                                    ${this.jugadoresVisitantes.map(j => `<option value="${j.id}" ${p.vis1 == j.id ? 'selected' : ''}>${j.nombre || j.name}</option>`).join('')}
                                </select>
                                ${esDobles ? `
                                <select data-p="${i}" data-campo="vis2" class="select-jugador w-full bg-gray-50 border rounded-lg p-2 text-xs font-medium text-gray-700 focus:outline-none focus:border-asatemeBlue">
                                    <option value="">-- Pareja Jugador 2 --</option>
                                    ${this.jugadoresVisitantes.map(j => `<option value="${j.id}" ${p.vis2 == j.id ? 'selected' : ''}>${j.nombre || j.name}</option>`).join('')}
                                </select>` : ''}
                            </div>
                        </div>

                        <div class="bg-gray-50/70 p-3 rounded-xl border border-gray-100">
                            <span class="block text-[10px] font-bold text-gray-400 uppercase mb-2 text-center tracking-wider">Puntajes por Set</span>
                            <div class="grid grid-cols-5 gap-1.5 text-center">
                                ${[0, 1, 2, 3, 4].map(sIdx => `
                                    <div class="bg-white p-1.5 rounded-lg border border-gray-200 space-y-1.5">
                                        <span class="block text-[9px] font-bold text-gray-400 uppercase">S${sIdx + 1}</span>
                                        <input type="number" min="0" max="99" value="${p.setsL[sIdx]}" tabindex="${tabIndex++}" data-p="${i}" data-s="${sIdx}" data-lado="L" class="input-set w-full text-center font-bold text-sm text-gray-800 bg-gray-50 rounded-md py-1 focus:outline-none focus:border-asatemeBlue focus:bg-white">
                                        <input type="number" min="0" max="99" value="${p.setsV[sIdx]}" tabindex="${tabIndex++}" data-p="${i}" data-s="${sIdx}" data-lado="V" class="input-set w-full text-center font-bold text-sm text-gray-800 bg-gray-50 rounded-md py-1 focus:outline-none focus:border-asatemeBlue focus:bg-white">
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <div class="pt-1 flex justify-end">
                            <button type="button" data-confirmar="${i}" class="w-full sm:w-auto bg-asatemeBlue text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer">
                                <i class="fas fa-check"></i> Confirmar Partido ${i}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        this.container.innerHTML = html;
        this.conectarEventos();
    }

    conectarEventos() {
        this.container.querySelectorAll('[data-toggle]').forEach(el => {
            el.addEventListener('click', () => {
                const num = Number(el.getAttribute('data-toggle'));
                this.planillaState[`partido${num}`].abiertoManual = !this.planillaState[`partido${num}`].abiertoManual;
                this.render();
            });
        });

        this.container.querySelectorAll('.select-jugador').forEach(sel => {
            sel.addEventListener('change', (e) => {
                const pNum = sel.getAttribute('data-p');
                const campo = sel.getAttribute('data-campo');
                this.planillaState[`partido${pNum}`][campo] = e.target.value;
            });
        });

        this.container.querySelectorAll('.input-set').forEach(inp => {
            inp.addEventListener('focus', () => inp.select());
            inp.addEventListener('change', (e) => {
                const pNum = inp.getAttribute('data-p');
                const sIdx = Number(inp.getAttribute('data-s'));
                const lado = inp.getAttribute('data-lado');
                const val = parseInt(e.target.value, 10) || 0;

                if (lado === 'L') this.planillaState[`partido${pNum}`].setsL[sIdx] = val;
                if (lado === 'V') this.planillaState[`partido${pNum}`].setsV[sIdx] = val;
            });
        });

        this.container.querySelectorAll('[data-confirmar]').forEach(btn => {
            btn.addEventListener('click', () => {
                const num = Number(btn.getAttribute('data-confirmar'));
                this.validarYConfirmarPartido(num);
            });
        });
    }

    // js/componentes/carga/AcordeonITTF.js

    validarYConfirmarPartido(partidoNum) {
        const p = this.planillaState[`partido${partidoNum}`];

        // 1. Validar que no haya campos vacíos
        if (!p.local1 || !p.vis1 || (p.modalidad === 'DOBLES' && (!p.local2 || !p.vis2))) {
            alert(`⚠️ Por favor, seleccioná los jugadores para el Partido ${partidoNum} antes de confirmar.`);
            return;
        }

        // 2. NUEVA VALIDACIÓN: En Dobles, los jugadores de un mismo equipo deben ser distintos
        if (p.modalidad === 'DOBLES') {
            if (p.local1 === p.local2) {
                alert(`⚠️ En el partido de Dobles, no podés seleccionar al mismo jugador dos veces para el equipo Local.`);
                return;
            }
            if (p.vis1 === p.vis2) {
                alert(`⚠️ En el partido de Dobles, no podés seleccionar al mismo jugador dos veces para el equipo Visitante.`);
                return;
            }
        }

        // 3. Validación de Puntuación según reglamento ITTF (Set por Set)
        let acumL = 0, acumV = 0;
        for (let i = 0; i < 5; i++) {
            const sL = p.setsL[i], sV = p.setsV[i];
            if (sL === 0 && sV === 0) continue;

            if (sL < 11 && sV < 11) {
                alert(`⚠️ Error en el Set ${i + 1}: Ningún jugador llegó al mínimo de 11 puntos.`);
                return;
            }

            const dif = Math.abs(sL - sV);
            if ((sL === 11 || sV === 11) && dif >= 2) {
                if (sL > sV) acumL++; else acumV++;
                continue;
            }

            if (sL >= 10 && sV >= 10) {
                if (dif === 2) {
                    if (sL > sV) acumL++; else acumV++;
                } else {
                    alert(`⚠️ Error en el Set ${i + 1}: En ventajas se requiere diferencia exacta de 2 puntos.`);
                    return;
                }
                continue;
            }

            alert(`⚠️ Error en el Set ${i + 1}: Marcador no cumple el reglamento ITTF.`);
            return;
        }

        if (acumL !== 3 && acumV !== 3) {
            alert(`⚠️ Puntuación incompleta. Alguien debe ganar 3 sets (${acumL} - ${acumV}).`);
            return;
        }

        // Confirmación exitosa del partido
        p.scoreL = acumL;
        p.scoreV = acumV;
        p.terminado = true;
        p.abiertoManual = false;

        // Desplegar automáticamente el siguiente partido si está pendiente
        const sig = partidoNum + 1;
        if (sig <= 5 && !this.planillaState[`partido${sig}`].terminado) {
            this.planillaState[`partido${sig}`].abiertoManual = true;
        }

        this.calcularTotales();
        this.render();
    }
    
    calcularTotales() {
        let ganaL = 0, ganaV = 0;
        for (let i = 1; i <= 5; i++) {
            const part = this.planillaState[`partido${i}`];
            if (part.terminado) {
                if (part.scoreL > part.scoreV) ganaL++; else ganaV++;
            }
        }
        this.onCambioTotales(ganaL, ganaV);
    }
}