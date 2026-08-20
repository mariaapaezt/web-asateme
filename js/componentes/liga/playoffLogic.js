// js/componentes/liga/playoffLogic.js
import { ligaState } from '../../state/liga-state.js';

/**
 * Genera la estructura inicial de Playoffs en Supabase para una liga
 * respetando el formato: 1º y 2º a Semis directo, 3º vs 6º (QF1) y 4º vs 5º (QF2).
 */
export async function inicializarPlayoffsEnSupabase(ligaId = 'LIGA_A', supabaseClient = window.supabase) {
    if (!supabaseClient) return false;

    // 1. Obtener la tabla de posiciones ordenada
    const tablaPosiciones = ligaState.ligasData[ligaId] || [];
    if (tablaPosiciones.length < 6) {
        console.warn(`⚠️ No hay suficientes equipos (${tablaPosiciones.length}/6) en ${ligaId} para armar playoffs.`);
        return false;
    }

    // Clasificados del 1° al 6°
    const eq1 = String(tablaPosiciones[0].id); // 1° -> Semis (SF1)
    const eq2 = String(tablaPosiciones[1].id); // 2° -> Semis (SF2)
    const eq3 = String(tablaPosiciones[2].id); // 3° -> Cuartos (QF1)
    const eq4 = String(tablaPosiciones[3].id); // 4° -> Cuartos (QF2)
    const eq5 = String(tablaPosiciones[4].id); // 5° -> Cuartos (QF2)
    const eq6 = String(tablaPosiciones[5].id); // 6° -> Cuartos (QF1)

    // Estructura de llaves según el formato establecido
    const llavesAInsertar = [
        {
            liga: ligaId,
            fase: 'CUARTOS',
            codigo_llave: 'QF1',
            equipo_1_id: eq3, // 3er puesto
            equipo_2_id: eq6, // 6to puesto
            puntos_equipo_1: 0,
            puntos_equipo_2: 0,
            ganador_id: null,
            estado: 'PENDIENTE',
            origen_equipo_1: '3° Fase Regular',
            origen_equipo_2: '6° Fase Regular'
        },
        {
            liga: ligaId,
            fase: 'CUARTOS',
            codigo_llave: 'QF2',
            equipo_1_id: eq4, // 4to puesto
            equipo_2_id: eq5, // 5to puesto
            puntos_equipo_1: 0,
            puntos_equipo_2: 0,
            ganador_id: null,
            estado: 'PENDIENTE',
            origen_equipo_1: '4° Fase Regular',
            origen_equipo_2: '5° Fase Regular'
        },
        {
            liga: ligaId,
            fase: 'SEMIFINAL',
            codigo_llave: 'SF1',
            equipo_1_id: eq1,  // 1er puesto directo
            equipo_2_id: null, // Espera al Ganador QF2
            puntos_equipo_1: 0,
            puntos_equipo_2: 0,
            ganador_id: null,
            estado: 'PENDIENTE',
            origen_equipo_1: '1° Fase Regular',
            origen_equipo_2: 'Ganador QF2'
        },
        {
            liga: ligaId,
            fase: 'SEMIFINAL',
            codigo_llave: 'SF2',
            equipo_1_id: eq2,  // 2do puesto directo
            equipo_2_id: null, // Espera al Ganador QF1
            puntos_equipo_1: 0,
            puntos_equipo_2: 0,
            ganador_id: null,
            estado: 'PENDIENTE',
            origen_equipo_1: '2° Fase Regular',
            origen_equipo_2: 'Ganador QF1'
        },
        {
            liga: ligaId,
            fase: 'FINAL',
            codigo_llave: 'FINAL',
            equipo_1_id: null, // Espera al Ganador SF1
            equipo_2_id: null, // Espera al Ganador SF2
            puntos_equipo_1: 0,
            puntos_equipo_2: 0,
            ganador_id: null,
            estado: 'PENDIENTE',
            origen_equipo_1: 'Ganador SF1',
            origen_equipo_2: 'Ganador SF2'
        }
    ];

    // Limpiar playoffs anteriores de la misma liga e insertar la nueva llave
    await supabaseClient.from('liga_playoffs').delete().eq('liga', ligaId);
    
    const { error } = await supabaseClient.from('liga_playoffs').insert(llavesAInsertar);

    if (error) {
        console.error("❌ Error al insertar playoffs en Supabase:", error);
        return false;
    }

    console.log(`✅ Playoffs generados correctamente para ${ligaId}`);
    return true;
}

/**
 * Función principal a invocar al seleccionar la pestaña de Playoffs.
 * Valida estado de la Fase Regular antes de generar.
 */
export async function verificarEInicializarPlayoffs(ligaId = 'LIGA_A', supabaseClient = window.supabase) {
    const playoffsExistentes = ligaState.obtenerPlayoffsLiga(ligaId);

    // 1. Si ya existen playoffs cargados, no se regeneran
    if (playoffsExistentes && playoffsExistentes.length > 0) {
        return { ok: true, mensaje: 'Playoffs ya inicializados.' };
    }

    // 2. Verificar que TODOS los partidos de la Fase Regular estén finalizados
    const partidosLiga = (ligaState._fixture || []).filter(p => {
        const ligaPartido = String(p.liga || p.liga_id || '').trim();
        return ligaPartido === ligaId;
    });

    if (partidosLiga.length === 0) {
        return { ok: false, mensaje: 'No hay partidos registrados en la Fase Regular.' };
    }

    const partidosPendientes = partidosLiga.filter(p => 
        !p.estado || p.estado.toLowerCase() !== 'finalizado'
    );

    if (partidosPendientes.length > 0) {
        console.warn(`⏳ Fase regular incompleta. Quedan ${partidosPendientes.length} partido(s) pendientes.`);
        return { 
            ok: false, 
            mensaje: `La Fase Regular aún no finalizó. Quedan ${partidosPendientes.length} partido(s) pendientes por jugar.` 
        };
    }

    // 3. Si todos están finalizados, generar la llave
    const generado = await inicializarPlayoffsEnSupabase(ligaId, supabaseClient);
    if (generado) {
        await ligaState.init(supabaseClient); // Recargar datos locales
        return { ok: true, mensaje: 'Playoffs generados con éxito.' };
    }

    return { ok: false, mensaje: 'Error al generar la llave de Playoffs en Supabase.' };
}

/**
 * Actualiza los clasificados en las llaves siguientes en Supabase.
 */
export async function propagarGanadoresPlayoffs(ligaId = 'LIGA_A', supabaseClient = window.supabase) {
    if (!supabaseClient) return;

    // 1. Obtener el estado actual de los playoffs
    const { data: playoffs, error } = await supabaseClient
        .from('liga_playoffs')
        .select('*')
        .eq('liga', ligaId);

    if (error || !playoffs) return;

    const qf1 = playoffs.find(p => p.codigo_llave === 'QF1');
    const qf2 = playoffs.find(p => p.codigo_llave === 'QF2');
    const sf1 = playoffs.find(p => p.codigo_llave === 'SF1');
    const sf2 = playoffs.find(p => p.codigo_llave === 'SF2');

    // SF1 recibe al Ganador de QF2 en equipo_2_id
    if (qf2?.ganador_id && sf1 && String(sf1.equipo_2_id) !== String(qf2.ganador_id)) {
        await supabaseClient
            .from('liga_playoffs')
            .update({ equipo_2_id: qf2.ganador_id })
            .eq('codigo_llave', 'SF1')
            .eq('liga', ligaId);
    }

    // SF2 recibe al Ganador de QF1 en equipo_2_id
    if (qf1?.ganador_id && sf2 && String(sf2.equipo_2_id) !== String(qf1.ganador_id)) {
        await supabaseClient
            .from('liga_playoffs')
            .update({ equipo_2_id: qf1.ganador_id })
            .eq('codigo_llave', 'SF2')
            .eq('liga', ligaId);
    }

    // FINAL recibe a los Ganadores de SF1 y SF2
    const finalMatch = playoffs.find(p => p.codigo_llave === 'FINAL');
    if (sf1?.ganador_id && finalMatch && String(finalMatch.equipo_1_id) !== String(sf1.ganador_id)) {
        await supabaseClient
            .from('liga_playoffs')
            .update({ equipo_1_id: sf1.ganador_id })
            .eq('codigo_llave', 'FINAL')
            .eq('liga', ligaId);
    }

    if (sf2?.ganador_id && finalMatch && String(finalMatch.equipo_2_id) !== String(sf2.ganador_id)) {
        await supabaseClient
            .from('liga_playoffs')
            .update({ equipo_2_id: sf2.ganador_id })
            .eq('codigo_llave', 'FINAL')
            .eq('liga', ligaId);
    }
}

export function actualizarAvancePlayoffs(ligaId = 'LIGA_A') {
    ligaState.actualizarAvancePlayoffs(ligaId);
}