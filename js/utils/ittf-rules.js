// js/utils/ittf-rules.js

export function validarSetITTF(sL, sV, setNumero) {
    // Set no jugado (0-0)
    if (sL === 0 && sV === 0) return { valido: true, ignorar: true };

    // 1. Mínimo de 11 puntos
    if (sL < 11 && sV < 11) {
        return { valido: false, error: `Set ${setNumero}: Ningún jugador llegó al mínimo de 11 puntos (${sL}-${sV}).` };
    }

    const diferencia = Math.abs(sL - sV);

    // 2. Victoria estándar (11 puntos con diferencia >= 2)
    if ((sL === 11 || sV === 11) && diferencia >= 2) {
        return { valido: true, ganador: sL > sV ? 'L' : 'V' };
    }

    // 3. Ventajas (>= 10 puntos)
    if (sL >= 10 && sV >= 10) {
        if (diferencia === 2) {
            return { valido: true, ganador: sL > sV ? 'L' : 'V' };
        } else if (diferencia < 2) {
            return { valido: false, error: `Set ${setNumero}: En ventajas (${sL}-${sV}) se requiere diferencia de 2 puntos.` };
        } else {
            return { valido: false, error: `Set ${setNumero}: Diferencia imposible en ventajas (${sL}-${sV}).` };
        }
    }

    return { valido: false, error: `Set ${setNumero}: El marcador ${sL}-${sV} no cumple el reglamento ITTF.` };
}

export function validarPartidoCompleto(partidoData) {
    const { local1, vis1, modalidad, local2, vis2, setsL, setsV } = partidoData;

    // Validar alineación
    if (!local1 || !vis1) {
        return { valido: false, error: "Falta seleccionar los jugadores individuales." };
    }
    if (modalidad === 'DOBLES' && (!local2 || !vis2)) {
        return { valido: false, error: "Falta seleccionar las parejas para el partido de Dobles." };
    }

    let acumL = 0;
    let acumV = 0;

    for (let i = 0; i < 5; i++) {
        const resSet = validarSetITTF(setsL[i], setsV[i], i + 1);
        if (!resSet.valido) return resSet;
        if (resSet.ignorar) continue;

        if (resSet.ganador === 'L') acumL++;
        if (resSet.ganador === 'V') acumV++;
    }

    if (acumL !== 3 && acumV !== 3) {
        return { valido: false, error: `Puntuación incompleta. Un jugador/pareja debe ganar 3 sets (Actual: ${acumL}-${acumV}).` };
    }

    return { valido: true, scoreL: acumL, scoreV: acumV };
}