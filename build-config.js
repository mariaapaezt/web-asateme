const fs = require('fs');
const path = require('path');

// Leemos las variables de entorno inyectadas por Netlify
// Nota: Usamos SUPABASE_KEY que es el nombre que tenés configurado en tu panel
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_KEY || '';

// Generamos la estructura del archivo js/supabase-config.js
const content = `// Archivo autogenerado dinámicamente por Netlify en la compilación
window.supabaseUrl = "${supabaseUrl}";
window.supabaseAnonKey = "${supabaseAnonKey}";

if (window.supabase) {
    window.supabase = supabase.createClient(window.supabaseUrl, window.supabaseAnonKey);
}
`;

// Ruta de guardado: carpeta "js" dentro de tu proyecto
const dirPath = path.join(__dirname, 'js');
const filePath = path.join(dirPath, 'supabase-config.js');

// Verificamos que exista la carpeta "js"
if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath);
}

// Escribimos el archivo de configuración limpio
fs.writeFileSync(filePath, content, 'utf8');
console.log("✅ ¡js/supabase-config.js generado exitosamente con variables de entorno!");