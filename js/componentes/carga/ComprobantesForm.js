// js/componentes/carga/ComprobantesForm.js

export class ComprobantesForm {
    constructor() {
        this.init();
    }

    init() {
        this.configurarInputFeedback('input-planilla', 'feedback-planilla', 'la Planilla');
        this.configurarInputFeedback('input-pago-local', 'feedback-pago-local', 'el Pago Local');
        this.configurarInputFeedback('input-pago-visitante', 'feedback-pago-visitante', 'el Pago Visitante');
        this.configurarVerPin();
    }

    configurarInputFeedback(inputId, feedbackId, tipoDoc) {
        const input = document.getElementById(inputId);
        const feedback = document.getElementById(feedbackId);

        if (input && feedback) {
            input.addEventListener('change', (e) => {
                if (e.target.files && e.target.files.length > 0) {
                    const archivo = e.target.files[0];
                    const peso = (archivo.size / (1024 * 1024)).toFixed(2);

                    if (parseFloat(peso) > 15.0) {
                        alert(`⚠️ El archivo de ${tipoDoc} supera el límite de 15MB.`);
                        input.value = "";
                        feedback.classList.add('hidden');
                        return;
                    }

                    const esPDF = archivo.type === 'application/pdf';
                    const icono = esPDF ? 'fa-file-pdf text-red-500' : 'fa-image text-green-600';

                    feedback.className = "p-2.5 bg-green-50 border border-green-200 text-green-800 rounded-xl flex items-center gap-2 text-xs font-semibold mt-1.5";
                    feedback.innerHTML = `<i class="fas ${icono}"></i> <span class="truncate">${archivo.name} (${peso} MB)</span>`;
                } else {
                    feedback.classList.add('hidden');
                }
            });
        }
    }

    configurarVerPin() {
        const inputPin = document.getElementById('token-club-input');
        const btnOjo = document.getElementById('btn-toggle-pin');
        const iconoOjo = document.getElementById('icono-ojo-token');

        if (btnOjo && inputPin && iconoOjo) {
            btnOjo.addEventListener('click', () => {
                const esPassword = inputPin.type === 'password';
                inputPin.type = esPassword ? 'text' : 'password';
                iconoOjo.className = esPassword ? "fas fa-eye-slash text-xs" : "fas fa-eye text-xs";
            });
        }
    }

    /**
     * MÉTODO PÚBLICO: Utilizado por CargaVista para recolectar y validar
     * los adjuntos y el PIN con los IDs correctos del DOM.
     */
    obtenerArchivosYToken() {
        const fileActa = document.getElementById('input-planilla')?.files[0];
        const filePagoLocal = document.getElementById('input-pago-local')?.files[0];
        const filePagoVis = document.getElementById('input-pago-visitante')?.files[0];
        const tokenInput = document.getElementById('token-club-input')?.value?.trim();

        if (!fileActa) {
            return { valido: false, mensajeError: "⚠️ Falta adjuntar la foto o PDF de la Planilla/Acta oficial." };
        }
        if (!filePagoLocal) {
            return { valido: false, mensajeError: "⚠️ Falta adjuntar el comprobante de pago del Club Local." };
        }
        if (!filePagoVis) {
            return { valido: false, mensajeError: "⚠️ Falta adjuntar el comprobante de pago del Club Visitante." };
        }
        if (!tokenInput) {
            return { valido: false, mensajeError: "⚠️ Debe ingresar el PIN/Token de validación del club." };
        }

        const MAX_BYTES = 15 * 1024 * 1024;
        if (fileActa.size > MAX_BYTES || filePagoLocal.size > MAX_BYTES || filePagoVis.size > MAX_BYTES) {
            return { valido: false, mensajeError: "⚠️ Uno o más archivos superan el límite máximo permitido de 15 MB." };
        }

        return {
            valido: true,
            archivos: {
                acta: fileActa,
                pagoLocal: filePagoLocal,
                pagoVisitante: filePagoVis
            },
            pin: tokenInput
        };
    }

    /**
     * MÉTODO PÚBLICO: Utilizado por CargaVista para resetear los inputs
     * y ocultar las cajas de feedback visuales al cambiar de partido.
     */
    limpiar() {
        const inputs = ['input-planilla', 'input-pago-local', 'input-pago-visitante'];
        const feedbacks = ['feedback-planilla', 'feedback-pago-local', 'feedback-pago-visitante'];

        inputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) input.value = '';
        });

        feedbacks.forEach(id => {
            const feedback = document.getElementById(id);
            if (feedback) {
                feedback.classList.add('hidden');
                feedback.innerHTML = '';
            }
        });

        const tokenInput = document.getElementById('token-club-input');
        if (tokenInput) tokenInput.value = '';
    }

    
}