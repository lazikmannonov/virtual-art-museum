
const express = require('express');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '1mb' }));

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
// PUBLIC FAYLLAR
// ==========================================

app.use(express.static(path.join(__dirname, 'public')));

// Three.js kutubxonasi
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
