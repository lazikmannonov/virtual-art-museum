import * as THREE from '/three/three.module.js';

// ==========================================
// 1. 3D SAHNA VA KAMERA
// ==========================================

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf2f0e9);

const camera = new THREE.PerspectiveCamera(
    65,
    window.innerWidth / window.innerHeight,
    0.1,
    100
);

camera.position.set(0, 7, 15);
camera.lookAt(0, 2, 0);

// ==========================================
// 2. YUQORI SIFATLI RENDERER
// ==========================================

const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

const renderer = new THREE.WebGLRenderer({
    antialias: !isMobile,
    powerPreference: 'high-performance',
    alpha: false
});

// Telefon va kompyuter uchun alohida aniqlik
renderer.setPixelRatio(
    Math.min(
        window.devicePixelRatio || 1,
        isMobile ? 1.5 : 2
    )
);

renderer.setSize(window.innerWidth, window.innerHeight);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

document.getElementById('museum').appendChild(renderer.domElement);

// ==========================================
// MOBIL JOYSTICK BOSHQARUVI
// ==========================================

let joystickX = 0;
let joystickY = 0;
let joystickPointerId = null;

const joystickBase = document.createElement('div');
joystickBase.style.cssText = `
    position: fixed;
    left: 30px;
    bottom: 35px;
    width: 130px;
    height: 130px;
    border-radius: 50%;
    background: rgba(40, 40, 40, 0.18);
    border: 2px solid rgba(255,255,255,0.55);
    display: none;
    align-items: center;
    justify-content: center;
    z-index: 20;
    touch-action: none;
    user-select: none;
`;

const joystickKnob = document.createElement('div');
joystickKnob.style.cssText = `
    width: 54px;
    height: 54px;
    border-radius: 50%;
    background: rgba(255,255,255,0.8);
    border: 2px solid rgba(80,80,80,0.3);
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    pointer-events: none;
`;

joystickBase.appendChild(joystickKnob);
document.body.appendChild(joystickBase);

// Faqat sensorli qurilmalarda ko‘rsatish
const isTouchDevice =
    window.matchMedia('(pointer: coarse)').matches;

if (isTouchDevice) {
    joystickBase.style.display = 'flex';
}

function updateJoystick(event) {
    const rect = joystickBase.getBoundingClientRect();

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let dx = event.clientX - centerX;
    let dy = event.clientY - centerY;

    const maxDistance = 43;
    const distance = Math.hypot(dx, dy);

    if (distance > maxDistance) {
        dx = dx / distance * maxDistance;
        dy = dy / distance * maxDistance;
    }

    joystickX = dx / maxDistance;
    joystickY = dy / maxDistance;

    joystickKnob.style.transform =
        `translate(${dx}px, ${dy}px)`;
}

function resetJoystick() {
    joystickX = 0;
    joystickY = 0;
    joystickPointerId = null;

    joystickKnob.style.transform = 'translate(0px, 0px)';
}

joystickBase.addEventListener('pointerdown', event => {
    if (joystickPointerId !== null) return;

    event.preventDefault();

    joystickPointerId = event.pointerId;
    joystickBase.setPointerCapture(event.pointerId);

    updateJoystick(event);
});

joystickBase.addEventListener('pointermove', event => {
    if (event.pointerId !== joystickPointerId) return;

    event.preventDefault();
    updateJoystick(event);
});

joystickBase.addEventListener('pointerup', event => {
    if (event.pointerId !== joystickPointerId) return;
    resetJoystick();
});

joystickBase.addEventListener('pointercancel', event => {
    if (event.pointerId !== joystickPointerId) return;
    resetJoystick();
});

// ==========================================
// 3. IVORY PREMIUM MATERIALLAR
// ==========================================

// PREMIUM MARMAR POL
const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0xddd8cc,
    roughness: 0.24,
    metalness: 0.04
});

// IVORY DEVORLAR
const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0xfaf9f5,
    roughness: 0.88,
    metalness: 0
});

// OQ PREMIUM SHIFT
const ceilingMaterial = new THREE.MeshStandardMaterial({
    color: 0xf5f3ed,
    roughness: 0.92,
    metalness: 0
});

// ==========================================
// 4–7. AVTOMATIK O'LCHAMLI MUZEY ZALI
// ==========================================

let ROOM_WIDTH = 24;
let roomDepth = 32;

const roomObjects = [];
const ceilingLights = [];

function addRoomObject(object) {
    scene.add(object);
    roomObjects.push(object);
    return object;
}

function createWall(width, height, x, y, z, rotationY = 0) {
    const wall = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, 0.3),
        wallMaterial
    );

    wall.position.set(x, y, z);
    wall.rotation.y = rotationY;
    wall.receiveShadow = true;

    return addRoomObject(wall);
}

function buildMuseumRoom(depth, width = 24) {
    ROOM_WIDTH = width;
    // Eski pol, devor, shift va chiroqlarni olib tashlash
    roomObjects.forEach(object => {
        scene.remove(object);

        if (object.geometry) object.geometry.dispose();
    });

    ceilingLights.forEach(light => {
        scene.remove(light);
        if (light.target) scene.remove(light.target);
    });

    roomObjects.length = 0;
    ceilingLights.length = 0;

    roomDepth = depth;
    camera.far = Math.max(100, depth * 2);
    camera.updateProjectionMatrix();

    // POL
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(ROOM_WIDTH, roomDepth),
        floorMaterial
    );

    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    addRoomObject(floor);

    // ORQA DEVOR
    createWall(
        ROOM_WIDTH, 8,
        0, 4, -roomDepth / 2
    );

    // CHAP DEVOR
    createWall(
        roomDepth, 8,
        -ROOM_WIDTH / 2, 4, 0,
        Math.PI / 2
    );

    // O'NG DEVOR
    createWall(
        roomDepth, 8,
        ROOM_WIDTH / 2, 4, 0,
        Math.PI / 2
    );

    // OLD DEVOR
    createWall(
        ROOM_WIDTH, 8,
        0, 4, roomDepth / 2
    );

    // SHIFT
    const ceiling = new THREE.Mesh(
        new THREE.PlaneGeometry(ROOM_WIDTH, roomDepth),
        ceilingMaterial
    );

    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 8;
    addRoomObject(ceiling);

    // SHIFT CHIROQLARI
    for (let x = -8; x <= 8; x += 8) {
        for (let z = -roomDepth / 2 + 6;
             z <= roomDepth / 2 - 6;
             z += 10) {

            const light = new THREE.SpotLight(
                0xffffff,
                18,
                20,
                Math.PI / 5,
                0.5,
                1.5
            );

            light.position.set(x, 7.5, z);
            light.target.position.set(x, 0, z);

            scene.add(light);
            scene.add(light.target);

            ceilingLights.push(light);
        }
    }

    console.log('Muzey zali o‘lchami:', ROOM_WIDTH, 'x', roomDepth);
}

// Dastlabki zal
buildMuseumRoom(32);

// ==========================================
// IVORY PREMIUM YORITISH
// ==========================================

// TABIIY UMUMIY YORUG‘LIK
const ambientLight = new THREE.HemisphereLight(
    0xffffff,
    0xd4cbbb,
    1.15
);

scene.add(ambientLight);

// ASOSIY YUMSHOQ YORUG‘LIK
const mainLight = new THREE.DirectionalLight(
    0xfff8eb,
    1.8
);

mainLight.position.set(-5, 12, 8);

mainLight.castShadow = true;

mainLight.shadow.mapSize.width = 2048;
mainLight.shadow.mapSize.height = 2048;

mainLight.shadow.camera.left = -25;
mainLight.shadow.camera.right = 25;
mainLight.shadow.camera.top = 25;
mainLight.shadow.camera.bottom = -25;

mainLight.shadow.bias = -0.0002;
mainLight.shadow.normalBias = 0.025;

scene.add(mainLight);

// ==========================================
// 8. HAQIQIY MUZEY RASMLARI
// ==========================================

// Rasmlar API orqali yuklanadi.

// ==========================================
// 9. RAMKA VA SURAT YARATISH
// ==========================================

function createArtwork(
    x,
    y,
    z,
    rotationY,
    number,
    texture
) {

    const group = new THREE.Group();

    // Suratning haqiqiy nisbatini aniqlash
    const image = texture.image;

    const imageWidth = image.width || 512;
    const imageHeight = image.height || 384;

    const aspectRatio = imageWidth / imageHeight;

    // Ramkaning maksimal ichki o'lchami
    const maxWidth = 2.2;
    const maxHeight = 1.6;

    // Surat nisbatini saqlagan holda moslashtirish
    let pictureWidth = maxWidth;
    let pictureHeight = pictureWidth / aspectRatio;

    if (pictureHeight > maxHeight) {

        pictureHeight = maxHeight;
        pictureWidth = pictureHeight * aspectRatio;
    }

    // Ramka o'lchamlari
    const outerWidth = pictureWidth + 0.36;
    const outerHeight = pictureHeight + 0.36;

    const innerWidth = pictureWidth + 0.16;
    const innerHeight = pictureHeight + 0.16;

    // Tashqi ramka
    const outerFrame = new THREE.Mesh(
        new THREE.BoxGeometry(
            outerWidth,
            outerHeight,
            0.13
        ),
        new THREE.MeshStandardMaterial({
            color: 0x8B755B,
            roughness: 0.38,
            metalness: 0.35
        })
    );

    group.add(outerFrame);

    // Ichki oq chegara
    const innerFrame = new THREE.Mesh(
        new THREE.BoxGeometry(
            innerWidth,
            innerHeight,
            0.045
        ),
        new THREE.MeshStandardMaterial({
            color: 0xF8F5EE,
            roughness: 0.7
        })
    );

    innerFrame.position.z = 0.085;

    group.add(innerFrame);

    // Surat
    const picture = new THREE.Mesh(
        new THREE.PlaneGeometry(
            pictureWidth,
            pictureHeight
        ),
        new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.8,
            side: THREE.DoubleSide
        })
    );

    picture.position.z = 0.12;

    // Suratni aniqlash uchun belgi
    picture.userData.isArtwork = true;
    picture.userData.artworkNumber = number;

    group.add(picture);

    // Devorga joylashtirish
    group.position.set(x, y, z);
    group.rotation.y = rotationY;

    scene.add(group);

    // Surat uchun alohida yoritish
    const spotlight = new THREE.SpotLight(
        0xffffff,
        10,
        10,
        Math.PI / 5,
        0.65,
        1.5
    );

    spotlight.position.set(x, y + 2.5, z);
    spotlight.target.position.set(x, y, z);

    scene.add(spotlight);
    scene.add(spotlight.target);

    return picture;
}


// ==========================================
// 10. HAQIQIY RASMLARNI DEVORLARGA JOYLASHTIRISH
// ==========================================

async function loadMuseumArtworks() {
    try {
        const params = new URLSearchParams(window.location.search);
        const slug = params.get('slug');

        if (!slug) {
            throw new Error('Muzey manzili ko‘rsatilmagan.');
        }

        console.log('Muzey ma’lumotlari yuklanmoqda...');

        const response = await fetch(
            `/api/museums/${encodeURIComponent(slug)}`,
            { cache: 'no-store' }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Muzeyni yuklab bo‘lmadi.');
        }

        const museum = data.museum;
        const artworks = data.artworks || [];

        document.title = museum.name;

        const titleElement = document.querySelector('.museum-title');

        if (titleElement) {
            titleElement.textContent = museum.name;
        }

        if (artworks.length === 0) {
            console.warn('Bu muzeyda hali rasmlar mavjud emas.');
            return;
        }

        // Barcha rasmlarni joylashtirish
        const artworksToPlace = artworks;

// Har bir devorga tushadigan rasmlar soni
        const rearCount = Math.ceil(artworksToPlace.length / 3);
        const sideCount = Math.ceil(artworksToPlace.length / 3);

// Rasmlar uchun zal o‘lchamini hisoblash
        const requiredWidth = Math.max(24, 8 + rearCount * 3.2);
        const requiredDepth = Math.max(32, 8 + sideCount * 3.2);

// Yangi o‘lchamdagi zalni qurish
        buildMuseumRoom(requiredDepth, requiredWidth);

        console.log('Zal o‘lchami:', {
            width: requiredWidth,
            depth: requiredDepth,
            artworks: artworksToPlace.length
        });

        // ==========================================
        // RASMLARNI DEVORLARGA TAQSIMLASH
        // ==========================================

        const wallGroups = [
            { name: 'orqa', positions: [] },
            { name: 'chap', positions: [] },
            { name: 'o‘ng', positions: [] }
        ];

        // Rasmlarni navbat bilan devorlarga ajratish
        artworksToPlace.forEach((artwork, index) => {
            const wallIndex = index % 3;

            wallGroups[wallIndex].positions.push({
                artwork,
                index
            });
        });

        // Har bir rasmning joylashuvini saqlash
        const positions = new Array(artworksToPlace.length);

        wallGroups.forEach((wall, wallIndex) => {
            const count = wall.positions.length;

            if (count === 0) return;

            wall.positions.forEach((item, index) => {
                let position;

                if (wallIndex === 0) {
                    // ORQA DEVOR
                    const span = ROOM_WIDTH - 6;

                    const x = count === 1
                        ? 0
                        : -span / 2 +
                        (span * (index + 1)) / (count + 1);

                    position = {
                        x,
                        y: 4.2,
                        z: -roomDepth / 2 + 0.22,
                        rotationY: 0
                    };

                } else if (wallIndex === 1) {
                    // CHAP DEVOR
                    const span = roomDepth - 6;

                    const z = count === 1
                        ? 0
                        : -span / 2 +
                        (span * (index + 1)) / (count + 1);

                    position = {
                        x: -ROOM_WIDTH / 2 + 0.22,
                        y: 4.2,
                        z,
                        rotationY: Math.PI / 2
                    };

                } else {
                    // O‘NG DEVOR
                    const span = roomDepth - 6;
                    const z = count === 1
                        ? 0
                        : -span / 2 +
                        (span * (index + 1)) / (count + 1);

                    position = {
                        x: ROOM_WIDTH / 2 - 0.22,
                        y: 4.2,
                        z,
                        rotationY: -Math.PI / 2
                    };
                }

                // Rasmning asl tartibini saqlash
                positions[item.index] = position;
            });
        });

        console.log('Rasmlar taqsimlandi:', {
            orqa: wallGroups[0].positions.length,
            chap: wallGroups[1].positions.length,
            ong: wallGroups[2].positions.length
        });

        // ==========================================
        // RASMLARNI YUKLASH VA DEVORGA CHIQARISH
        // ==========================================

        const textureLoader = new THREE.TextureLoader();

// Qurilmaga ortiqcha yuk tushirmaslik uchun anisotropy chegarasi
        const maxAnisotropy = Math.min(
            4,
            renderer.capabilities.getMaxAnisotropy()
        );

// Rasmlarni 3 tadan yuklash
        const batchSize = 3;

        for (
            let start = 0;
            start < artworksToPlace.length;
            start += batchSize
        ) {
            const batch = artworksToPlace.slice(
                start,
                start + batchSize
            );

            await Promise.all(
                batch.map(async (artwork, batchIndex) => {
                    const i = start + batchIndex;
                    const position = positions[i];

                    if (!position || !artwork.image_url) {
                        console.warn(
                            'Rasm joylashuvi yoki manzili topilmadi:',
                            artwork
                        );
                        return;
                    }

                    try {
                        const texture = await textureLoader.loadAsync(
                            artwork.image_url
                        );

                        texture.colorSpace = THREE.SRGBColorSpace;
                        texture.anisotropy = maxAnisotropy;

                        const picture = createArtwork(
                            position.x,
                            position.y,
                            position.z,
                            position.rotationY,
                            i + 1,
                            texture
                        );

                        picture.userData.artworkId = artwork.id;
                        picture.userData.artworkTitle =
                            artwork.title || `San'at asari ${i + 1}`;

                        console.log(
                            'Rasm yuklandi:',
                            artwork.title || i + 1
                        );

                    } catch (imageError) {
                        console.error(
                            'Rasmni yuklashda xato:',
                            artwork.title,
                            imageError
                        );
                    }
                })
            );

            console.log(
                `Yuklandi: ${Math.min(start + batch.length, artworksToPlace.length)} / ${artworksToPlace.length}`
            );
        }
        console.log(
            `${artworksToPlace.length} ta rasm joylashtirishga tayyor.`
        );

    } catch (error) {
        console.error(
            'Muzey rasmlarini yuklashda xato:',
            error
        );
    }
}

// ==========================================
// 11. SURATNI KATTA EKRANDA OCHISH
// ==========================================

const artworkViewer = document.createElement('div');

artworkViewer.id = 'artworkViewer';

artworkViewer.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 10000;
    display: none;
    align-items: center;
    justify-content: center;
    padding: 30px;
    background: rgba(12, 12, 12, 0.96);
    backdrop-filter: blur(12px);
`;

// Katta surat
const enlargedImage = document.createElement('img');

enlargedImage.style.cssText = `
    display: block;
    max-width: 100%;
    max-height: 88vh;
    width: auto;
    height: auto;
    object-fit: contain;
    border-radius: 4px;
    box-shadow: 0 15px 60px rgba(0,0,0,0.5);
`;

// Yopish tugmasi
const closeViewer = document.createElement('button');

closeViewer.textContent = '✕';

closeViewer.setAttribute('aria-label', 'Suratni yopish');

closeViewer.style.cssText = `
    position: absolute;
    top: 22px;
    right: 25px;
    width: 46px;
    height: 46px;
    border: 1px solid rgba(255,255,255,0.3);
    border-radius: 50%;
    background: rgba(255,255,255,0.1);
    color: white;
    font-size: 23px;
    cursor: pointer;
`;

// Elementlarni birlashtirish
artworkViewer.appendChild(enlargedImage);
artworkViewer.appendChild(closeViewer);

document.body.appendChild(artworkViewer);

// ==========================================
// 12. SURATNI OCHISH FUNKSIYASI
// ==========================================

function openArtwork(picture) {

    const texture = picture.material.map;

    if (!texture || !texture.image) return;

    const image = texture.image;

    // Canvas namunaviy suratlari uchun
    if (typeof image.toDataURL === 'function') {

        enlargedImage.src = image.toDataURL('image/png');

    } else if (image.src) {

        // Keyinchalik yuklangan haqiqiy rasmlar uchun
        enlargedImage.src = image.src;

    } else {

        // ImageBitmap kabi boshqa tasvirlar uchun
        const canvas = document.createElement('canvas');

        canvas.width = image.width;
        canvas.height = image.height;

        const context = canvas.getContext('2d');

        context.drawImage(image, 0, 0);

        enlargedImage.src = canvas.toDataURL('image/png');
    }

    artworkViewer.style.display = 'flex';

    document.body.style.overflow = 'hidden';
}

// ==========================================
// 13. SURATNI YOPISH
// ==========================================

function closeArtwork() {

    artworkViewer.style.display = 'none';

    enlargedImage.removeAttribute('src');

    document.body.style.overflow = '';
}

closeViewer.addEventListener('click', closeArtwork);

// Qorong'i fonni bosganda yopish
artworkViewer.addEventListener('click', (event) => {

    if (event.target === artworkViewer) {

        closeArtwork();
    }
});

// Escape tugmasi
window.addEventListener('keydown', (event) => {

    if (event.key === 'Escape') {

        closeArtwork();
    }
});
// Muzey rasmlarini bazadan yuklash
loadMuseumArtworks();

// ==========================================
// 14. SURATNI BOSISH ORQALI ANIQLASH
// ==========================================

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

const ARTWORK_INTERACTION_DISTANCE = 4;

renderer.domElement.addEventListener('click', (event) => {
    if (cameraWasDragged) {
        cameraWasDragged = false;
        return;
    }

    if (!player || artworkViewer.style.display === 'flex') {
        return;
    }

    const rect = renderer.domElement.getBoundingClientRect();

    pointer.x =
        ((event.clientX - rect.left) / rect.width) * 2 - 1;

    pointer.y =
        -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);

    const intersections = raycaster.intersectObjects(
        scene.children,
        true
    );

    const selectedPicture = intersections.find(
        item => item.object.userData.isArtwork === true
    );

    if (!selectedPicture) return;

    // Qahramon va rasm orasidagi masofa
    const dx = player.position.x - selectedPicture.point.x;
    const dz = player.position.z - selectedPicture.point.z;

    const distance = Math.hypot(dx, dz);

    if (distance > ARTWORK_INTERACTION_DISTANCE) {
        console.log('Rasmni ochish uchun yaqinroq boring.');
        return;
    }

    openArtwork(selectedPicture.object);
});

// ==========================================
// 15. EKRAN O'LCHAMIGA MOSLASHISH
// ==========================================

window.addEventListener('resize', () => {

    camera.aspect = window.innerWidth / window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

    renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, 1.5)
    );
});

// ==========================================
// 16. 3D ANIMATSIYA
// ==========================================

function animate() {

    requestAnimationFrame(animate);

    renderer.render(scene, camera);
}

animate();

console.log('Virtual Art Museum muvaffaqiyatli ishga tushdi!');
console.log('Suratlarni kattalashtirish funksiyasi tayyor!');


// ==========================================
// 17. IVORY PREMIUM QAHRAMON TANLASH
// ==========================================

const characterSelector = document.createElement('div');
characterSelector.id = 'characterSelector';

const selectorStyle = document.createElement('style');

selectorStyle.textContent = `
    #characterSelector {
        position: fixed;
        inset: 0;
        z-index: 20000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        overflow-y: auto;
        background:
            radial-gradient(circle at 50% 0%, #ffffff 0%, transparent 55%),
            #eeeae0;
        font-family: Arial, sans-serif;
        color: #292720;
    }

    .character-panel {
        width: 100%;
        max-width: 1000px;
        padding: 42px 35px;
        text-align: center;
        background: rgba(255,255,255,0.88);
        border: 1px solid #e6dfd1;
        border-radius: 22px;
        box-shadow: 0 25px 80px rgba(70,55,30,0.12);
    }

    .character-eyebrow {
        color: #a78339;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 5px;
        margin-bottom: 16px;
    }

    .character-panel h1 {
        margin: 0;
        font-size: clamp(26px, 5vw, 40px);
        font-weight: 600;
        letter-spacing: -1px;
    }

    .character-subtitle {
        color: #898477;
        font-size: 14px;
        margin: 13px 0 32px;
    }

    #characterOptions {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 15px;
    }

    .character-card {
        min-width: 0;
        padding: 12px 10px 17px;
        border: 1px solid #e8e1d5;
        border-radius: 15px;
        background: #faf9f5;
        color: #302e28;
        cursor: pointer;
        transition: 0.25s ease;
    }

    .character-card:hover {
        transform: translateY(-5px);
        border-color: #c7a45d;
        box-shadow: 0 12px 28px rgba(80,60,25,0.10);
    }

    .character-card.selected {
        border: 2px solid #b18b43;
        background: #f4efe3;
        box-shadow: 0 8px 25px rgba(150,115,45,0.13);
    }

    .character-preview {
        width: 100%;
        height: 150px;
        display: block;
        object-fit: contain;
        border-radius: 10px;
        background:
            radial-gradient(circle, #ffffff 0%, #f0ede5 100%);
        margin-bottom: 13px;
    }

    .character-name {
        font-size: 14px;
        font-weight: 700;
    }

    .character-choice {
        display: block;
        min-height: 15px;
        margin-top: 7px;
        color: #a78339;
        font-size: 10px;
        letter-spacing: 1px;
    }

    #startMuseum {
        margin-top: 30px;
        padding: 15px 45px;
        border: 0;
        border-radius: 8px;
        background: #a78339;
        color: white;
        font-size: 14px;
        font-weight: 700;
        letter-spacing: 0.5px;
        cursor: pointer;
        transition: 0.2s;
    }

    #startMuseum:disabled {
        opacity: 0.4;
        cursor: not-allowed;
    }

    #startMuseum:not(:disabled):hover {
        background: #89692d;
        transform: translateY(-2px);
    }

    @media (max-width: 700px) {
        .character-panel {
            padding: 30px 16px;
        }

        #characterOptions {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 11px;
        }

        .character-card:last-child {
            grid-column: 1 / -1;
            width: calc(50% - 6px);
            justify-self: center;
        }

        .character-preview {
            height: 135px;
        }
    }

    @media (max-width: 360px) {
        .character-preview {
            height: 115px;
        }
    }
`;

document.head.appendChild(selectorStyle);

characterSelector.innerHTML = `
    <div class="character-panel">

        <div class="character-eyebrow">
            VIRTUAL ART MUSEUM
        </div>

        <h1>Sayohatingizni boshlang</h1>

        <p class="character-subtitle">
            Muzey bo‘ylab sayohat qilish uchun qahramoningizni tanlang
        </p>

        <div id="characterOptions"></div>

        <button id="startMuseum" disabled>
            MUZEYGA KIRISH
        </button>

    </div>
`;

document.body.appendChild(characterSelector);

const characterTypes = [
    { id: 'dinosaur', name: 'Dinozavr' },
    { id: 'fox', name: 'Tulki' },
    { id: 'penguin', name: 'Pingvin' },
    { id: 'robot', name: 'Robot' },
    { id: 'bear', name: 'Ayiq' }
];

let selectedCharacter = null;

const characterOptions =
    document.getElementById('characterOptions');

const startMuseumButton =
    document.getElementById('startMuseum');

characterTypes.forEach(character => {

    const button = document.createElement('button');

    button.type = 'button';
    button.className = 'character-card';

    button.innerHTML = `
        <img
            class="character-preview"
            alt="${character.name}"
        >

        <div class="character-name">
            ${character.name}
        </div>

        <span class="character-choice"></span>
    `;

    button.addEventListener('click', () => {

        selectedCharacter = character.id;

        document.querySelectorAll('.character-card')
            .forEach(item => {
                item.classList.remove('selected');
                item.querySelector('.character-choice').textContent = '';
            });

        button.classList.add('selected');

        button.querySelector('.character-choice')
            .textContent = 'TANLANDI';

        startMuseumButton.disabled = false;
    });

    characterOptions.appendChild(button);
});


// ==========================================
// 3D QAHRAMON RASMLARINI YARATISH
// ==========================================

function generateCharacterPreviews() {

    let previewRenderer;

    try {

        previewRenderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: false,
            preserveDrawingBuffer: true
        });

        previewRenderer.setSize(300, 240);
        previewRenderer.setPixelRatio(1);

        previewRenderer.outputColorSpace = THREE.SRGBColorSpace;
        previewRenderer.toneMapping = THREE.ACESFilmicToneMapping;
        previewRenderer.toneMappingExposure = 1.05;

        previewRenderer.setClearColor(0xf0ede5, 1);

        const previewScene = new THREE.Scene();
        previewScene.background = new THREE.Color(0xf0ede5);

        const previewCamera = new THREE.PerspectiveCamera(
            35,
            300 / 240,
            0.1,
            100
        );

        previewCamera.position.set(3, 2.8, 4.5);
        previewCamera.lookAt(0, 1.15, 10);

        const light = new THREE.HemisphereLight(
            0xffffff,
            0xd4cbbb,
            2
        );

        previewScene.add(light);

        const mainLight = new THREE.DirectionalLight(
            0xffffff,
            2.5
        );

        mainLight.position.set(-3, 7, 5);
        previewScene.add(mainLight);

        characterTypes.forEach(type => {

            const character = createCharacter(type.id);

            character.position.set(0, 0, 10);
            character.rotation.y = Math.PI;

            previewScene.add(character);

            previewRenderer.render(
                previewScene,
                previewCamera
            );

            const card = Array.from(
                characterOptions.children
            ).find(item =>
                item.querySelector('.character-name')
                    .textContent === type.name
            );

            if (card) {
                card.querySelector('.character-preview').src =
                    previewRenderer.domElement.toDataURL('image/png');
            }

            previewScene.remove(character);

            character.traverse(object => {

                if (object.geometry) {
                    object.geometry.dispose();
                }

                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            });
        });

        previewRenderer.dispose();

    } catch (error) {

        console.error(
            'Qahramon rasmlarini yaratishda xatolik:',
            error
        );

        if (previewRenderer) {
            previewRenderer.dispose();
        }
    }
}

generateCharacterPreviews();

// ==========================================
// 18. QAHRAMON YARATISH
// ==========================================

let player = null;
let playerParts = null;


function createCharacter(type) {
    const character = new THREE.Group();

    // PREMIUM MATERIALLAR
    const mat = {
        dinosaur: new THREE.MeshStandardMaterial({ color: 0x70ad65, roughness: 0.72 }),
        fox: new THREE.MeshStandardMaterial({ color: 0xe98232, roughness: 0.72 }),
        penguin: new THREE.MeshStandardMaterial({ color: 0x293b50, roughness: 0.75 }),
        robot: new THREE.MeshStandardMaterial({ color: 0xdce5ed, metalness: 0.45, roughness: 0.3 }),
        bear: new THREE.MeshStandardMaterial({ color: 0x9b6542, roughness: 0.85 }),

        cream: new THREE.MeshStandardMaterial({ color: 0xffe9c8, roughness: 0.85 }),
        white: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 }),
        black: new THREE.MeshStandardMaterial({ color: 0x18202b, roughness: 0.65 }),
        orange: new THREE.MeshStandardMaterial({ color: 0xffa52e, roughness: 0.65 }),
        pink: new THREE.MeshStandardMaterial({ color: 0xf5a6a6, roughness: 0.8 }),
        blue: new THREE.MeshStandardMaterial({ color: 0x42b9f5, emissive: 0x12628c, emissiveIntensity: 0.7 }),
        red: new THREE.MeshStandardMaterial({ color: 0xd94d54, roughness: 0.65 }),
        dark: new THREE.MeshStandardMaterial({ color: 0x30343a, roughness: 0.7 })
    };

    const main = mat[type];

    if (!main) {
        console.error('Noma’lum qahramon turi:', type);
        return character;
    }

    // SHAR YORDAMIDA TANANING YUMALOQ QISMLARI
    function sphere(parent, x, y, z, sx, sy, sz, material) {
        const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(1, 32, 24),
            material
        );

        mesh.position.set(x, y, z);
        mesh.scale.set(sx, sy, sz);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        parent.add(mesh);

        return mesh;
    }

    // KUB SHAKLLAR
    function box(parent, x, y, z, sx, sy, sz, material, radius = 0) {
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(sx, sy, sz),
            material
        );

        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        parent.add(mesh);

        return mesh;
    }

    // KONUS SHAKLLAR
    function cone(parent, x, y, z, radius, height, material) {
        const mesh = new THREE.Mesh(
            new THREE.ConeGeometry(radius, height, 24),
            material
        );

        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        parent.add(mesh);

        return mesh;
    }

    // KO‘ZLAR
    function eyes(y, z, spacing = 0.14) {
        for (const side of [-1, 1]) {
            const x = side * spacing;

            sphere(character, x, y, z, 0.105, 0.125, 0.055, mat.white);
            sphere(character, x, y - 0.005, z - 0.047, 0.060, 0.078, 0.035, mat.black);

            // Ko‘zdagi yorug‘lik nuqtasi
            sphere(character, x - 0.018, y + 0.028, z - 0.077,
                0.021, 0.025, 0.012, mat.white);
        }
    }

    // TABASSUMGA O‘XSHASH YUZ DETALI
    function cheeks(y, z, material = mat.cream) {
        sphere(character, -0.22, y, z, 0.09, 0.055, 0.035, material);
        sphere(character, 0.22, y, z, 0.09, 0.055, 0.035, material);
    }

    // TANASI
    if (type === 'robot') {
        box(character, 0, 1.05, 0, 0.76, 0.82, 0.54, mat.robot);
        box(character, 0, 0.75, -0.285, 0.35, 0.12, 0.025, mat.blue);
        sphere(character, 0, 1.05, -0.29, 0.10, 0.10, 0.025, mat.blue);
    } else {
        sphere(character, 0, 1.08, 0, 0.45, 0.62, 0.36, main);
    }

    // QORIN VA KO‘KRAK
    if (type === 'dinosaur') {
        sphere(character, 0, 1.05, -0.315, 0.31, 0.46, 0.09, mat.cream);
    }

    if (type === 'fox') {
        sphere(character, 0, 1.04, -0.30, 0.29, 0.43, 0.09, mat.cream);
    }

    if (type === 'penguin') {
        sphere(character, 0, 1.05, -0.30, 0.32, 0.48, 0.12, mat.white);
    }

    if (type === 'bear') {
        sphere(character, 0, 1.05, -0.31, 0.30, 0.43, 0.10, mat.cream);
    }

    // BOSH
    const headY = 1.98;

    if (type === 'robot') {
        box(character, 0, headY, -0.02, 0.78, 0.67, 0.58, mat.robot);
        box(character, 0, headY, -0.325, 0.59, 0.40, 0.035, mat.black);

        // Robot ko‘zlari
        for (const side of [-1, 1]) {
            sphere(character, side * 0.15, 2.04, -0.36,
                0.065, 0.045, 0.025, mat.blue);
        }

        // Robot tabassumi
        box(character, 0, 1.87, -0.36, 0.15, 0.025, 0.025, mat.blue);

        // Antenna
        box(character, 0, 2.39, 0, 0.045, 0.20, 0.045, mat.dark);
        sphere(character, 0, 2.52, 0, 0.085, 0.085, 0.085, mat.red);

        // Quloq detallari
        sphere(character, -0.43, 2.0, 0, 0.09, 0.15, 0.10, mat.dark);
        sphere(character, 0.43, 2.0, 0, 0.09, 0.15, 0.10, mat.dark);

    } else {
        sphere(character, 0, headY, -0.04, 0.43, 0.42, 0.37, main);

        // Ko‘zlar
        eyes(2.02, -0.385, 0.15);

        // Quloqlar
        if (type === 'bear') {
            sphere(character, -0.34, 2.28, -0.02, 0.17, 0.18, 0.14, main);
            sphere(character, 0.34, 2.28, -0.02, 0.17, 0.18, 0.14, main);

            sphere(character, -0.34, 2.28, -0.14, 0.09, 0.10, 0.035, mat.pink);
            sphere(character, 0.34, 2.28, -0.14, 0.09, 0.10, 0.035, mat.pink);

            sphere(character, 0, 1.87, -0.39, 0.24, 0.17, 0.12, mat.cream);
            sphere(character, 0, 1.93, -0.50, 0.065, 0.05, 0.035, mat.dark);
            cheeks(1.91, -0.40, mat.pink);
        }

        if (type === 'fox') {
            cone(character, -0.27, 2.40, -0.02, 0.18, 0.55, main);
            cone(character, 0.27, 2.40, -0.02, 0.18, 0.55, main);

            sphere(character, -0.27, 2.39, -0.12, 0.08, 0.19, 0.035, mat.cream);
            sphere(character, 0.27, 2.39, -0.12, 0.08, 0.19, 0.035, mat.cream);

            sphere(character, 0, 1.88, -0.39, 0.24, 0.16, 0.13, mat.cream);
            sphere(character, 0, 1.94, -0.51, 0.06, 0.045, 0.035, mat.dark);
            cheeks(1.91, -0.40, mat.pink);
        }

        if (type === 'dinosaur') {
            sphere(character, 0, 1.87, -0.39, 0.27, 0.17, 0.15, main);
            sphere(character, -0.12, 1.91, -0.52, 0.035, 0.025, 0.02, mat.dark);
            sphere(character, 0.12, 1.91, -0.52, 0.035, 0.025, 0.02, mat.dark);

            // Orqa tomondagi mayda tikanlar
            for (let i = 0; i < 5; i++) {
                cone(
                    character,
                    0,
                    1.25 + i * 0.20,
                    0.32,
                    0.085,
                    0.18,
                    mat.orange
                );
            }

            cheeks(1.91, -0.40, mat.cream);
        }

        if (type === 'penguin') {
            cone(character, 0, 1.91, -0.49, 0.13, 0.20, mat.orange);
            sphere(character, -0.20, 2.25, -0.02, 0.10, 0.07, 0.08, mat.white);
            sphere(character, 0.20, 2.25, -0.02, 0.10, 0.07, 0.08, mat.white);
        }
    }

    // DUM
    if (type === 'fox') {
        const tail = sphere(character, 0, 0.93, 0.48,
            0.20, 0.22, 0.58, main);

        tail.rotation.x = -0.30;

        sphere(character, 0, 0.78, 0.93,
            0.17, 0.17, 0.19, mat.cream);
    }

    if (type === 'dinosaur') {
        const tail = cone(character, 0, 0.82, 0.63,
            0.22, 0.90, main);

        tail.rotation.x = -Math.PI / 2;
    }

    if (type === 'bear') {
        sphere(character, 0, 0.90, 0.39, 0.16, 0.16, 0.16, main);
    }

    // QO‘LLAR
    const leftArm = new THREE.Group();
    leftArm.position.set(-0.43, 1.48, 0);
    character.add(leftArm);

    const rightArm = new THREE.Group();
    rightArm.position.set(0.43, 1.48, 0);
    character.add(rightArm);

    const armMaterial = type === 'penguin' ? main : main;

    sphere(leftArm, 0, -0.22, 0, 0.15, 0.35, 0.16, armMaterial);
    sphere(rightArm, 0, -0.22, 0, 0.15, 0.35, 0.16, armMaterial);

    sphere(leftArm, 0, -0.46, -0.015, 0.14, 0.13, 0.14,
        type === 'robot' ? mat.robot : main);

    sphere(rightArm, 0, -0.46, -0.015, 0.14, 0.13, 0.14,
        type === 'robot' ? mat.robot : main);

    // PINGVIN QANOTLARI
    if (type === 'penguin') {
        leftArm.rotation.z = 0.25;
        rightArm.rotation.z = -0.25;
    }

    // ROBOT QO‘L DETALLARI
    if (type === 'robot') {
        sphere(leftArm, 0, -0.25, -0.10, 0.07, 0.07, 0.04, mat.blue);
        sphere(rightArm, 0, -0.25, -0.10, 0.07, 0.07, 0.04, mat.blue);
    }

    // OYOQLAR
    const leftLeg = new THREE.Group();
    leftLeg.position.set(-0.20, 0.55, 0);
    character.add(leftLeg);

    const rightLeg = new THREE.Group();
    rightLeg.position.set(0.20, 0.55, 0);
    character.add(rightLeg);

    const legMaterial = type === 'penguin' ? mat.dark : main;

    sphere(leftLeg, 0, -0.20, 0, 0.14, 0.31, 0.15, legMaterial);
    sphere(rightLeg, 0, -0.20, 0, 0.14, 0.31, 0.15, legMaterial);

    // OYOQ PANJALARI
    const footMaterial =
        type === 'penguin' || type === 'dinosaur'
            ? mat.orange
            : type === 'robot'
                ? mat.robot
                : main;

    sphere(character, -0.20, 0.14, -0.12,
        0.17, 0.11, 0.25, footMaterial);

    sphere(character, 0.20, 0.14, -0.12,
        0.17, 0.11, 0.25, footMaterial);

    // ROBOT OYOQ BO‘G‘IMLARI
    if (type === 'robot') {
        sphere(character, -0.20, 0.49, 0, 0.16, 0.13, 0.16, mat.dark);
        sphere(character, 0.20, 0.49, 0, 0.16, 0.13, 0.16, mat.dark);
    }

    // QAHRA MON JOYLASHUVI
    character.position.set(0, 0, 10);

    // YURISH ANIMATSIYASI UCHUN QISMLAR
    character.userData.parts = {
        leftArm,
        rightArm,
        leftLeg,
        rightLeg
    };

    return character;
}

// ==========================================
// 19. MUZEYGA KIRISH
// ==========================================

startMuseumButton.addEventListener('click', () => {
    if (!selectedCharacter) return;

    if (player) {
        scene.remove(player);
    }

    player = createCharacter(selectedCharacter);
    playerParts = player.userData.parts;

    scene.add(player);

    cameraOrbit = 0;
    cameraPitch = 0.22;
    camera.position.set(0, 4, 15);
    camera.lookAt(0, 1.5, 10);

    characterSelector.style.display = 'none';
});


// ==========================================
// 20. QAHRAMON VA KAMERA BOSHQARUVI
// ==========================================

const pressedKeys = {};

window.addEventListener('keydown', event => {
    const key = event.key.toLowerCase();

    if (
        ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ']
            .includes(key)
    ) {
        event.preventDefault();
    }

    pressedKeys[key] = true;
});

window.addEventListener('keyup', event => {
    pressedKeys[event.key.toLowerCase()] = false;
});

window.addEventListener('blur', () => {
    Object.keys(pressedKeys).forEach(key => {
        pressedKeys[key] = false;
    });
});

// Kamera sozlamalari
// Sichqoncha aylanishi qahramon burilishidan alohida
let cameraOrbit = 0;
let cameraPitch = 0.22;

const cameraDistance = 5.5;
const playerSpeed = 3.2;
const turnSpeed = 2.0;

const playerClock = new THREE.Clock();

let walkTime = 0;

const cameraTarget = new THREE.Vector3();
const cameraPosition = new THREE.Vector3();

let cameraDragging = false;
let cameraWasDragged = false;

let lastPointerX = 0;
let lastPointerY = 0;
let activePointerId = null;

renderer.domElement.style.touchAction = 'none';

// Sichqoncha yoki barmoq bosilganda
renderer.domElement.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    cameraDragging = true;
    cameraWasDragged = false;

    activePointerId = event.pointerId;

    lastPointerX = event.clientX;
    lastPointerY = event.clientY;

    renderer.domElement.setPointerCapture(event.pointerId);
});

// Sichqoncha yoki barmoq harakatlanganda
renderer.domElement.addEventListener('pointermove', event => {
    if (!cameraDragging || event.pointerId !== activePointerId) return;

    const deltaX = event.clientX - lastPointerX;
    const deltaY = event.clientY - lastPointerY;

    lastPointerX = event.clientX;
    lastPointerY = event.clientY;

    if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
        cameraWasDragged = true;
    }

    // Faqat kamera aylanadi
    // Qahramonning rotation qiymati o'zgartirilmaydi
    cameraOrbit -= deltaX * 0.002;

   cameraPitch += deltaY * 0.002;

    cameraPitch = THREE.MathUtils.clamp(
        cameraPitch,
        -0.15,
        0.75
    );
});

// Sichqoncha yoki barmoq qo'yib yuborilganda
function stopCameraDragging(event) {
    if (event.pointerId !== activePointerId) return;

    cameraDragging = false;
    activePointerId = null;

    if (cameraWasDragged) {
        window.setTimeout(() => {
            cameraWasDragged = false;
        }, 250);
    }
}

renderer.domElement.addEventListener(
    'pointerup',
    stopCameraDragging
);

renderer.domElement.addEventListener(
    'pointercancel',
    stopCameraDragging
);


// ==========================================
// 21. QAHRAMON HARAKATI VA KAMERA
// ==========================================

function updatePlayer() {
    const delta = Math.min(playerClock.getDelta(), 0.05);

    if (!player || artworkViewer.style.display === 'flex') return;

    // KLAVIATURA BOSHQARUVI

    let turn = 0;

    if (pressedKeys['a'] || pressedKeys['arrowleft']) turn += 1;
    if (pressedKeys['d'] || pressedKeys['arrowright']) turn -= 1;

// Joystick orqali burilish
    turn -= joystickX;

    // Qahramon joyida buriladi
    player.rotation.y += turn * turnSpeed * delta;

    // Oldinga va orqaga yurish
    let forward = 0;

    if (pressedKeys['w'] || pressedKeys['arrowup']) forward += 1;
    if (pressedKeys['s'] || pressedKeys['arrowdown']) forward -= 1;

// Joystick orqali yurish
    forward -= joystickY;

// Harakat qiymatini -1 va 1 oralig‘ida saqlash
    forward = THREE.MathUtils.clamp(forward, -1, 1);
    turn = THREE.MathUtils.clamp(turn, -1, 1);
    const moving = forward !== 0;

    if (moving) {
        // Qahramon qarab turgan yo'nalish
        const yaw = player.rotation.y;

        const forwardX = -Math.sin(yaw);
        const forwardZ = -Math.cos(yaw);

        player.position.x += forwardX * forward * playerSpeed * delta;
        player.position.z += forwardZ * forward * playerSpeed * delta;

        // Muzey chegaralari
        player.position.x = THREE.MathUtils.clamp(
            player.position.x,
            -ROOM_WIDTH / 2 + 1.5,
            ROOM_WIDTH / 2 - 1.5
        );

        player.position.z = THREE.MathUtils.clamp(
            player.position.z,
            -roomDepth / 2 + 1.5,
            roomDepth / 2 - 1.5
        );

        // Yurish animatsiyasi
        walkTime += delta * 9;

        const swing = Math.sin(walkTime) * 0.65;

        playerParts.leftLeg.rotation.x = swing;
        playerParts.rightLeg.rotation.x = -swing;

        playerParts.leftArm.rotation.x = -swing * 0.65;
        playerParts.rightArm.rotation.x = swing * 0.65;

        player.position.y = Math.abs(
            Math.sin(walkTime * 2)
        ) * 0.035;

    } else {

        // To'xtaganda animatsiyani tinchlantirish
        player.position.y = THREE.MathUtils.lerp(
            player.position.y, 0, delta * 10
        );

        playerParts.leftLeg.rotation.x = THREE.MathUtils.lerp(
            playerParts.leftLeg.rotation.x, 0, delta * 8
        );

        playerParts.rightLeg.rotation.x = THREE.MathUtils.lerp(
            playerParts.rightLeg.rotation.x, 0, delta * 8
        );

        playerParts.leftArm.rotation.x = THREE.MathUtils.lerp(
            playerParts.leftArm.rotation.x, 0, delta * 8
        );

        playerParts.rightArm.rotation.x = THREE.MathUtils.lerp(
            playerParts.rightArm.rotation.x, 0, delta * 8
        );
    }

// KLAVIATURA YOKI JOYSTICK ISHLAGANDA KAMERA QAYTADI

    const keyboardActive =
        pressedKeys['w'] ||
        pressedKeys['s'] ||
        pressedKeys['a'] ||
        pressedKeys['d'] ||
        pressedKeys['arrowup'] ||
        pressedKeys['arrowdown'] ||
        pressedKeys['arrowleft'] ||
        pressedKeys['arrowright'] ||
        Math.abs(joystickX) > 0.1 ||
        Math.abs(joystickY) > 0.1;

    if (keyboardActive) {
        cameraOrbit = THREE.MathUtils.damp(
            cameraOrbit,
            0,
            5,
            delta
        );
    }

// Kamera qahramon orqasidan ergashadi
    const yawNow = player.rotation.y + cameraOrbit;

    const horizontalDistance =
        cameraDistance * Math.cos(cameraPitch);

    const verticalDistance =
        cameraDistance * Math.sin(cameraPitch);

    cameraTarget.set(
        player.position.x,
        player.position.y + 1.4,
        player.position.z
    );

    cameraPosition.set(
        player.position.x + Math.sin(yawNow) * horizontalDistance,
        player.position.y + 1.4 + verticalDistance,
        player.position.z + Math.cos(yawNow) * horizontalDistance
    );

    camera.position.lerp(
        cameraPosition,
        Math.min(delta * 6, 1)
    );

    camera.lookAt(cameraTarget);
}

// ==========================================
// 21. QAHRAMON ANIMATSIYASI
// ==========================================

function animatePlayer() {
    requestAnimationFrame(animatePlayer);

    updatePlayer();
}

animatePlayer();

console.log('5 ta qahramon tanlash va yurish tizimi tayyor!');
