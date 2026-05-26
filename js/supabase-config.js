/*
========================================================================
   BG CARIBE - SUPABASE CONFIGURATION
   Shared by admin.html and consulta.html
   
   INSTRUCCIONES:
   1. Ir a https://supabase.com y crear una cuenta gratuita
   2. Crear un proyecto nuevo (ej. "bg-caribe-reservas")
   3. Ir a Settings > API y copiar:
      - Project URL → SUPABASE_URL
      - anon/public key → SUPABASE_ANON_KEY
   4. Ir a SQL Editor y ejecutar el siguiente SQL para crear la tabla:

   CREATE TABLE reservas (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     codigo TEXT UNIQUE NOT NULL,
     estado TEXT DEFAULT 'pendiente',
     cliente_nombre TEXT,
     cliente_email TEXT,
     cliente_telefono TEXT,
     cliente_ciudad TEXT,
     destino TEXT,
     hotel TEXT,
     tipo_habitacion TEXT,
     fecha_entrada DATE,
     fecha_salida DATE,
     adultos INTEGER DEFAULT 1,
     ninos INTEGER DEFAULT 0,
     vuelo_incluido BOOLEAN DEFAULT FALSE,
     traslados_incluidos BOOLEAN DEFAULT FALSE,
     monto_total NUMERIC(12,2) DEFAULT 0,
     anticipo NUMERIC(12,2) DEFAULT 0,
     saldo_pendiente NUMERIC(12,2) DEFAULT 0,
     metodo_pago TEXT,
     notas TEXT,
     creado_en TIMESTAMPTZ DEFAULT NOW(),
     actualizado_en TIMESTAMPTZ DEFAULT NOW()
   );

   -- Habilitar Row Level Security (RLS) 
   ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;

   -- Politica para lectura publica (consulta por codigo)
   CREATE POLICY "Lectura publica por codigo"
     ON reservas FOR SELECT
     USING (true);

   -- Politica para escritura desde admin
   CREATE POLICY "Escritura desde admin"
     ON reservas FOR ALL
     USING (true)
     WITH CHECK (true);

========================================================================
*/

// Supabase configuration - REEMPLAZAR con tus credenciales reales
const SUPABASE_URL = 'https://TU_PROYECTO.supabase.co';
const SUPABASE_ANON_KEY = 'TU_ANON_KEY';

// Initialize Supabase client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Shorthand reference
const db = supabaseClient;
