// js/componentes/carga/FilaResultado.js

export class FilaResultadoComponent {
    /**
     * @param {Object} props
     * @param {number} props.numIndex
     * @param {Object} props.partidoData - Datos de este partido en la planilla
     * @param {Array} props.jugadoresLocales
     * @param {Array} props.jugadoresVisitantes
     * @param {Function} props.onConfirmar - Callback para notificar a la vista/estado
     */
    constructor(props) {
        this.props = props;
        this.container = document.createElement('div');
    }

    render() {
        const { numIndex, partidoData, jugadoresLocales, jugadoresVisitantes } = this.props;
        const nombresModalidades = ["Single 1", "Single 2", "Dobles (Parejas)", "Single 3", "Single 4"];
        const esDobles = partidoData.modalidad === 'DOBLES';

        const claseEstadoIcono = partidoData.terminado
            ? "fas fa-check-circle text-green-500 text-base"
            : "far fa-circle text-gray-300 text-base";

        const badgeEstado = partidoData.terminado
            ? `<span class="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-md font-bold">Confirmado (${partidoData.scoreL}-${partidoData.scoreV})</span>`
            : `<span class="text-[11px] text-gray-400 font-normal">En carga</span>`;

        let tabIndex = (numIndex - 1) * 10 + 1;

        this.container.className = "border border-gray-200 rounded-xl overflow-hidden shadow-2xs bg-white transition-all duration-200 mb-3";
        this.container.innerHTML = `
      <!-- Encabezado del Acordeón -->
      <div class="btn-toggle bg-gray-50 p-3.5 flex justify-between items-center cursor-pointer select-none border-b border-gray-100 hover:bg-gray-100/70 transition-colors">
        <div class="flex items-center gap-2.5">
          <i class="${claseEstadoIcono}"></i>
          <span class="font-bold text-xs text-gray-700 uppercase tracking-wider">
            Partido ${numIndex}: ${nombresModalidades[numIndex - 1]}
          </span>
        </div>
        <div class="flex items-center gap-3">
          ${badgeEstado}
          <i class="icono-flecha fas ${partidoData.abiertoManual ? 'fa-chevron-up' : 'fa-chevron-down'} text-xs text-gray-400"></i>
        </div>
      </div>

      <!-- Cuerpo del Acordeón -->
      <div class="cuerpo-acordeon ${partidoData.abiertoManual ? '' : 'hidden'} p-4 bg-white space-y-4">
        <!-- Alineaciones -->
        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-2">
            <label class="block text-[10px] font-bold text-gray-400 uppercase">Alineación Local</label>
            <select data-campo="local1" class="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-medium text-gray-700 focus:outline-none focus:border-asatemeBlue">
              <option value="">-- Seleccionar Jugador --</option>
              ${jugadoresLocales.map(j => `<option value="${j.id}" ${partidoData.local1 == j.id ? 'selected' : ''}>${j.nombre || j.name}</option>`).join('')}
            </select>
            ${esDobles ? `
              <select data-campo="local2" class="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-medium text-gray-700 focus:outline-none focus:border-asatemeBlue">
                <option value="">-- Pareja Jugador 2 --</option>
                ${jugadoresLocales.map(j => `<option value="${j.id}" ${partidoData.local2 == j.id ? 'selected' : ''}>${j.nombre || j.name}</option>`).join('')}
              </select>
            ` : ''}
          </div>

          <div class="space-y-2">
            <label class="block text-[10px] font-bold text-gray-400 uppercase text-right">Alineación Visitante</label>
            <select data-campo="vis1" class="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-medium text-gray-700 focus:outline-none focus:border-asatemeBlue">
              <option value="">-- Seleccionar Jugador --</option>
              ${jugadoresVisitantes.map(j => `<option value="${j.id}" ${partidoData.vis1 == j.id ? 'selected' : ''}>${j.nombre || j.name}</option>`).join('')}
            </select>
            ${esDobles ? `
              <select data-campo="vis2" class="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-medium text-gray-700 focus:outline-none focus:border-asatemeBlue">
                <option value="">-- Pareja Jugador 2 --</option>
                ${jugadoresVisitantes.map(j => `<option value="${j.id}" ${partidoData.vis2 == j.id ? 'selected' : ''}>${j.nombre || j.name}</option>`).join('')}
              </select>
            ` : ''}
          </div>
        </div>

        <!-- Matriz de Sets -->
        <div class="bg-gray-50/70 p-3 rounded-xl border border-gray-100">
          <span class="block text-[10px] font-bold text-gray-400 uppercase mb-2 text-center tracking-wider">
            Puntajes por Set (Mínimo 11 pts)
          </span>
          <div class="grid grid-cols-5 gap-1.5 text-center">
            ${[0, 1, 2, 3, 4].map(sIdx => `
              <div class="bg-white p-1.5 rounded-lg border border-gray-200 space-y-1.5">
                <span class="block text-[9px] font-bold text-gray-400 uppercase">S${sIdx + 1}</span>
                <input type="number" min="0" max="99" value="${partidoData.setsL[sIdx]}" tabindex="${tabIndex++}" data-set="${sIdx}" data-lado="L"
                       class="input-set w-full text-center font-bold text-sm text-gray-800 bg-gray-50 rounded-md py-1 focus:outline-none focus:border-asatemeBlue focus:bg-white border border-transparent">
                <input type="number" min="0" max="99" value="${partidoData.setsV[sIdx]}" tabindex="${tabIndex++}" data-set="${sIdx}" data-lado="V"
                       class="input-set w-full text-center font-bold text-sm text-gray-800 bg-gray-50 rounded-md py-1 focus:outline-none focus:border-asatemeBlue focus:bg-white border border-transparent">
              </div>
            `).join('')}
          </div>
        </div>

        <button type="button" class="btn-confirmar w-full sm:w-auto bg-asatemeBlue hover:bg-slate-800 text-white font-bold py-2 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer">
          <i class="fas fa-check"></i> Confirmar Partido ${numIndex}
        </button>
      </div>
    `;

        this._bindEvents();
        return this.container;
    }

    _bindEvents() {
        const toggleBtn = this.container.querySelector('.btn-toggle');
        const cuerpo = this.container.querySelector('.cuerpo-acordeon');

        // Manejo interno del estado UI (Acordeón)
        toggleBtn?.addEventListener('click', () => {
            cuerpo?.classList.toggle('hidden');
            this.props.partidoData.abiertoManual = !cuerpo?.classList.contains('hidden');
        });

        // Binding de inputs a estado interno de la prop
        this.container.querySelectorAll('select').forEach(sel => {
            sel.addEventListener('change', (e) => {
                const campo = e.target.dataset.campo;
                this.props.partidoData[campo] = e.target.value;
            });
        });

        this.container.querySelectorAll('.input-set').forEach(inp => {
            inp.addEventListener('change', (e) => {
                const setIdx = parseInt(e.target.dataset.set, 10);
                const lado = e.target.dataset.lado;
                const val = parseInt(e.target.value, 10) || 0;

                if (lado === 'L') this.props.partidoData.setsL[setIdx] = val;
                if (lado === 'V') this.props.partidoData.setsV[setIdx] = val;
            });
        });

        // Delegar confirmación mediante Callback hacia la vista
        this.container.querySelector('.btn-confirmar')?.addEventListener('click', () => {
            if (typeof this.props.onConfirmar === 'function') {
                this.props.onConfirmar(this.props.numIndex, this.props.partidoData);
            }
        });
    }
}