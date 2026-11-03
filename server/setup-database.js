const { pool } = require('./database');

async function setupDatabase() {
    try {
        // Muzeylar jadvali
        await pool.query(`
            CREATE TABLE IF NOT EXISTS museums (
                                                   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(150) NOT NULL,
                description TEXT,
                slug VARCHAR(180) UNIQUE NOT NULL,
                cover_image_url TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
                );
        `);

        // San’at asarlari jadvali
        await pool.query(`
            CREATE TABLE IF NOT EXISTS artworks (
                                                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                museum_id UUID NOT NULL
                REFERENCES museums(id) ON DELETE CASCADE,
                title VARCHAR(200),
                image_url TEXT NOT NULL,
                sort_order INTEGER DEFAULT 0,
                created_at TIMESTAMPTZ DEFAULT NOW()
                );
        `);

        // Rasmlarni bazada saqlash uchun yangi ustunlar
        await pool.query(`
            ALTER TABLE artworks
            ADD COLUMN IF NOT EXISTS image_data BYTEA;
        `);

        await pool.query(`
            ALTER TABLE artworks
            ADD COLUMN IF NOT EXISTS mime_type VARCHAR(50);
        `);

        await pool.query(`
            ALTER TABLE artworks
            ADD COLUMN IF NOT EXISTS image_size INTEGER;
        `);

        // Yangi rasmlar image_data orqali saqlanishi uchun
        await pool.query(`
            ALTER TABLE artworks
            ALTER COLUMN image_url DROP NOT NULL;
        `);

        console.log('Muzeylar jadvali tayyor!');
        console.log('San’at asarlari jadvali tayyor!');
        console.log('Rasm saqlash ustunlari qo‘shildi!');
    } catch (error) {
        console.error('Jadval yaratishda xato:', error.message);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

setupDatabase();
