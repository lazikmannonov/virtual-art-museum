
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
// 2. RENDERER
// ==========================================

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

document.getElementById('museum').appendChild(renderer.domElement);

// ==========================================
// 3. MATERIALLAR
// ==========================================

const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0xe8e5dc,
    roughness: 0.32
});

const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0xf8f6f0,
    roughness: 0.85
});

const ceilingMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.9
});

// ==========================================
// 4. POL
// ==========================================

const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(24, 32),
    floorMaterial
);

floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;

scene.add(floor);

// ==========================================
// 5. DEVORLAR
// ==========================================

function createWall(width, height, x, y, z, rotationY = 0) {

    const wall = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, 0.3),
        wallMaterial
    );

    wall.position.set(x, y, z);
    wall.rotation.y = rotationY;
    wall.receiveShadow = true;

    scene.add(wall);
}

// Orqa devor
createWall(24, 8, 0, 4, -16);

// Chap devor
createWall(32, 8, -12, 4, 0, Math.PI / 2);

// O'ng devor
createWall(32, 8, 12, 4, 0, Math.PI / 2);

// Old devor
createWall(24, 8, 0, 4, 16);

// ==========================================
// 6. SHIFT
// ==========================================

const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(24, 32),
    ceilingMaterial
);

ceiling.rotation.x = Math.PI / 2;
ceiling.position.y = 8;

scene.add(ceiling);

// ==========================================
// 7. UMUMIY YORITISH
// ==========================================

const ambientLight = new THREE.HemisphereLight(
    0xffffff,
    0xc9c2b5,
    2
);

scene.add(ambientLight);

const mainLight = new THREE.DirectionalLight(
    0xffffff,
    2.2
);

mainLight.position.set(-5, 12, 8);
mainLight.castShadow = true;

scene.add(mainLight);

// Shift chiroqlari
for (let x = -8; x <= 8; x += 8) {

    for (let z = -10; z <= 10; z += 10) {

        const light = new THREE.SpotLight(
            0xffffff,
            55,
            20,
            Math.PI / 5,
            0.5,
            1.5
        );

        light.position.set(x, 7.5, z);
        light.target.position.set(x, 0, z);

        scene.add(light);
        scene.add(light.target);
    }
}

// ==========================================
// 8. NAMUNAVIY SURATLAR
// ==========================================

function createArtworkTexture(number) {

    // Turli shakldagi namunaviy suratlar
    const formats = [
        [512, 384], // Gorizontal
        [384, 512], // Vertikal
        [512, 512], // Kvadrat
        [600, 400], // Gorizontal
        [400, 600]  // Vertikal
    ];

    const [width, height] = formats[number % formats.length];

    const canvas = document.createElement('canvas');

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');

    const palettes = [
        ['#343B43', '#B38A60', '#D6B98D'],
        ['#8A6C55', '#D6C1A1', '#414B45'],
        ['#343E50', '#B7A18A', '#D6C7AE'],
        ['#76604C', '#D7C4A7', '#A8A08C'],
        ['#3E4744', '#B99A75', '#E0D5C3']
    ];

    const colors = palettes[number % palettes.length];

    const cx = width / 2;
    const cy = height / 2;

    const radius = Math.min(width, height) * 0.28;

    // Fon
    ctx.fillStyle = '#E9E2D5';
    ctx.fillRect(0, 0, width, height);

    // Asosiy shakl
    ctx.fillStyle = colors[0];

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    // Ikkinchi shakl
    ctx.fillStyle = colors[1];

    ctx.beginPath();

    ctx.ellipse(
        cx,
        cy,
        radius * 0.65,
        radius * 1.15,
        0.6,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // Uchinchi shakl
    ctx.fillStyle = colors[2];

    ctx.beginPath();

    ctx.arc(
        cx + radius * 0.65,
        cy - radius * 0.65,
        radius * 0.4,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // Pastki qism
    ctx.fillStyle = '#F0E9DC';

    ctx.beginPath();
    ctx.moveTo(0, height * 0.81);
    ctx.lineTo(width, height * 0.68);
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.fill();

    // Surat raqami
    ctx.fillStyle = '#554A3D';

    ctx.font = `${Math.max(12, width * 0.035)}px Georgia`;

    ctx.fillText(
        'ART COLLECTION / ' + (number + 1),
        width * 0.05,
        height * 0.92
    );

    const texture = new THREE.CanvasTexture(canvas);

    texture.colorSpace = THREE.SRGBColorSpace;

    return texture;
}

// ==========================================
// 9. RAMKA VA SURAT YARATISH
// ==========================================

function createArtwork(
    x,
    y,
    z,
    rotationY,
    number,
    texture = createArtworkTexture(number)
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
        22,
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
// 10. SURATLARNI DEVORLARGA JOYLASHTIRISH
// ==========================================

let artworkNumber = 0;

// Orqa devor
for (const x of [-7, 0, 7]) {

    createArtwork(
        x,
        4.2,
        -15.78,
        0,
        artworkNumber++
    );
}

// Chap devor
for (const z of [-11, -4, 4, 11]) {

    createArtwork(
        -11.78,
        4.2,
        z,
        Math.PI / 2,
        artworkNumber++
    );
}

// O'ng devor
for (const z of [-11, -4, 4, 11]) {

    createArtwork(
        11.78,
        4.2,
        z,
        -Math.PI / 2,
        artworkNumber++
    );
}

console.log('11 ta namunaviy surat yaratildi!');

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

// ==========================================
// 14. SURATNI BOSISH ORQALI ANIQLASH
// ==========================================

const raycaster = new THREE.Raycaster();

const pointer = new THREE.Vector2();

renderer.domElement.addEventListener('click', (event) => {
    if (cameraWasDragged) {
        cameraWasDragged = false;
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

    if (selectedPicture) {

        openArtwork(selectedPicture.object);
    }
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
// 17. QAHRAMON TANLASH OYNASI
// ==========================================

const characterSelector = document.createElement('div');

characterSelector.id = 'characterSelector';

characterSelector.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 20000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: rgba(20, 20, 20, 0.94);
    font-family: Arial, sans-serif;
`;

characterSelector.innerHTML = `
    <div style="
        width: 100%;
        max-width: 850px;
        text-align: center;
        color: white;
    ">
        <div style="
            color: #c9b99b;
            font-size: 12px;
            letter-spacing: 4px;
            margin-bottom: 15px;
        ">VIRTUAL ART MUSEUM</div>

        <h1 style="
            font-size: clamp(25px, 5vw, 40px);
            margin-bottom: 12px;
        ">Sayohatingizni boshlang</h1>

        <p style="
            color: #bdbdbd;
            margin-bottom: 30px;
        ">O‘zingizga yoqqan qahramonni tanlang</p>

        <div id="characterOptions" style="
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(125px, 1fr));
            gap: 14px;
        "></div>

        <button id="startMuseum" disabled style="
            margin-top: 30px;
            padding: 15px 42px;
            border: 0;
            border-radius: 5px;
            background: #c9b99b;
            color: #211e19;
            font-size: 15px;
            font-weight: bold;
            cursor: pointer;
            opacity: 0.45;
        ">Muzeyga kirish</button>
    </div>
`;

document.body.appendChild(characterSelector);

const characterTypes = [
    { id: 'dinosaur', name: 'Dinozavr', color: '#6b9b67' },
    { id: 'fox', name: 'Tulki', color: '#d77d38' },
    { id: 'penguin', name: 'Pingvin', color: '#566b80' },
    { id: 'robot', name: 'Robot', color: '#aeb8c2' },
    { id: 'bear', name: 'Ayiq', color: '#98704e' }
];

let selectedCharacter = null;

const characterOptions = document.getElementById('characterOptions');
const startMuseumButton = document.getElementById('startMuseum');

characterTypes.forEach(character => {
    const button = document.createElement('button');

    button.style.cssText = `
        padding: 20px 10px;
        border: 1px solid #555;
        border-radius: 9px;
        background: #292929;
        color: white;
        cursor: pointer;
        transition: 0.2s;
    `;

    button.innerHTML = `
        <div style="
            width: 65px;
            height: 65px;
            margin: 0 auto 13px;
            border-radius: 50%;
            background: ${character.color};
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 25px;
            font-weight: bold;
        ">${character.name.charAt(0)}</div>

        <div style="font-size: 14px; font-weight: bold;">
            ${character.name}
        </div>
    `;

    button.addEventListener('click', () => {
        selectedCharacter = character.id;

        document.querySelectorAll('#characterOptions button')
            .forEach(item => {
                item.style.borderColor = '#555';
                item.style.background = '#292929';
            });

        button.style.borderColor = '#c9b99b';
        button.style.background = '#403a30';

        startMuseumButton.disabled = false;
        startMuseumButton.style.opacity = '1';
    });

    characterOptions.appendChild(button);
});

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

    cameraPitch -= deltaY * 0.002;

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

    // Qahramon joyida buriladi
    player.rotation.y += turn * turnSpeed * delta;

    // Oldinga va orqaga yurish
    let forward = 0;

    if (pressedKeys['w'] || pressedKeys['arrowup']) forward += 1;
    if (pressedKeys['s'] || pressedKeys['arrowdown']) forward -= 1;

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
            player.position.x, -10.5, 10.5
        );

        player.position.z = THREE.MathUtils.clamp(
            player.position.z, -14.5, 14.5
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

    // KLAVIATURA BOSHLANGANDA KAMERA QAHRA MON ORQASIGA QAYTADI

    const keyboardActive =
        pressedKeys['w'] ||
        pressedKeys['s'] ||
        pressedKeys['a'] ||
        pressedKeys['d'] ||
        pressedKeys['arrowup'] ||
        pressedKeys['arrowdown'] ||
        pressedKeys['arrowleft'] ||
        pressedKeys['arrowright'];

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
