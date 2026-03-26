
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuración manual para asegurar acceso
const supabaseUrl = 'https://nksmphozttipzpdrxhft.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rc21waG96dHRpcHpwZHJ4aGZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MTY0NTIsImV4cCI6MjA4NjE5MjQ1Mn0.NikzUUWBpgah3vDmAcjyzjQRNdMpziy0sLDoYgWMfqY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function restoreLatestBackup() {
    console.log('🚀 Iniciando RUTINA DE EMERGENCIA: Restauración...');

    const backupRootDir = path.resolve(__dirname, '../_BACKUPS');
    if (!fs.existsSync(backupRootDir)) {
        console.error('❌ No se encontró la carpeta de backups.');
        return;
    }

    // Encontrar la carpeta de DATA más reciente
    const files = fs.readdirSync(backupRootDir);
    const dataFolders = files.filter(f => f.startsWith('DATA_')).sort().reverse();

    if (dataFolders.length === 0) {
        console.error('❌ No hay backups de datos disponibles para restaurar.');
        return;
    }

    const latestBackup = dataFolders[0];
    const backupPath = path.join(backupRootDir, latestBackup);

    console.log(`📂 Restaurando desde: ${latestBackup}`);

    // Tablas en orden estricto de dependencias
    const tables = [
        'brands',          // 1. Marcas (sin dependencias)
        'categories',      // 2. Categorías (dependencia recursiva, cuidado)
        'products',        // 3. Productos (depende de brands y categories)
        'product_variants',// 4. Variantes (depende de products)
        'product_images'   // 5. Imágenes (depende de products)
    ];

    for (const table of tables) {
        const filePath = path.join(backupPath, `${table}.json`);
        if (!fs.existsSync(filePath)) {
            console.warn(`⚠️ Archivo no encontrado: ${table}.json (Saltando)`);
            continue;
        }

        try {
            console.log(`🔹 Restaurando tabla: ${table}...`);
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const records = JSON.parse(fileContent);

            if (records.length === 0) {
                console.log(`   (0 registros, nada que hacer)`);
                continue;
            }

            // Upsert en lotes para no saturar
            const batchSize = 100;
            for (let i = 0; i < records.length; i += batchSize) {
                const batch = records.slice(i, i + batchSize);

                // Limpieza de datos si es necesario (ej: excluir columnas generadas)
                // Para simplificar, asumimos que el backup es limpio

                const { error } = await supabase
                    .from(table)
                    .upsert(batch, { onConflict: 'id' }); // Usar ID para upsert (actualiza si existe, inserta si no)

                if (error) {
                    console.error(`❌ Error en lote ${i}-${i + batchSize} de ${table}:`, error.message);
                } else {
                    process.stdout.write('.');
                }
            }
            console.log(` ✅ Hecho.`);

        } catch (err) {
            console.error(`❌ Error procesando ${table}:`, err.message);
        }
    }

    console.log('\n🎉 ¡RESTAURACIÓN COMPLETADA!');
    console.log('🔄 Por favor recarga la página de admin para ver los cambios.');
}

restoreLatestBackup();
