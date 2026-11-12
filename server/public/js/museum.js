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

const isMobile =
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    window.matchMedia('(pointer: coarse)').matches;

const maxPixelRatio = isMobile ? 1.25 : 1.5;

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'default',
    alpha: false,
    stencil: false,
    depth: true,
    preserveDrawingBuffer: false
});

// Telefon va kompyuter uchun alohida aniqlik
renderer.setPixelRatio(
    Math.min(window.devicePixelRatio || 1, maxPixelRatio)
);

renderer.setSize(window.innerWidth, window.innerHeight);

// Telefonda soyalar o‘chiriladi
renderer.shadowMap.enabled = !isMobile;
renderer.shadowMap.type = THREE.PCFShadowMap;

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

document.getElementById('museum').appendChild(renderer.domElement);

// ==========================================
// TELEFON UCHUN LANDSCAPE REJIM
// ==========================================

const landscapeStyle = document.createElement('style');

landscapeStyle.textContent = `
    #landscapeNotice {
        position: fixed;
        inset: 0;
        z-index: 30000;
        display: none;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        padding: 25px;
        text-align: center;
        background: #eeeae0;
        color: #292720;
        font-family: Arial, sans-serif;
    }

    .landscape-icon {
        font-size: 58px;
        margin-bottom: 25px;
        animation: rotatePhone 2s ease-in-out infinite;
    }

    #landscapeNotice h2 {
        font-size: 23px;
        margin: 0 0 12px;
    }

    #landscapeNotice p {
        color: #817b6e;
        font-size: 14px;
        line-height: 1.7;
        max-width: 300px;
    }

    @keyframes rotatePhone {
        0%, 100% { transform: rotate(0deg); }
        50% { transform: rotate(90deg); }
    }
`;

document.head.appendChild(landscapeStyle);

const landscapeNotice = document.createElement('div');
landscapeNotice.id = 'landscapeNotice';

landscapeNotice.innerHTML = `
    <div class="landscape-icon">📱</div>
    <h2>Telefonni aylantiring</h2>
    <p>
        Virtual muzeydan qulay foydalanish uchun
        telefoningizni gorizontal holatga o'tkazing.
    </p>
`;

document.body.appendChild(landscapeNotice);

function updateLandscapeMode() {
    const portrait = window.matchMedia(
        '(orientation: portrait)'
    ).matches;

    landscapeNotice.style.display =
        isMobile && portrait ? 'flex' : 'none';
}

updateLandscapeMode();

window.addEventListener('orientationchange', updateLandscapeMode);
window.addEventListener('resize', updateLandscapeMode);

// ==========================================
// STUDIYA MUHITI (aks-sado va yumshoq yorug‘lik)
// Qo‘shimcha import kerak emas
// ==========================================

function createStudioEnvironment(targetRenderer) {
    const envScene = new THREE.Scene();

    // Xona: ichidan ko‘rinadigan iliq kulrang quti
    const room = new THREE.Mesh(
        new THREE.BoxGeometry(24, 14, 24),
        new THREE.MeshBasicMaterial({
            color: new THREE.Color(0xb9b3a6),
            side: THREE.BackSide
        })
    );
    room.position.y = 7;
    envScene.add(room);

    // Yorug‘ panellar
    function lightPanel(w, h, x, y, z, intensity) {
        const material = new THREE.MeshBasicMaterial({
            side: THREE.DoubleSide
        });
        material.color.setScalar(intensity);

        const mesh = new THREE.Mesh(
            new THREE.PlaneGeometry(w, h),
            material
        );

        mesh.position.set(x, y, z);
        mesh.lookAt(0, 3, 0);
        envScene.add(mesh);
    }

    lightPanel(12, 12, 0, 13.5, 0, 9);   // tepadan katta yorug‘lik
    lightPanel(6, 8, -10, 6, 4, 6);      // chap yon
    lightPanel(6, 8, 10, 6, 4, 4);       // o‘ng yon
    lightPanel(10, 5, 0, 5, -11, 3);     // orqa yorug‘lik (kontur)

    const pmrem = new THREE.PMREMGenerator(targetRenderer);
    const target = pmrem.fromScene(envScene, 0.04);
    pmrem.dispose();

    envScene.traverse(object => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) object.material.dispose();
    });

    return target.texture;
}

// Muhit akslarini faqat kompyuterda hisoblash
if (!isMobile) {
    scene.environment = createStudioEnvironment(renderer);
    scene.environmentIntensity = 0.3;
}

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
// Spotlight chiroqlar faqat kompyuterda ishlaydi.
// Telefonda ortiqcha grafik yuk kamaytiriladi.

if (!isMobile) {
    const lightStep = Math.max(10, roomDepth / 4);

    for (let x = -8; x <= 8; x += 8) {
        let lightCount = 0;

        for (
            let z = -roomDepth / 2 + 6;
            z <= roomDepth / 2 - 6 && lightCount < 4;
            z += lightStep, lightCount++
        ) {
            const light = new THREE.SpotLight(
                0xffffff, 9, 20,
                Math.PI / 5, 0.65, 1.5
            );

            light.castShadow = false;

            light.position.set(x, 7.5, z);
            light.target.position.set(x, 0, z);

            scene.add(light);
            scene.add(light.target);

            ceilingLights.push(light);
        }
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
// (muhit yorug‘ligi qo‘shilgani uchun 1.15 dan pasaytirildi)
const ambientLight = new THREE.HemisphereLight(
    0xffffff,
    0xd4cbbb,
    1.05
);

scene.add(ambientLight);

// ASOSIY YUMSHOQ YORUG‘LIK
const mainLight = new THREE.DirectionalLight(
    0xfff8eb,
    1.8
);

mainLight.position.set(-5, 12, 8);

mainLight.castShadow = !isMobile;

if (!isMobile) {
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
}

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
  const maxWidth = 2.9;
  const maxHeight = 2.2;

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

   // Surat chiroqlari faqat kompyuterda
if (!isMobile) {
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
}
    return group;
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
              8,
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

                       // Rasm ranglarini to‘g‘ri ko‘rsatish
                    texture.colorSpace = THREE.SRGBColorSpace;
 
                  texture.anisotropy = maxAnisotropy;

                  texture.generateMipmaps = true;
                  texture.minFilter = THREE.LinearMipmapLinearFilter;
                  texture.magFilter = THREE.LinearFilter;

                  texture.needsUpdate = true;

                  const originalWidth =
               texture.image.naturalWidth || texture.image.width;

                  const originalHeight =
               texture.image.naturalHeight || texture.image.height;

                  console.log('Rasm sifati:', {
                width: originalWidth,
               height: originalHeight,
               anisotropy: texture.anisotropy
            });
                        
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

    renderer.setPixelRatio(
        Math.min(
            window.devicePixelRatio || 1,
            maxPixelRatio
        )
    );

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

    updateLandscapeMode();
});
    
// ==========================================
// 16. 3D ANIMATSIYA
// ==========================================

// ==========================================
// OPTIMALLASHTIRILGAN ANIMATSIYA
// ==========================================

let lastFrameTime = 0;

const mobileFrameInterval = 1000 / 30;

const playerClock = new THREE.Clock();

function animate(timestamp = 0) {

    requestAnimationFrame(animate);

    // Telefonda 30 FPS
    if (
        isMobile &&
        timestamp - lastFrameTime < mobileFrameInterval
    ) {
        return;
    }

    lastFrameTime = timestamp;

    updatePlayer();

    renderer.render(scene, camera);
}

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
// HAQIQIY 3D MODELLAR (GLB) — bo‘lmasa avvalgi qahramonlar ishlaydi
// ==========================================

// Modellar /models/ papkasiga qo‘yiladi (public/models/fox.glb va hokazo)
// height  — qahramonning balandligi (zal o‘lchamiga mos ~2.4)
// rotationY — model qaysi tomonga qarasa shu qiymatni o‘zgartiring
//             (Math.PI — model orqasi bilan turgan bo‘lsa to‘g‘rilaydi, 0 — o‘zgarmaydi)
const CHARACTER_MODELS = {
    dinosaur: { url: '/models/dinosaur.glb', height: 2.4, rotationY: Math.PI },
    fox:      { url: '/models/fox.glb',      height: 2.4, rotationY: Math.PI },
    penguin:  { url: '/models/penguin.glb',  height: 2.4, rotationY: Math.PI },
    robot:    { url: '/models/robot.glb',    height: 2.6, rotationY: Math.PI },
    bear:     { url: '/models/bear.glb',     height: 2.5, rotationY: Math.PI }
};

const characterModelCache = {};
let modelToolsPromise = null;
let gltfLoader = null;
let skeletonUtils = null;

// Yuklagichlar alohida (dinamik) import qilinadi: fayllar yo‘q bo‘lsa sayt buzilmaydi
function getModelTools() {
    if (!modelToolsPromise) {
        modelToolsPromise = Promise.all([
            import('/three/examples/jsm/loaders/GLTFLoader.js'),
            import('/three/examples/jsm/utils/SkeletonUtils.js')
        ]).then(([gltfModule, skeletonModule]) => {
            gltfLoader = new gltfModule.GLTFLoader();
            skeletonUtils = skeletonModule;
            return true;
        }).catch(error => {
            console.warn(
                'GLB yuklagichlar topilmadi, oddiy qahramonlar ishlatiladi:',
                error
            );
            return false;
        });
    }

    return modelToolsPromise;
}

// Yurmayotgan qismlar uchun bo‘sh "soxta" bo‘g‘imlar
const dummyParts = {
    leftArm: new THREE.Object3D(),
    rightArm: new THREE.Object3D(),
    leftLeg: new THREE.Object3D(),
    rightLeg: new THREE.Object3D()
};

// idle / walk animatsiyasini almashtirish
function setCharacterAction(character, name) {
    const anim = character.userData.anim;

    if (!anim) return;

    const wanted = anim.actions[name];

    // Bu holat uchun animatsiya yo‘q bo‘lsa — mavjudini to‘xtatib/davom ettiramiz
    if (!wanted) {
        if (anim.current) anim.current.paused = (name === 'idle');
        return;
    }

    wanted.paused = false;

    if (anim.current === wanted) return;

    wanted.reset().fadeIn(0.2).play();

    if (anim.current) anim.current.fadeOut(0.2);

    anim.current = wanted;
}

// GLB modelni yuklab, o‘lchamini va yo‘nalishini tayyorlaydi.
// Model topilmasa null qaytaradi.
async function loadCharacterModel(type) {
    const config = CHARACTER_MODELS[type];

    if (!config) return null;

    const ready = await getModelTools();

    if (!ready) return null;

    if (!characterModelCache[type]) {
        characterModelCache[type] = gltfLoader
            .loadAsync(config.url)
            .catch(error => {
                console.warn(
                    config.url + ' yuklanmadi, oddiy qahramon ishlatiladi:',
                    error
                );
                return null;
            });
    }

    const gltf = await characterModelCache[type];

    if (!gltf) return null;

    // Skeletli modellarni ham to‘g‘ri nusxalash
    const model = skeletonUtils.clone(gltf.scene);

    model.traverse(object => {
       if (object.isMesh) {
    object.castShadow = !isMobile;
    object.receiveShadow = !isMobile;
    object.frustumCulled = true;
}
    });

    // O‘lchamni moslash
    model.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());

    if (size.y <= 0) return null;

    model.scale.multiplyScalar(config.height / size.y);
    model.updateMatrixWorld(true);

    // Oyoqlar polga, markaz koordinata boshiga
    const fitted = new THREE.Box3().setFromObject(model);
    const center = fitted.getCenter(new THREE.Vector3());

    model.position.x -= center.x;
    model.position.z -= center.z;
    model.position.y -= fitted.min.y;

    // Yo‘nalish (qahramon -Z tomonga qarashi kerak)
    const pivot = new THREE.Group();
    pivot.rotation.y = config.rotationY;
    pivot.add(model);

    const character = new THREE.Group();
    character.add(pivot);
    character.position.set(0, 0, 10);

    // Animatsiyalar
    const clips = gltf.animations || [];

    if (clips.length > 0) {
        const mixer = new THREE.AnimationMixer(model);

        const idleClip = clips.find(c => /idle|stand|breath|rest/i.test(c.name));
        const walkClip =
            clips.find(c => /walk/i.test(c.name)) ||
            clips.find(c => /run|trot|gallop|swim|fly/i.test(c.name));

        const actions = {};

        if (idleClip) actions.idle = mixer.clipAction(idleClip);
        if (walkClip) actions.walk = mixer.clipAction(walkClip);

        if (!actions.idle && !actions.walk) {
            actions.idle = mixer.clipAction(clips[0]);
        }

        const startAction = actions.idle || actions.walk;

        startAction.play();

        // Idle bo‘lmasa, yurish animatsiyasi birinchi kadrda to‘xtab turadi
        if (!actions.idle) startAction.paused = true;

        mixer.update(0);

        character.userData.anim = {
            mixer,
            actions,
            current: startAction
        };

        console.log(
            type + ' animatsiyalari:',
            clips.map(c => c.name).join(', ')
        );
    }

    return character;
}

// ==========================================
// 3D QAHRAMON RASMLARINI YARATISH
// ==========================================

async function generateCharacterPreviews() {
    let previewRenderer = null;
    let envTexture = null;

    try {
        previewRenderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,                  // shaffof fon
            preserveDrawingBuffer: true
        });

        // 300x240 ko‘rinish, haqiqiy piksel 600x480 (ravshanroq)
        previewRenderer.setPixelRatio(2);
        previewRenderer.setSize(300, 240);
        previewRenderer.outputColorSpace = THREE.SRGBColorSpace;
        previewRenderer.toneMapping = THREE.ACESFilmicToneMapping;
        previewRenderer.toneMappingExposure = 1.1;
        previewRenderer.setClearColor(0x000000, 0);

        previewRenderer.shadowMap.enabled = true;
        previewRenderer.shadowMap.type = THREE.PCFSoftShadowMap;

        const previewScene = new THREE.Scene();
        previewScene.background = null;

      if (!isMobile) {
    envTexture = createStudioEnvironment(previewRenderer);
    previewScene.environment = envTexture;
    previewScene.environmentIntensity = 0.9;
}
        const previewCamera = new THREE.PerspectiveCamera(
            35,
            300 / 240,
            0.1,
            100
        );

        // Qahramonning old tomonidan qarash
        previewCamera.position.set(0, 2.2, 5);
        previewCamera.lookAt(0, 1.2, 10);

        // Yumshoq umumiy yorug‘lik
        previewScene.add(
            new THREE.HemisphereLight(0xffffff, 0xd4cbbb, 0.6)
        );

        // Asosiy yorug‘lik va yumshoq soya
        const keyLight = new THREE.DirectionalLight(0xfff4e2, 2.2);
        keyLight.position.set(-3, 7, 5);
        keyLight.target.position.set(0, 1, 10);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.set(1024, 1024);
        keyLight.shadow.radius = 6;
        keyLight.shadow.bias = -0.0003;
        keyLight.shadow.normalBias = 0.02;
        keyLight.shadow.camera.left = -4;
        keyLight.shadow.camera.right = 4;
        keyLight.shadow.camera.top = 4;
        keyLight.shadow.camera.bottom = -4;
        keyLight.shadow.camera.near = 0.5;
        keyLight.shadow.camera.far = 30;
        previewScene.add(keyLight);
        previewScene.add(keyLight.target);

        // Qahramon ostidagi yumshoq soya
        const shadowFloor = new THREE.Mesh(
            new THREE.PlaneGeometry(10, 10),
            new THREE.ShadowMaterial({ opacity: 0.22 })
        );
        shadowFloor.rotation.x = -Math.PI / 2;
        shadowFloor.position.set(0, 0, 10);
        shadowFloor.receiveShadow = true;
        previewScene.add(shadowFloor);

        for (const type of characterTypes) {
            // Avval haqiqiy GLB model, bo‘lmasa oddiy qahramon
            let character = null;

            try {
                character = await loadCharacterModel(type.id);
            } catch (modelError) {
                console.warn(type.name + ' modeli yuklanmadi:', modelError);
            }

            const isModel = Boolean(character);

            if (!character) {
                character = createCharacter(type.id);
            }

            character.position.set(0, 0, 10);
            character.rotation.set(0, 0, 0);

            previewScene.add(character);

            previewRenderer.render(
                previewScene,
                previewCamera
            );

            const imageData =
                previewRenderer.domElement.toDataURL('image/png');

            const card = Array.from(characterOptions.children).find(item =>
                item.querySelector('.character-name')
                    ?.textContent.trim() === type.name
            );

            if (card) {
                const img = card.querySelector('.character-preview');

                img.onerror = () => {
                    console.error(type.name + ' rasmi ko‘rsatilmadi!');
                };

                img.src = imageData;
            }

            previewScene.remove(character);

            // Modelning geometriyasi keshda umumiy, shuning uchun uni tozalamaymiz
            if (!isModel) {
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
            }
        }

        console.log('5 ta qahramon rasmi yaratildi!');

    } catch (error) {
        console.error(
            'Qahramon rasmlarini yaratishda xatolik:',
            error
        );
    } finally {
        if (envTexture) envTexture.dispose();
        if (previewRenderer) previewRenderer.dispose();
    }
}

generateCharacterPreviews();

// ==========================================
// 18. QAHRAMON YARATISH
// ==========================================

let player = null;
let playerParts = null;


// Mo‘yna/teri uchun mayda g‘adir-budurlik (bump) teksturasi
var furNoiseTexture = null;

function getFurNoiseTexture() {
    if (furNoiseTexture) return furNoiseTexture;

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    const context = canvas.getContext('2d');
    const imageData = context.createImageData(size, size);

    for (let i = 0; i < size * size; i++) {
        const value = 100 + Math.random() * 110;

        imageData.data[i * 4] = value;
        imageData.data[i * 4 + 1] = value;
        imageData.data[i * 4 + 2] = value;
        imageData.data[i * 4 + 3] = 255;
    }

    context.putImageData(imageData, 0, 0);

    // Biroz xiralashtirish (donadorlik o‘rniga yumshoq tola ko‘rinishi uchun)
    const small = document.createElement('canvas');
    small.width = 128;
    small.height = 128;
    small.getContext('2d').drawImage(canvas, 0, 0, 128, 128);
    context.drawImage(small, 0, 0, size, size);

    furNoiseTexture = new THREE.CanvasTexture(canvas);
    furNoiseTexture.wrapS = THREE.RepeatWrapping;
    furNoiseTexture.wrapT = THREE.RepeatWrapping;
    furNoiseTexture.repeat.set(7, 4);
    furNoiseTexture.anisotropy = 4;

    return furNoiseTexture;
}

// Qahramon "terisi": uchlari rangli (vertex colors) bo‘lgani uchun
// qorin, yonoq va dum uchi yumshoq o‘tish bilan chiqadi
function makeToonSkin(kind, sheenHex) {
    const settings = {
        fur:     { roughness: 0.9,  sheen: 1,   sheenRoughness: 0.4, clearcoat: 0,    bump: 0.5  },
        feather: { roughness: 0.55, sheen: 0.6, sheenRoughness: 0.5, clearcoat: 0.25, bump: 0.15 },
        skin:    { roughness: 0.5,  sheen: 0.3, sheenRoughness: 0.6, clearcoat: 0.3,  bump: 0.25 },
        gloss:   { roughness: 0.22, sheen: 0,   sheenRoughness: 0.5, clearcoat: 1,    bump: 0    }
    }[kind];

    const material = new THREE.MeshPhysicalMaterial({
        vertexColors: true,
        roughness: settings.roughness,
        sheen: settings.sheen,
        sheenRoughness: settings.sheenRoughness,
        sheenColor: new THREE.Color(sheenHex),
        clearcoat: settings.clearcoat,
        clearcoatRoughness: 0.3,
        metalness: kind === 'gloss' ? 0.12 : 0
    });

    // Yumshoq "teri ostidagi" iliq yorug‘lik (multfilm ko‘rinishi)
    if (kind !== 'gloss') {
        material.emissive = new THREE.Color(sheenHex);
        material.emissiveIntensity = 0.05;
    }

   if (settings.bump > 0 && !isMobile) {
        material.bumpMap = getFurNoiseTexture();
        material.bumpScale = settings.bump;
    }

    return material;
}

function createCharacter(type) {
    const character = new THREE.Group();

    const palettes = {
        bear:     { base: 0xa86a3f, belly: 0xf1dcb8, pink: 0xf0a3a0, iris: 0x4a2a12, sheen: 0xffd9b0, lid: 0xa86a3f },
        fox:      { base: 0xea822c, belly: 0xfff1da, pink: 0xf5a89a, iris: 0xa4531a, sheen: 0xffd2a0, lid: 0xea822c, dark: 0x3d2416 },
        penguin:  { base: 0x1f2b3d, belly: 0xf8f6f0, pink: 0xf2a8a0, iris: 0x3a2312, sheen: 0x7f9bc0, lid: 0xf8f6f0, beak: 0xffa11f },
        dinosaur: { base: 0x62b84f, belly: 0xf2e6a6, pink: 0xf2a08a, iris: 0x3d2b0c, sheen: 0xc8f0a0, lid: 0x62b84f, spike: 0xffa733, tail: 0x86d06a },
        robot:    { base: 0xeef2f6, sheen: 0xffffff, joint: 0x4b535c }
    };

    const P = palettes[type];

    if (!P) {
        console.error('Noma’lum qahramon turi:', type);
        return character;
    }

    const kind = {
        bear: 'fur',
        fox: 'fur',
        penguin: 'feather',
        dinosaur: 'skin',
        robot: 'gloss'
    }[type];

    const skin = makeToonSkin(kind, P.sheen);

    const sides = [-1, 1];

    // Ikki tomonga aks ettirilgan dog‘lar (yonoq va h.k.)
    const mirrored = (dx, dy, dz, rest) =>
        sides.map(side => ({ dir: [dx * side, dy, dz], ...rest }));

    // ------------------------------------------
    // Oddiy materiallar
    // ------------------------------------------

    function glossy(color, roughness = 0.3, clearcoat = 1) {
        return new THREE.MeshPhysicalMaterial({
            color,
            roughness,
            clearcoat,
            clearcoatRoughness: 0.08
        });
    }

    const eyeWhite = glossy(0xffffff, 0.2, 1);
    const black = glossy(0x07080c, 0.05, 1);
    const noseMaterial = glossy(0x1a1214, 0.15, 1);
    const mouthMaterial = glossy(0x2a1612, 0.4, 0.2);
    const basicWhite = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const irisOuter = glossy(new THREE.Color(P.iris || 0x333333).multiplyScalar(0.55), 0.2, 1);
    const irisInner = glossy(P.iris || 0x333333, 0.2, 1);
    const lidMaterial = new THREE.MeshPhysicalMaterial({
        color: P.lid || 0xffffff,
        roughness: 0.9
    });
    const darkMetal = glossy(P.joint || 0x30343a, 0.35, 0.6);
    const glow = new THREE.MeshStandardMaterial({
        color: 0x1b6fa8,
        emissive: 0x4fc3ff,
        emissiveIntensity: 2.6,
        roughness: 0.4
    });

    // ------------------------------------------
    // Shakl yasash yordamchilari
    // ------------------------------------------

 
function ball(parent, x, y, z, sx, sy, sz, material) {
    const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(
            1,
            isMobile ? 16 : 32,
            isMobile ? 12 : 24
        ),
        material
    );

    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    mesh.castShadow = !isMobile;
    mesh.receiveShadow = !isMobile;
    parent.add(mesh);

    return mesh;
}

    // Rangli (gradient) ellipsoid: dog‘lar yumshoq o‘tadi
    function toonSphere(parent, x, y, z, sx, sy, sz, material, base, patches = []) {
       const geometry = new THREE.SphereGeometry(
                1,
              isMobile ? 24 : 56,
              isMobile ? 16 : 40
         );
        const position = geometry.attributes.position;
        const colors = new Float32Array(position.count * 3);

        const normal = new THREE.Vector3();
        const color = new THREE.Color();
        const baseColor = new THREE.Color(base);

        const prepared = patches.map(patch => ({
            dir: new THREE.Vector3(...patch.dir).normalize(),
            color: new THREE.Color(patch.color),
            size: patch.size,
            soft: patch.soft
        }));

        for (let i = 0; i < position.count; i++) {
            normal.set(
                position.getX(i),
                position.getY(i),
                position.getZ(i)
            ).normalize();

            color.copy(baseColor);

            for (const patch of prepared) {
                const amount = THREE.MathUtils.smoothstep(
                    normal.dot(patch.dir),
                    patch.size,
                    patch.size + patch.soft
                );

                color.lerp(patch.color, amount);
            }

            // Pastki qismni biroz qoraytirish (yumshoq soya ta’siri)
            const shade = 0.78 + 0.22 * THREE.MathUtils.smoothstep(normal.y, -0.9, 0.25);
            color.multiplyScalar(shade);

            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }

        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const mesh = new THREE.Mesh(geometry, material);

        mesh.position.set(x, y, z);
        mesh.scale.set(sx, sy, sz);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        parent.add(mesh);

        return mesh;
    }

    // Uchi boshqa rangga o‘tadigan konus (quloq, dum, tikan)
    function toonCone(parent, x, y, z, radius, height, rx, rz, flatten, base, tip) {
       const geometry = new THREE.ConeGeometry(
             radius,
             height,
             isMobile ? 12 : 40,
             isMobile ? 4 : 12
        );
        const position = geometry.attributes.position;
        const colors = new Float32Array(position.count * 3);

        const baseColor = new THREE.Color(base);
        const tipColor = new THREE.Color(tip);
        const color = new THREE.Color();

        for (let i = 0; i < position.count; i++) {
            const amount = THREE.MathUtils.smoothstep(
                position.getY(i),
                height * 0.15,
                height * 0.5
            );

            color.copy(baseColor).lerp(tipColor, amount);

            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }

        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const mesh = new THREE.Mesh(geometry, skin);

        mesh.position.set(x, y, z);
        mesh.rotation.set(rx, 0, rz);
        mesh.scale.z = flatten;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        parent.add(mesh);

        return mesh;
    }

    // Tabassum (yarim aylana)
    function smile(x, y, z, radius, material = mouthMaterial) {
        const mesh = new THREE.Mesh(
            new THREE.TorusGeometry(radius, radius * 0.14, 12, 32, Math.PI),
            material
        );

        mesh.position.set(x, y, z);
        mesh.rotation.z = Math.PI;
        parent_add(mesh);
    }

    function parent_add(mesh) {
        mesh.castShadow = false;
        character.add(mesh);
    }

    // Katta, jonli ko‘z: oq, ikki qavatli iris, qorachiq, ikkita yaltiroq nuqta va qovoq
    function addEye(x, y, z, scale = 1) {
        const eye = new THREE.Group();

        eye.position.set(x, y, z);
        eye.scale.setScalar(scale);

        ball(eye, 0, 0, 0, 0.15, 0.162, 0.14, eyeWhite);
        ball(eye, 0, -0.004, -0.12, 0.103, 0.11, 0.045, irisOuter);
        ball(eye, 0, -0.004, -0.128, 0.083, 0.09, 0.04, irisInner);
        ball(eye, 0, -0.004, -0.14, 0.05, 0.058, 0.03, black);

        // Yaltiroq nuqtalar
        ball(eye, -0.035, 0.045, -0.158, 0.026, 0.026, 0.012, basicWhite);
        ball(eye, 0.032, -0.04, -0.158, 0.013, 0.013, 0.012, basicWhite);

        // Yuqori qovoq (ko‘zni biroz mehribon qiladi)
        const lid = new THREE.Mesh(
            new THREE.SphereGeometry(0.16, 32, 16, 0, Math.PI * 2, 0, 0.82),
            lidMaterial
        );

        lid.scale.set(1, 1.01, 0.95);
        lid.castShadow = true;
        eye.add(lid);

        character.add(eye);
    }

    // ------------------------------------------
    // Tana va bosh dizayni
    // ------------------------------------------

    const design = {
        bear: {
            body: [0.48, 0.5, 0.4],
            bodyPatches: [{ dir: [0, -0.05, -1], size: 0.68, soft: 0.22, color: P.belly }],
            head: [0.6, 0.52, 0.52],
            headPatches: mirrored(0.62, -0.22, -0.75, { size: 0.88, soft: 0.08, color: P.pink })
        },
        fox: {
            body: [0.46, 0.5, 0.38],
            bodyPatches: [{ dir: [0, -0.05, -1], size: 0.72, soft: 0.2, color: P.belly }],
            head: [0.66, 0.5, 0.52],
            headPatches: [
                { dir: [0, -0.6, -0.75], size: 0.5, soft: 0.25, color: P.belly },
                ...mirrored(0.95, -0.2, -0.3, { size: 0.72, soft: 0.15, color: P.belly })
            ]
        },
        penguin: {
            body: [0.52, 0.58, 0.46],
            bodyPatches: [{ dir: [0, -0.1, -1], size: 0.38, soft: 0.3, color: P.belly }],
            head: [0.56, 0.5, 0.5],
            headPatches: mirrored(0.55, -0.1, -0.82, { size: 0.78, soft: 0.14, color: P.belly })
        },
        dinosaur: {
            body: [0.48, 0.52, 0.42],
            bodyPatches: [{ dir: [0, -0.05, -1], size: 0.6, soft: 0.25, color: P.belly }],
            head: [0.6, 0.52, 0.54],
            headPatches: mirrored(0.62, -0.22, -0.75, { size: 0.9, soft: 0.07, color: P.pink })
        },
        robot: {
            body: [0.46, 0.5, 0.4],
            bodyPatches: [],
            head: [0.62, 0.52, 0.52],
            headPatches: []
        }
    }[type];

    // Dum va tikanlar tanadan oldin (orqada) qo‘shiladi
    if (type === 'fox') {
        const tail = toonSphere(character, 0, 0.92, 0.62, 0.2, 0.22, 0.62, skin, P.base, [
            { dir: [0, 0, 1], size: 0.55, soft: 0.12, color: P.belly }
        ]);

        tail.rotation.x = -0.5;
    }

    if (type === 'bear') {
        toonSphere(character, 0, 0.88, 0.38, 0.15, 0.15, 0.15, skin, P.base);
    }

    if (type === 'penguin') {
        toonSphere(character, 0, 0.62, 0.42, 0.12, 0.07, 0.17, skin, P.base);
    }

    if (type === 'dinosaur') {
        // Yo‘g‘onlashib uchi ingichka dum
        toonCone(character, 0, 0.78, 0.66, 0.26, 0.95, Math.PI / 2 - 0.25, 0, 1, P.base, P.tail);

        // Orqa tikanlari
        const spikes = [
            [1.42, 0.25, 0.09],
            [1.24, 0.35, 0.085],
            [1.05, 0.4, 0.08],
            [0.86, 0.37, 0.07],
            [0.7, 0.3, 0.06]
        ];

        spikes.forEach(([sy, sz, radius]) => {
            toonCone(character, 0, sy, sz, radius, radius * 2.4, 0.95, 0, 1, P.spike, P.spike);
        });
    }

    // Tana
    toonSphere(character, 0, 1.02, 0, ...design.body, skin, P.base, design.bodyPatches);

    // Bosh
    toonSphere(character, 0, 1.82, -0.02, ...design.head, skin, P.base, design.headPatches);

    // ------------------------------------------
    // Yuz detallari
    // ------------------------------------------

    if (type === 'robot') {
        // Ko‘krak paneli va yorug‘ nuqta
        ball(character, 0, 1.05, -0.39, 0.22, 0.2, 0.04, black);
        ball(character, 0, 1.05, -0.425, 0.09, 0.09, 0.02, glow);

        // Yuz ekrani
        ball(character, 0, 1.83, -0.42, 0.42, 0.34, 0.14, black);

        // Ekrandagi ko‘zlar va tabassum
        for (const side of sides) {
            ball(character, side * 0.15, 1.87, -0.545, 0.065, 0.085, 0.02, glow);
        }

        const robotSmile = new THREE.Mesh(
            new THREE.TorusGeometry(0.07, 0.012, 12, 32, Math.PI),
            glow
        );

        robotSmile.position.set(0, 1.76, -0.545);
        robotSmile.rotation.z = Math.PI;
        character.add(robotSmile);

        // Quloq disklari
        for (const side of sides) {
            const ear = new THREE.Mesh(
                new THREE.CylinderGeometry(0.15, 0.15, 0.1, 32),
                darkMetal
            );

            ear.position.set(side * 0.62, 1.82, -0.02);
            ear.rotation.z = Math.PI / 2;
            ear.castShadow = true;
            character.add(ear);
        }

        // Antenna
        const stick = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.02, 0.22, 16),
            darkMetal
        );

        stick.position.set(0, 2.42, 0);
        character.add(stick);

        ball(character, 0, 2.57, 0, 0.07, 0.07, 0.07, glossy(0xd94d54, 0.3, 1));

    } else {
        const eyeX = { bear: 0.23, fox: 0.23, penguin: 0.2, dinosaur: 0.22 }[type];

        for (const side of sides) {
            addEye(side * eyeX, 1.87, -0.4);
        }
    }

    if (type === 'bear') {
        // Tumshuq
        toonSphere(character, 0, 1.66, -0.4, 0.25, 0.18, 0.19, skin, P.belly);
        ball(character, 0, 1.76, -0.585, 0.085, 0.06, 0.05, noseMaterial);
        smile(0, 1.655, -0.595, 0.07);

        // Quloqlar
        for (const side of sides) {
            toonSphere(character, side * 0.42, 2.2, -0.02, 0.19, 0.19, 0.14, skin, P.base);
            toonSphere(character, side * 0.42, 2.2, -0.12, 0.11, 0.11, 0.06, skin, P.pink);
        }
    }

    if (type === 'fox') {
        // Uzun tumshuq
        toonSphere(character, 0, 1.69, -0.45, 0.17, 0.13, 0.22, skin, P.belly);
        ball(character, 0, 1.71, -0.665, 0.065, 0.05, 0.05, noseMaterial);
        smile(0, 1.63, -0.64, 0.06);

        // Uchi qora, ichi och quloqlar
        for (const side of sides) {
            const tilt = -side * 0.2;

            toonCone(character, side * 0.3, 2.28, -0.02, 0.2, 0.6, 0, tilt, 0.55, P.base, P.dark);
            toonCone(character, side * 0.3, 2.26, -0.1, 0.12, 0.46, 0, tilt, 0.4, P.belly, P.belly);
        }
    }

    if (type === 'penguin') {
        // Tumshuq
        const beak = new THREE.Mesh(
            new THREE.ConeGeometry(0.1, 0.26, 32),
            glossy(P.beak, 0.35, 0.6)
        );

        beak.position.set(0, 1.74, -0.6);
        beak.rotation.x = -Math.PI / 2;
        beak.scale.z = 0.6;
        beak.castShadow = true;
        character.add(beak);
    }

    if (type === 'dinosaur') {
        // Yumaloq tumshuq va burun teshiklari
        toonSphere(character, 0, 1.7, -0.44, 0.3, 0.2, 0.22, skin, P.base, [
            { dir: [0, -1, -0.3], size: 0.5, soft: 0.3, color: P.belly }
        ]);

        for (const side of sides) {
            ball(character, side * 0.08, 1.77, -0.655, 0.03, 0.02, 0.015, noseMaterial);
        }

        smile(0, 1.63, -0.62, 0.12);

        // Bosh ustidagi kichik tikanlar
        [[2.33, -0.12], [2.34, 0.02], [2.24, 0.16]].forEach(([sy, sz]) => {
            toonCone(character, 0, sy, sz, 0.06, 0.16, 0.2, 0, 1, P.spike, P.spike);
        });
    }

    // ------------------------------------------
    // Qo‘llar
    // ------------------------------------------

    const leftArm = new THREE.Group();
    const rightArm = new THREE.Group();

    const armSetup = {
        bear:     { size: [0.15, 0.34, 0.16], spread: 0.2,  patches: [] },
        fox:      { size: [0.14, 0.33, 0.15], spread: 0.2,  patches: [{ dir: [0, -1, 0], size: 0.45, soft: 0.25, color: P.dark }] },
        penguin:  { size: [0.07, 0.36, 0.2],  spread: 0.45, patches: [] },
        dinosaur: { size: [0.12, 0.22, 0.13], spread: 0.25, patches: [] },
        robot:    { size: [0.13, 0.32, 0.14], spread: 0.15, patches: [] }
    }[type];

    [[leftArm, -1], [rightArm, 1]].forEach(([group, side]) => {
        group.position.set(side * 0.5, 1.3, 0);
        group.rotation.z = side * armSetup.spread;
        character.add(group);

        const [asx, asy, asz] = armSetup.size;

        toonSphere(group, 0, -asy * 0.75, 0, asx, asy, asz, skin, P.base, armSetup.patches);

        if (type === 'robot') {
            ball(group, 0, 0, 0, 0.11, 0.11, 0.11, darkMetal);
            ball(group, 0, -asy * 1.5, 0, 0.12, 0.12, 0.12, darkMetal);
        }
    });

    // ------------------------------------------
    // Oyoqlar
    // ------------------------------------------

    const leftLeg = new THREE.Group();
    const rightLeg = new THREE.Group();

    [[leftLeg, -1], [rightLeg, 1]].forEach(([group, side]) => {
        group.position.set(side * 0.22, 0.66, 0);
        character.add(group);

        if (type === 'penguin') {
            // Pingvin oyoqlari: faqat to‘q sariq yassi panjalar
            ball(group, 0, -0.6, -0.1, 0.22, 0.06, 0.32, glossy(P.beak, 0.4, 0.4));
            return;
        }

        const legPatches = type === 'fox'
            ? [{ dir: [0, -1, 0], size: 0.1, soft: 0.3, color: P.dark }]
            : [];

        if (type === 'robot') {
            ball(group, 0, -0.2, 0, 0.14, 0.28, 0.15, darkMetal);
            toonSphere(group, 0, -0.54, -0.1, 0.2, 0.12, 0.3, skin, P.base);
        } else {
            toonSphere(group, 0, -0.2, 0, 0.16, 0.28, 0.17, skin, P.base, legPatches);
            toonSphere(group, 0, -0.54, -0.1, 0.2, 0.12, 0.3, skin, type === 'fox' ? P.dark : P.base);
        }
    });

    // QAHRAMON JOYLASHUVI
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

startMuseumButton.addEventListener('click', async () => {
    if (!selectedCharacter || startMuseumButton.dataset.loading) return;

    startMuseumButton.dataset.loading = '1';

    const buttonLabel = startMuseumButton.textContent;
    startMuseumButton.textContent = 'YUKLANMOQDA...';
    startMuseumButton.disabled = true;

    let newPlayer = null;

    try {
        newPlayer = await loadCharacterModel(selectedCharacter);
    } catch (modelError) {
        console.warn('Model yuklanmadi:', modelError);
    }

    if (!newPlayer) {
        newPlayer = createCharacter(selectedCharacter);
    }

    if (player) {
        scene.remove(player);
    }

    player = newPlayer;
    playerParts = player.userData.parts || dummyParts;

    player.position.set(0, 0, 10);

    scene.add(player);

    cameraOrbit = 0;
    cameraPitch = 0.25;
    camera.position.set(0, 2.23, 13.71);
    camera.lookAt(0, 1.4, 10);

    characterSelector.style.display = 'none';

    startMuseumButton.textContent = buttonLabel;
    startMuseumButton.disabled = false;
    delete startMuseumButton.dataset.loading;
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
let cameraPitch = 0.70;

const cameraDistance = isMobile ? 3.5 : 7.5;
const playerSpeed = 3.2;
const turnSpeed = 2.0;

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

    // GLB modelning animatsiyasini yangilash
    if (player.userData.anim) {
        player.userData.anim.mixer.update(delta);
    }

    // KLAVIATURA BOSHQARUVI

    let turn = 0;

    if (pressedKeys['a'] || pressedKeys['arrowleft']) turn += 1;
    if (pressedKeys['d'] || pressedKeys['arrowright']) turn -= 1;

    // Joystick orqali burilish
    turn -= joystickX;

    // Harakat qiymatini -1 va 1 oralig‘ida saqlash
    turn = THREE.MathUtils.clamp(turn, -1, 1);

    // Qahramon joyida buriladi
    player.rotation.y += turn * turnSpeed * delta;

    // Oldinga va orqaga yurish
    let forward = 0;

    if (pressedKeys['w'] || pressedKeys['arrowup']) forward += 1;
    if (pressedKeys['s'] || pressedKeys['arrowdown']) forward -= 1;

    // Joystick orqali yurish
    forward -= joystickY;

    forward = THREE.MathUtils.clamp(forward, -1, 1);
    const moving = forward !== 0;

    // GLB modelda idle / walk animatsiyalarini almashtirish
    setCharacterAction(player, moving ? 'walk' : 'idle');

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

        // GLB modelda o‘z animatsiyasi bor, sakrash kerak emas
        player.position.y = Math.abs(
            Math.sin(walkTime * 2)
        ) * (player.userData.anim ? 0 : 0.035);

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
        player.position.y + 1.8,
        player.position.z
    );

    cameraPosition.set(
        player.position.x + Math.sin(yawNow) * horizontalDistance,
        player.position.y + 1.8 + verticalDistance,
        player.position.z + Math.cos(yawNow) * horizontalDistance
    );

    camera.position.lerp(
        cameraPosition,
        Math.min(delta * 6, 1)
    );

    camera.lookAt(cameraTarget);
}

console.log('5 ta qahramon tanlash va yurish tizimi tayyor!');

// ==========================================
// 22. MUZEY ANIMATSIYASINI ISHGA TUSHIRISH
// ==========================================

animate();

