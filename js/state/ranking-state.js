// =========================================================================
// ESTADO GLOBAL DEL RANKING INDIVIDUAL
// =========================================================================
export const RANKING_STATE = {
    jugadoresGlobales: [],
    categoriaActual: "PRIMERA",
    mostrarSoloTop10: true,
    mesActivo: "Cargando...",

    obtenerDatosProcesados() {
        const filtroNormalizado = this.categoriaActual.trim().toUpperCase();

        // Filtro flexible tolerante a mayúsculas/minúsculas de la base de datos
        let filtrados = this.jugadoresGlobales.filter(j => {
            if (!j.categoria) return false;
            const catJugador = j.categoria.trim().toUpperCase();
            return catJugador === filtroNormalizado || catJugador.includes(filtroNormalizado);
        });

        // Ordenamos por posición numérica
        filtrados.sort((a, b) => a.posicion - b.posicion);
        const totalEnCategoria = filtrados.length;

        if (this.mostrarSoloTop10) {
            filtrados = filtrados.slice(0, 10);
        }

        return {
            jugadores: filtrados,
            totalEnCategoria
        };
    }
};

// =========================================================================
// CAPA DE SERVICIOS (Supabase Fetches)
// =========================================================================
export async function obtenerPeriodoMasReciente() {
    try {
        if (!window.supabase) throw new Error("window.supabase no está listo");

        const { data, error } = await window.supabase
            .from('ranking')
            .select('periodo')
            .order('created_at', { ascending: false })
            .limit(1);

        if (error) throw error;
        return data && data.length > 0 ? data[0].periodo : "Junio 2026";
    } catch (error) {
        console.error("⚠️ Error al determinar el periodo más reciente:", error);
        return "Junio 2026";
    }
}

export async function cargarRankingDesdeSupabase() {
    const ultimoPeriodo = await obtenerPeriodoMasReciente();
    RANKING_STATE.mesActivo = `Actualizado ${ultimoPeriodo}`;

    if (!window.supabase) return [];

    const { data, error } = await window.supabase
        .from('ranking')
        .select('categoria, posicion, jugador, club, puntos')
        .eq('periodo', ultimoPeriodo);

    if (error) throw error;

    RANKING_STATE.jugadoresGlobales = data.map(r => ({
        categoria: r.categoria ? r.categoria.trim().toUpperCase() : '',
        posicion: parseInt(r.posicion) || 0,
        jugador: r.jugador || '',
        club: r.club || '',
        puntos: parseInt(r.puntos) || 0
    }));

    return RANKING_STATE.jugadoresGlobales;
}