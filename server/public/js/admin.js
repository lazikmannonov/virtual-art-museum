
// =====================================
// VIRTUAL ART MUSEUM — ADMIN PANEL
// =====================================

const loginScreen = document.getElementById('loginScreen');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('loginForm');
const loginMessage = document.getElementById('loginMessage');
const museumForm = document.getElementById('museumForm');
const museumMessage = document.getElementById('museumMessage');

let museums = [];

const pageTitles = {
    overview: 'Bosh sahifa',
    museums: 'Muzeylar',
    create: 'Yangi muzey',
    settings: 'Sozlamalar'
};


// =====================================
// XAVFSIZ MATN KO‘RINISHI
// =====================================

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    })[char]);
}


// =====================================
// API SO‘ROVLARI
// =====================================

async function apiRequest(url, options = {}) {
    const headers = {
        ...(options.headers || {})
    };

    // FormData yuborilganda Content-Type ni brauzer o'zi belgilaydi
    if (options.body && !(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
        credentials: 'same-origin',
        ...options,
        headers
    });

    const data = await response.json().catch(() => ({}));

    if (response.status === 401 || response.status === 403) {
        throw new Error(data.error || 'Admin sessiyasi tugagan. Qayta kiring.');
    }

    if (!response.ok || data.success === false) {
        throw new Error(data.error || 'Serverda xatolik yuz berdi.');
    }

    return data;
}

// =====================================
// SAHIFALAR O‘RTASIDA O‘TISH
// =====================================

function showPage(pageName) {
    document.querySelectorAll('.page-section').forEach(section => {
        section.hidden = true;
    });

    const selectedPage = document.getElementById('page-' + pageName);

    if (!selectedPage) return;

    selectedPage.hidden = false;

    document.getElementById('pageTitle').textContent =
        pageTitles[pageName] || 'Bosh sahifa';

    document.querySelectorAll('.nav-item').forEach(button => {
        button.classList.toggle(
            'active',
            button.dataset.page === pageName
        );
    });

    if (pageName === 'museums' || pageName === 'overview') {
        loadMuseums();
    }
}

document.querySelectorAll('[data-page]').forEach(button => {
    button.addEventListener('click', () => {
        showPage(button.dataset.page);
    });
});

document.querySelectorAll('[data-go]').forEach(button => {
    button.addEventListener('click', () => {
        showPage(button.dataset.go);
    });
});


// =====================================
// MUZEYLARNI YUKLASH
// =====================================

async function loadMuseums() {
    const museumList = document.getElementById('museumList');
    const recentMuseums = document.getElementById('recentMuseums');

    try {
        const data = await apiRequest('/api/admin/museums');

        museums = Array.isArray(data.museums) ? data.museums : [];

        renderMuseums();
        renderDashboard();

    } catch (error) {
        console.error('Muzeylarni yuklash:', error);

        museumList.innerHTML = `
            <div class="empty-state">
                ${escapeHtml(error.message)}
            </div>
        `;

        recentMuseums.textContent = error.message;
    }
}


// =====================================
// MUZEYLAR RO‘YXATINI CHIZISH
// =====================================

// =====================================
// MUZEYLAR RO‘YXATINI CHIZISH
// =====================================

function renderMuseums() {
    const museumList = document.getElementById('museumList');

    if (!museums.length) {
        museumList.innerHTML = `
            <div class="empty-state">
                Hozircha muzeylar mavjud emas.
            </div>
        `;
        return;
    }

    museumList.innerHTML = museums.map(museum => `
        <article class="content-card museum-item">
            <div>
                <h3>${escapeHtml(museum.name)}</h3>

                <p>
                    ${escapeHtml(museum.description || 'Tavsif kiritilmagan')}
                </p>

                <small>
                    San’at asarlari: ${Number(museum.artwork_count || 0)}
                </small>
            </div>

            <div class="artwork-upload-area">
                <label>
                    San’at asarlarini tanlang
                    <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        data-artwork-upload="${escapeHtml(museum.id)}"
                    >
                </label>

                <div
                    class="artwork-preview"
                    data-artwork-preview="${escapeHtml(museum.id)}"
                ></div>

                <button
                    type="button"
                    class="primary-button"
                    data-upload-artworks="${escapeHtml(museum.id)}"
                    disabled
                >
                    Rasmlarni yuklash
                </button>

                <p
                    class="message"
                    data-upload-message="${escapeHtml(museum.id)}"
                ></p>
            </div>

            <div class="form-actions">
                <button
                    type="button"
                    class="secondary-button"
                    data-edit-museum="${escapeHtml(museum.id)}">
                    Tahrirlash
                </button>

                <button
                    type="button"
                    class="secondary-button"
                    data-delete-museum="${escapeHtml(museum.id)}">
                    O‘chirish
                </button>
            </div>
        </article>
    `).join('');
}

// =====================================
// DASHBOARD STATISTIKASI
// =====================================

function renderDashboard() {
    const totalArtworks = museums.reduce((sum, museum) => {
        return sum + Number(museum.artwork_count || 0);
    }, 0);

    document.getElementById('totalMuseums').textContent =
        museums.length;

    document.getElementById('totalArtworks').textContent =
        totalArtworks;

    const recentMuseums = document.getElementById('recentMuseums');
    const recent = museums.slice(0, 3);

    if (!recent.length) {
        recentMuseums.innerHTML = `
            <div class="empty-state">
                Hozircha muzeylar mavjud emas.
            </div>
        `;
        return;
    }

    recentMuseums.innerHTML = recent.map(museum => `
        <div class="museum-item">
            <strong>${escapeHtml(museum.name)}</strong>
            <p>
                San’at asarlari:
                ${Number(museum.artwork_count || 0)}
            </p>
        </div>
    `).join('');
}


// =====================================
// YANGI MUZEY YARATISH
// =====================================

museumForm.addEventListener('submit', async event => {
    event.preventDefault();

    const name = document.getElementById('museumName').value.trim();
    const description = document
        .getElementById('museumDescription')
        .value.trim();

    const cover = document.getElementById('museumCover');

    if (cover.files.length) {
        museumMessage.textContent =
            'Muqova rasmi yuklash hali ulanmagan. Hozircha fayl tanlamang.';
        return;
    }

    if (!name) {
        museumMessage.textContent = 'Muzey nomini kiriting.';
        return;
    }

    const submitButton = museumForm.querySelector(
        'button[type="submit"]'
    );

    submitButton.disabled = true;
    museumMessage.textContent = 'Muzey saqlanmoqda...';

    try {
        const data = await apiRequest('/api/admin/museums', {
            method: 'POST',
            body: JSON.stringify({ name, description })
        });

        museumMessage.textContent =
            data.message || 'Muzey muvaffaqiyatli yaratildi!';

        museumForm.reset();

        await loadMuseums();

        showPage('museums');

    } catch (error) {
        museumMessage.textContent = error.message;
        console.error('Muzey yaratish:', error);

    } finally {
        submitButton.disabled = false;
    }
});

// =====================================
// RASMLARNI TANLASH VA OLDINDAN KO‘RISH
// =====================================

document.getElementById('museumList').addEventListener('change', event => {
    const input = event.target.closest('[data-artwork-upload]');

    if (!input) return;

    const museumId = input.dataset.artworkUpload;
    const preview = document.querySelector(
        `[data-artwork-preview="${museumId}"]`
    );
    const message = document.querySelector(
        `[data-upload-message="${museumId}"]`
    );
    const uploadButton = document.querySelector(
        `[data-upload-artworks="${museumId}"]`
    );

    // Eski rasmlar xotirasini bo‘shatish
    preview.querySelectorAll('img').forEach(img => {
        URL.revokeObjectURL(img.src);
    });

    preview.innerHTML = '';
    message.textContent = '';
    uploadButton.disabled = true;

    const files = Array.from(input.files || []);

    if (!files.length) return;

    if (files.length > 20) {
        message.textContent = 'Bir martada ko‘pi bilan 20 ta rasm tanlang.';
        input.value = '';
        return;
    }

    const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/webp'
    ];

    const invalidFile = files.find(file =>
        !allowedTypes.includes(file.type) ||
        file.size > 1024 * 1024
    );

    if (invalidFile) {
        message.textContent =
            'Faqat JPG, PNG, WebP va 1 MB dan kichik rasmlar tanlang.';

        input.value = '';
        return;
    }

    files.forEach(file => {
        const imageUrl = URL.createObjectURL(file);

        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = file.name;

        img.style.width = '100px';
        img.style.height = '100px';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '8px';
        img.style.margin = '5px';

        preview.appendChild(img);
    });

    message.textContent = `${files.length} ta rasm tanlandi.`;
    uploadButton.disabled = false;
});

// =====================================
// MUZEYNI TAHRIRLASH VA O‘CHIRISH
// =====================================

document.getElementById('museumList').addEventListener('click', async event => {
    const editButton = event.target.closest('[data-edit-museum]');
    const deleteButton = event.target.closest('[data-delete-museum]');

    // =====================================
// SAN’AT ASARLARINI SERVERGA YUKLASH
// =====================================

    const uploadButton = event.target.closest('[data-upload-artworks]');

    if (uploadButton) {
        const museumId = uploadButton.dataset.uploadArtworks;

        const input = document.querySelector(
            `[data-artwork-upload="${museumId}"]`
        );

        const message = document.querySelector(
            `[data-upload-message="${museumId}"]`
        );

        const files = Array.from(input.files || []);

        if (!files.length) {
            message.textContent = 'Avval rasmlarni tanlang.';
            return;
        }

        const formData = new FormData();

        files.forEach(file => {
            formData.append('artworks', file);
        });

        uploadButton.disabled = true;
        uploadButton.textContent = 'Yuklanmoqda...';
        message.textContent = 'Rasmlar serverga yuborilmoqda...';

        try {
            const result = await apiRequest(
                `/api/admin/museums/${museumId}/artworks`,
                {
                    method: 'POST',
                    body: formData
                }
            );

            message.textContent =
                result.message || 'Rasmlar muvaffaqiyatli yuklandi!';

            input.value = '';

            await loadMuseums();

        } catch (error) {
            message.textContent = error.message;
        } finally {
            uploadButton.disabled = false;
            uploadButton.textContent = 'Rasmlarni yuklash';
        }

        return;
    }

    if (editButton) {
        const id = editButton.dataset.editMuseum;
        const museum = museums.find(item => item.id === id);

        if (!museum) return;

        const name = prompt('Muzey nomi:', museum.name);
        if (name === null) return;

        const description = prompt(
            'Muzey tavsifi:',
            museum.description || ''
        );

        if (description === null) return;

        if (!name.trim()) {
            alert('Muzey nomini kiriting.');
            return;
        }

        try {
            const data = await apiRequest(`/api/admin/museums/${id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    name: name.trim(),
                    description: description.trim()
                })
            });

            alert(data.message || 'Muzey yangilandi!');
            await loadMuseums();

        } catch (error) {
            alert(error.message);
        }
    }

    if (deleteButton) {
        const id = deleteButton.dataset.deleteMuseum;
        const museum = museums.find(item => item.id === id);

        if (!museum) return;

        const confirmed = confirm(
            `"${museum.name}" muzeyini o‘chirmoqchimisiz? Bu amalni qaytarib bo‘lmaydi.`
        );

        if (!confirmed) return;

        try {
            const data = await apiRequest(`/api/admin/museums/${id}`, {
                method: 'DELETE'
            });

            alert(data.message || 'Muzey o‘chirildi!');
            await loadMuseums();

        } catch (error) {
            alert(error.message);
        }
    }
});


// =====================================
// ADMIN LOGIN
// =====================================

loginForm.addEventListener('submit', async event => {
    event.preventDefault();

    const username = document
        .getElementById('adminUsername')
        .value.trim();

    const password = document
        .getElementById('adminPassword')
        .value;

    loginMessage.textContent = 'Tekshirilmoqda...';

    try {
        const data = await apiRequest('/api/admin/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });

        if (!data.success) {
            throw new Error(data.error || 'Kirish amalga oshmadi.');
        }

        loginScreen.hidden = true;
        dashboard.hidden = false;

        loginForm.reset();

        showPage('overview');
        await loadMuseums();

    } catch (error) {
        loginMessage.textContent = error.message;
        console.error('Admin login:', error);
    }
});


// =====================================
// ADMIN LOGOUT
// =====================================

document.getElementById('logoutButton')
    .addEventListener('click', async () => {
        try {
            await fetch('/api/admin/logout', {
                method: 'POST',
                credentials: 'same-origin'
            });
        } catch (error) {
            console.error('Chiqish xatosi:', error);
        } finally {
            dashboard.hidden = true;
            loginScreen.hidden = false;
            loginForm.reset();
            loginMessage.textContent = '';
        }
    });
