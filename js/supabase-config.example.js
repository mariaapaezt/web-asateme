// ==========================================
// CONFIGURACIÓN CENTRALIZADA DE SUPABASE
// ==========================================

// Leemos las credenciales inyectadas por Netlify o usamos el respaldo local
const SUPABASE_URL = window.ENV?.SUPABASE_URL || "https://gniieyrbxpodzzuaxbvr.supabase.co"; //"https://eujjxvmkigezbnsitzne.supabase.co"
const SUPABASE_KEY = window.ENV?.SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduaWlleXJieHBvZHp6dWF4YnZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwOTE2MjUsImV4cCI6MjA5NjY2NzYyNX0.L1mmw4aGZPkmES63pyMc6gWKPnvKEUbq63nJXvMlzxE"; //"sb_publishable_E_NlcXuG8rNC-t09tmY7_g_Js0mPvcY" 

// 2. Crear la instancia global (usamos var o window para asegurar que liga-logic la vea)
//var supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Instanciamos el cliente directamente en el objeto global de la ventana
window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);