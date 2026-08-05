// js/utils/storage-helper.js

export async function subirComprobantesPartido({ partidoId, filePlanilla, filePagoLocal, filePagoVisitante, localNombre, visitanteNombre }) {
    const formatear = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]/g, "_");

    const subir = async (archivo, prefijo, detalle) => {
        if (!archivo) throw new Error(`El archivo de ${prefijo} es nulo.`);

        const ext = archivo.name.split('.').pop();
        const nombreArchivo = `${prefijo}_${formatear(detalle)}_${partidoId}_${Date.now()}.${ext}`;

        const { error } = await window.supabase.storage
            .from('planillas')
            .upload(nombreArchivo, archivo, { cacheControl: '3600', upsert: false });

        if (error) throw new Error(`Error subiendo ${prefijo} (${detalle}): ${error.message}`);

        const { data } = window.supabase.storage.from('planillas').getPublicUrl(nombreArchivo);
        return data.publicUrl;
    };

    const [urlPlanilla, urlPagoLoc, urlPagoVis] = await Promise.all([
        subir(filePlanilla, 'acta_planilla', `${localNombre}_vs_${visitanteNombre}`),
        subir(filePagoLocal, 'comprobante_pago', localNombre),
        subir(filePagoVisitante, 'comprobante_pago', visitanteNombre)
    ]);

    return { urlPlanilla, urlPagoLoc, urlPagoVis };
}