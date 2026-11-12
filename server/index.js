
const express = require('express');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const sharp = require('sharp');
require('dotenv').config();
const { query, pool } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '1mb' }));

// ==========================================
// RASM YUKLASH SOZLAMALARI
// ==========================================

const upload = multer({
    storage: multer.memoryStorage(),

    limits: {
        fileSize: 1 * 1024 * 1024, // Har bir rasm 1 MB
        files: 20                  // Bir martada 20 tagacha rasm
    },

    fileFilter: (req, file, callback) => {
        const allowedTypes = [
            'image/jpeg',
            'image/png',
            'image/webp'
        ];

        if (!allowedTypes.includes(file.mimetype)) {
            return callback(
                new Error('Faqat JPG, PNG va WebP rasmlar qabul qilinadi.')
            );
        }

        callback(null, true);
    }
});

// ==========================================
// ADMIN XAVFSIZLIK SOZLAMALARI
// ==========================================

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const SESSION_TTL = 8 * 60 * 60 * 1000; // 8 soat
const COOKIE_NAME = 'vam_admin_session';

const adminSessions = new Map();
const loginAttempts = new Map();

const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_BLOCK_TIME = 15 * 60 * 1000; // 15 daqiqa

function safeCompare(a, b) {
    const first = Buffer.from(String(a));
    const second = Buffer.from(String(b));

    if (first.length !== second.length) {
        return false;
    }

    return crypto.timingSafeEqual(first, second);
}

function getCookie(req, name) {
    const cookieHeader = req.headers.cookie || '';

    const cookies = cookieHeader.split(';');

    for (const cookie of cookies) {
        const separator = cookie.indexOf('=');

        if (separator === -1) continue;

        const key = cookie.slice(0, separator).trim();
        const value = cookie.slice(separator + 1).trim();

        if (key === name) {
            return decodeURIComponent(value);
        }
    }

    return null;
}

function setAdminCookie(res, token) {
    const secure = process.env.NODE_ENV === 'production'
        ? '; Secure'
        : '';

    res.setHeader(
        'Set-Cookie',
        `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=28800${secure}`
    );
}

function clearAdminCookie(res) {
    const secure = process.env.NODE_ENV === 'production'
        ? '; Secure'
        : '';

    res.setHeader(
        'Set-Cookie',
        `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`
    );
}

function getAdminSession(req) {
    const token = getCookie(req, COOKIE_NAME);

    if (!token) return null;

    const session = adminSessions.get(token);

    if (!session) return null;

    if (Date.now() > session.expiresAt) {
        adminSessions.delete(token);
        return null;
    }

    return session;
}

function requireAdmin(req, res, next) {
    const session = getAdminSession(req);

    if (!session) {
        clearAdminCookie(res);

        return res.status(401).json({
            success: false,
            error: 'Admin sessiyasi tugagan. Qaytadan kiring.'
        });
    }

    req.adminSession = session;
    next();
}

// ==========================================
// ADMIN LOGIN
// ==========================================

app.post('/api/admin/login', (req, res) => {
    res.setHeader('Cache-Control', 'no-store');

    if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
        return res.status(500).json({
            success: false,
            error: 'Admin login sozlamalari serverda kiritilmagan.'
        });
    }

    const ip = req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    let attempts = loginAttempts.get(ip);

    if (!attempts || now - attempts.startedAt > LOGIN_BLOCK_TIME) {
        attempts = {
            count: 0,
            startedAt: now,
            blockedUntil: 0
        };
    }

    if (attempts.blockedUntil > now) {
        const seconds = Math.ceil(
            (attempts.blockedUntil - now) / 1000
        );

        loginAttempts.set(ip, attempts);

        return res.status(429).json({
            success: false,
            error: `Juda ko‘p urinish. ${seconds} soniyadan keyin qayta urinib ko‘ring.`
        });
    }

    const username = String(req.body?.username || '');
    const password = String(req.body?.password || '');

    const validUsername = safeCompare(username, ADMIN_USERNAME);
    const validPassword = safeCompare(password, ADMIN_PASSWORD);

    if (!validUsername || !validPassword) {
        attempts.count++;

        if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
            attempts.blockedUntil = now + LOGIN_BLOCK_TIME;
        }

        loginAttempts.set(ip, attempts);

        return res.status(401).json({
            success: false,
            error: 'Login yoki parol noto‘g‘ri.'
        });
    }

    loginAttempts.delete(ip);

    const token = crypto.randomBytes(32).toString('hex');

    const expiresAt = now + SESSION_TTL;

    adminSessions.set(token, {
        username: ADMIN_USERNAME,
        createdAt: now,
        expiresAt
    });

    setAdminCookie(res, token);

    return res.json({
        success: true,
        username: ADMIN_USERNAME,
        expiresAt
    });
});

// ==========================================
// ADMIN SESSION CHECK
// ==========================================

app.get('/api/admin/session', (req, res) => {
    res.setHeader('Cache-Control', 'no-store');

    const session = getAdminSession(req);

    if (!session) {
        return res.status(401).json({
            success: false,
            authenticated: false
        });
    }

    return res.json({
        success: true,
        authenticated: true,
        username: session.username,
        expiresAt: session.expiresAt
    });
});

// ==========================================
// ADMIN LOGOUT
// ==========================================

app.post('/api/admin/logout', (req, res) => {
    const token = getCookie(req, COOKIE_NAME);

    if (token) {
        adminSessions.delete(token);
    }

    clearAdminCookie(res);

    return res.json({
        success: true,
        message: 'Tizimdan chiqildi.'
    });
});

// ==========================================
// HIMOYALANGAN ADMIN API TEST
// ==========================================

app.get('/api/admin/protected', requireAdmin, (req, res) => {
    res.json({
        success: true,
        message: 'Admin sessiyasi tasdiqlandi.'
    });
});

// ==========================================
// MUZEY YORDAMCHI FUNKSIYALARI
// ==========================================

function createSlug(name) {
    const base = String(name)
        .toLowerCase()
        .trim()
        .replace(/o‘|oʻ|o'/g, 'o')
        .replace(/g‘|gʻ|g'/g, 'g')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    return `${base || 'museum'}-${crypto.randomBytes(3).toString('hex')}`;
}

function isValidId(id) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}


// ==========================================
// MUZEYLAR RO‘YXATI
// ==========================================

app.get('/api/admin/museums', requireAdmin, async (req, res) => {
    try {
        const result = await query(`
            SELECT
                m.*,
                COUNT(a.id)::INTEGER AS artwork_count
            FROM museums m
            LEFT JOIN artworks a ON a.museum_id = m.id
            GROUP BY m.id
            ORDER BY m.created_at DESC
        `);

        res.json({
            success: true,
            museums: result.rows
        });
    } catch (error) {
        console.error('Muzeylar ro‘yxati xatosi:', error.message);

        res.status(500).json({
            success: false,
            error: 'Muzeylar ro‘yxatini olishda xatolik.'
        });
    }
});


// ==========================================
// YANGI MUZEY YARATISH
// ==========================================

app.post('/api/admin/museums', requireAdmin, async (req, res) => {
    try {
        const name = String(req.body?.name || '').trim();
        const description = String(req.body?.description || '').trim();

        if (!name) {
            return res.status(400).json({
                success: false,
                error: 'Muzey nomini kiriting.'
            });
        }

        if (name.length > 150 || description.length > 5000) {
            return res.status(400).json({
                success: false,
                error: 'Muzey nomi yoki tavsifi juda uzun.'
            });
        }

        const slug = createSlug(name);

        const result = await query(`
            INSERT INTO museums (name, description, slug)
            VALUES ($1, $2, $3)
            RETURNING *
        `, [name, description || null, slug]);

        res.status(201).json({
            success: true,
            message: 'Yangi muzey yaratildi!',
            museum: result.rows[0]
        });

    } catch (error) {
        console.error('Muzey yaratish xatosi:', error.message);

        res.status(500).json({
            success: false,
            error: 'Muzey yaratishda xatolik.'
        });
    }
});


// ==========================================
// MUZEYNI TAHRIRLASH
// ==========================================

app.put('/api/admin/museums/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            return res.status(400).json({
                success: false,
                error: 'Muzey ID noto‘g‘ri.'
            });
        }

        const name = String(req.body?.name || '').trim();
        const description = String(req.body?.description || '').trim();

        if (!name) {
            return res.status(400).json({
                success: false,
                error: 'Muzey nomini kiriting.'
            });
        }

        if (name.length > 150 || description.length > 5000) {
            return res.status(400).json({
                success: false,
                error: 'Muzey nomi yoki tavsifi juda uzun.'
            });
        }

        const result = await query(`
            UPDATE museums
            SET name = $1,
                description = $2,
                updated_at = NOW()
            WHERE id = $3
            RETURNING *
        `, [name, description || null, id]);

        if (!result.rows.length) {
            return res.status(404).json({
                success: false,
                error: 'Muzey topilmadi.'
            });
        }

        res.json({
            success: true,
            message: 'Muzey ma’lumotlari yangilandi!',
            museum: result.rows[0]
        });

    } catch (error) {
        console.error('Muzey tahrirlash xatosi:', error.message);

        res.status(500).json({
            success: false,
            error: 'Muzeyni tahrirlashda xatolik.'
        });
    }
});


// ==========================================
// MUZEYNI O‘CHIRISH
// ==========================================

app.delete('/api/admin/museums/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            return res.status(400).json({
                success: false,
                error: 'Muzey ID noto‘g‘ri.'
            });
        }

        const result = await query(`
            DELETE FROM museums
            WHERE id = $1
            RETURNING id
        `, [id]);

        if (!result.rows.length) {
            return res.status(404).json({
                success: false,
                error: 'Muzey topilmadi.'
            });
        }

        res.json({
            success: true,
            message: 'Muzey va unga tegishli rasmlar o‘chirildi.'
        });

    } catch (error) {
        console.error('Muzey o‘chirish xatosi:', error.message);

        res.status(500).json({
            success: false,
            error: 'Muzeyni o‘chirishda xatolik.'
        });
    }
});

    // ==========================================
// MUZEYGA SAN'AT ASARLARINI YUKLASH
// ==========================================

    app.post(
        '/api/admin/museums/:id/artworks',
        requireAdmin,
        (req, res, next) => {
            upload.array('artworks', 20)(req, res, async (uploadError) => {
                if (uploadError) {
                    return res.status(400).json({
                        success: false,
                        error: uploadError.code === 'LIMIT_FILE_SIZE'
                            ? 'Har bir rasm hajmi 1 MB dan oshmasligi kerak.'
                            : uploadError.code === 'LIMIT_FILE_COUNT'
                                ? 'Bir martada 20 tagacha rasm yuklash mumkin.'
                                : uploadError.message
                    });
                }

                try {
                    const { id } = req.params;

                    if (!isValidId(id)) {
                        return res.status(400).json({
                            success: false,
                            error: 'Muzey ID noto‘g‘ri.'
                        });
                    }

                    if (!req.files || req.files.length === 0) {
                        return res.status(400).json({
                            success: false,
                            error: 'Yuklash uchun rasmlarni tanlang.'
                        });
                    }

                    const client = await pool.connect();

                    try {
                        await client.query('BEGIN');

                        const museum = await client.query(
                            'SELECT id FROM museums WHERE id = $1',
                            [id]
                        );

                        if (!museum.rows.length) {
                            await client.query('ROLLBACK');

                            return res.status(404).json({
                                success: false,
                                error: 'Muzey topilmadi.'
                            });
                        }

                        const savedArtworks = [];

                        for (let i = 0; i < req.files.length; i++) {
                            const file = req.files[i];
                            // Rasmni WebP formatiga o'tkazish va optimallashtirish
                            const optimizedBuffer = await sharp(file.buffer)
                                .rotate()
                                .resize({
                                    width: 1920,
                                    height: 1920,
                                    fit: 'inside',
                                    withoutEnlargement: true
                                })
                                .webp({
                                    quality: 82,
                                    effort: 4
                                })
                                .toBuffer();

                            const title = file.originalname
                                .replace(/\.[^/.]+$/, '')
                                .slice(0, 200);

                            const result = await client.query(`
                            INSERT INTO artworks (
                                museum_id,
                                title,
                                image_data,
                                mime_type,
                                image_size,
                                sort_order
                            )
                            VALUES ($1, $2, $3, $4, $5, $6)
                            RETURNING id, title, mime_type, image_size
                        `, [
                                id,
                                title,
                                optimizedBuffer,
                                'image/webp',
                                optimizedBuffer.length,
                                i
                            ]);

                            savedArtworks.push(result.rows[0]);
                        }

                        await client.query('COMMIT');

                        return res.status(201).json({
                            success: true,
                            message: `${savedArtworks.length} ta rasm muvaffaqiyatli yuklandi!`,
                            artworks: savedArtworks
                        });

                    } catch (error) {
                        await client.query('ROLLBACK');
                        throw error;
                    } finally {
                        client.release();
                    }

                } catch (error) {
                    console.error('Rasm yuklash xatosi:', error.message);

                    return res.status(500).json({
                        success: false,
                        error: 'Rasmlarni bazaga saqlashda xatolik.'
                    });
                }
            });
        }
    );

    // ==========================================
// MUZEY SAN'AT ASARLARI RO'YXATI
// ==========================================

    app.get(
        '/api/admin/museums/:id/artworks',
        requireAdmin,
        async (req, res) => {
            try {
                const { id } = req.params;

                if (!isValidId(id)) {
                    return res.status(400).json({
                        success: false,
                        error: 'Muzey ID noto‘g‘ri.'
                    });
                }

                const result = await query(`
                SELECT
                    id,
                    title,
                    mime_type,
                    image_size,
                    sort_order,
                    created_at
                FROM artworks
                WHERE museum_id = $1
                ORDER BY sort_order ASC, created_at ASC
            `, [id]);

                return res.json({
                    success: true,
                    artworks: result.rows
                });

            } catch (error) {
                console.error('San’at asarlari ro‘yxati xatosi:', error.message);

                return res.status(500).json({
                    success: false,
                    error: 'San’at asarlarini olishda xatolik.'
                });
            }
        }
    );


// ==========================================
// BAZADAGI RASMNI KO'RSATISH
// ==========================================

    app.get('/api/artworks/:id/image', async (req, res) => {
        try {
            const { id } = req.params;

            if (!isValidId(id)) {
                return res.status(400).send('Rasm ID noto‘g‘ri.');
            }

            const result = await query(`
            SELECT image_data, mime_type
            FROM artworks
            WHERE id = $1
        `, [id]);

            if (!result.rows.length || !result.rows[0].image_data) {
                return res.status(404).send('Rasm topilmadi.');
            }

            const artwork = result.rows[0];

            res.setHeader('Content-Type', artwork.mime_type);
            res.setHeader('Cache-Control', 'public, max-age=86400');
            res.setHeader('X-Content-Type-Options', 'nosniff');

            return res.send(artwork.image_data);

        } catch (error) {
            console.error('Rasmni ko‘rsatish xatosi:', error.message);
            return res.status(500).send('Rasmni ochishda xatolik.');
        }
    });

// ==========================================
// OMMAVIY MUZEY MA'LUMOTLARI
// ==========================================

app.get('/api/museums/:slug', async (req, res) => {
    try {
        const { slug } = req.params;

        if (!slug || slug.length > 180) {
            return res.status(400).json({
                success: false,
                error: 'Muzey manzili noto‘g‘ri.'
            });
        }

        // Muzey ma'lumotlarini olish
        const museumResult = await query(`
            SELECT
                id,
                name,
                description,
                slug,
                cover_image_url,
                created_at
            FROM museums
            WHERE slug = $1
            LIMIT 1
        `, [slug]);

        if (!museumResult.rows.length) {
            return res.status(404).json({
                success: false,
                error: 'Bunday muzey topilmadi.'
            });
        }

        const museum = museumResult.rows[0];

        // Shu muzeyga tegishli rasmlarni olish
        const artworksResult = await query(`
            SELECT
                id,
                title,
                mime_type,
                image_size,
                sort_order
            FROM artworks
            WHERE museum_id = $1
            ORDER BY sort_order ASC, created_at ASC
        `, [museum.id]);

        // Rasm manzillarini shakllantirish
        const artworks = artworksResult.rows.map(artwork => ({
            ...artwork,
            image_url: `/api/artworks/${artwork.id}/image`
        }));

        res.setHeader('Cache-Control', 'no-store');

        return res.json({
            success: true,
            museum,
            artworks
        });

    } catch (error) {
        console.error('Ommaviy muzey API xatosi:', error.message);

        return res.status(500).json({
            success: false,
            error: 'Muzey ma’lumotlarini olishda xatolik.'
        });
    }
});

// ==========================================
// PUBLIC FAYLLAR
// ==========================================

app.use(express.static(path.join(__dirname, 'public')));

// Three.js qo‘shimcha modullari (GLTFLoader, SkeletonUtils va boshqalar)
app.use('/three/examples', express.static(
    path.join(__dirname, '../node_modules/three/examples')
));

// Three.js asosiy kutubxonasi
app.use('/three', express.static(
    path.join(__dirname, '../node_modules/three/build')
));

// Asosiy sahifa
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Server holati
app.get('/api/status', (req, res) => {
    res.json({
        success: true,
        message: 'Virtual Art Museum server ishlayapti!'
    });
});

// Eski sessiyalarni xotiradan tozalash
setInterval(() => {
    const now = Date.now();

    for (const [token, session] of adminSessions) {
        if (now > session.expiresAt) {
            adminSessions.delete(token);
        }
    }

    for (const [ip, attempts] of loginAttempts) {
        if (now - attempts.startedAt > LOGIN_BLOCK_TIME) {
            loginAttempts.delete(ip);
        }
    }
}, 10 * 60 * 1000).unref();

// Serverni ishga tushirish
app.listen(PORT, () => {
    console.log(`Virtual Art Museum server: http://localhost:${PORT}`);

    if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
        console.warn('DIQQAT: Admin login va paroli .env faylida sozlanmagan!');
    } else {
        console.log('Admin login tizimi tayyor.');
    }
});
