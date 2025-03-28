////////////////////////////
// 1. Инициализация сцены
////////////////////////////
const scene = new THREE.Scene();
const textureLoader = new THREE.TextureLoader();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById('globe'),
    antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.z = 15;

////////////////////////////
// 2. Настройка тумана (исправлено)
////////////////////////////
scene.fog = new THREE.Fog(0x0a0a2a, 15, 50);

////////////////////////////
// 3. Загрузка текстур (добавлены проверки)
////////////////////////////
let earthTexture, dataTexture, backgroundTexture;

try {
    // Фон
    backgroundTexture = textureLoader.load(backgroundTexturePath, texture => {
        const bgGeometry = new THREE.SphereGeometry(500, 60, 60);
        const bgMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.BackSide
        });
        scene.add(new THREE.Mesh(bgGeometry, bgMaterial));
    });

    // Текстура Земли
    earthTexture = textureLoader.load(earthTexturePath, texture => {
        globeMaterial.map = texture;
        globeMaterial.needsUpdate = true;
    });

    // Data texture
    dataTexture = textureLoader.load(dataTexturePath);
} catch (e) {
    console.error('Texture loading error:', e);
}

////////////////////////////
// 4. Создание глобуса
////////////////////////////
const globeGeometry = new THREE.SphereGeometry(5, 64, 64);
const globeMaterial = new THREE.MeshPhongMaterial({
    specular: 0x222222,
    shininess: 15,
    fog: true
});
const globe = new THREE.Mesh(globeGeometry, globeMaterial);
scene.add(globe);

////////////////////////////
// 5. Шейдерное свечение (исправленные шейдеры)
////////////////////////////
const glowGeometry = new THREE.SphereGeometry(5.05, 64, 64);
const glowMaterial = new THREE.ShaderMaterial({
    uniforms: {
        c: { value: 1.2 },
        p: { value: 2.5 },
        glowColor: { value: new THREE.Color(0x00ffff) },
        fogColor: { value: scene.fog.color },
        fogNear: { value: scene.fog.near },
        fogFar: { value: scene.fog.far }
    },
    vertexShader: `
        varying vec3 vWorldPosition;
        varying float intensity;
        uniform float c;
        uniform float p;
        uniform vec3 viewVector;

        void main() {
            vec3 vNormal = normalize(normalMatrix * normal);
            vec3 vNormel = normalize(normalMatrix * viewVector);
            intensity = pow(c - dot(vNormal, vNormel), p);
            vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform vec3 glowColor;
        uniform vec3 fogColor;
        uniform float fogNear;
        uniform float fogFar;
        varying vec3 vWorldPosition;
        varying float intensity;

        void main() {
            float depth = length(vWorldPosition - cameraPosition);
            float fogFactor = smoothstep(fogNear, fogFar, depth);
            
            vec3 baseColor = glowColor * intensity;
            vec3 finalColor = mix(baseColor, fogColor, fogFactor);
            gl_FragColor = vec4(finalColor, intensity * 0.8);
        }
    `,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true
});

const glow = new THREE.Mesh(glowGeometry, glowMaterial);
scene.add(glow);

////////////////////////////
// 6. Освещение и управление
////////////////////////////
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 8;
controls.maxDistance = 60;

////////////////////////////
// 7. Анимация (исправлено)
////////////////////////////
function animate() {
    requestAnimationFrame(animate);

    // Динамическое обновление параметров тумана
    const fogFactor = Math.min(camera.position.z / 40, 1.0);
    scene.fog.near = 10 + fogFactor * 20;
    scene.fog.far = 30 + fogFactor * 40;

    // Обновление шейдера
    glowMaterial.uniforms.fogNear.value = scene.fog.near;
    glowMaterial.uniforms.fogFar.value = scene.fog.far;
    glowMaterial.uniforms.viewVector.value = 
        new THREE.Vector3().subVectors(camera.position, globe.position);

    controls.update();
    renderer.render(scene, camera);
}
animate();

////////////////////////////
// 8. Обработка кликов (остается без изменений)
////////////////////////////
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('click', event => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(globe);
    
    if (intersects.length > 0 && dataTexture?.image) {
        // ... ваша логика обработки кликов ...
    }
});

////////////////////////////
// 9. Обработка ресайза
////////////////////////////
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

////////////////////////////
// 10. Функции инфобокса (остаются без изменений)
////////////////////////////
// ... ваши функции showInfoBox, closeInfoBox и toggleCollapse ...
// Функция для преобразования RGB в HEX (в нижнем регистре)
function rgbToHex(r, g, b) {
    return (
        "#" +
        ((1 << 24) | (r << 16) | (g << 8) | b)
            .toString(16)
            .slice(1)
            .toLowerCase()
    );
}

// Объект с информацией о континентах
const continents = {
    "#ff7f27": { 
        name: "Азия", 
        population: "4.7 млрд", 
        area: "44.58 млн км²", 
        climate: "От арктического до тропического", 
        mainCities: "Токио, Пекин, Дели, Бангкок", 
        facts: "Здесь находятся самые высокие горы мира — Гималаи.", 
        description: "Самый большой и населённый континент." 
    },
    "#22b14c": { 
        name: "Европа", 
        population: "747 млн", 
        area: "10.18 млн км²", 
        climate: "Умеренный и субтропический", 
        mainCities: "Лондон, Париж, Берлин, Москва", 
        facts: "Европа включает 44 страны.", 
        description: "Континент с богатой историей и развитой экономикой." 
    },
    "#0000ff": { 
        name: "Африка", 
        population: "1.4 млрд", 
        area: "30.37 млн км²", 
        climate: "Тропический и субтропический", 
        mainCities: "Каир, Лагос, Найроби, Кейптаун", 
        facts: "Здесь находится самая длинная река в мире — Нил.", 
        description: "Второй по величине континент, богатый природными ресурсами." 
    },
    "#ffc90e": { 
        name: "Северная Америка", 
        population: "592 млн", 
        area: "24.71 млн км²", 
        climate: "От арктического до тропического", 
        mainCities: "Нью-Йорк, Лос-Анджелес, Торонто, Мехико", 
        facts: "Континент высокоразвитых стран с мощной экономикой.", 
        description: "Континент высокоразвитых стран." 
    },
    "#ed1c24": { 
        name: "Южная Америка", 
        population: "431 млн", 
        area: "17.84 млн км²", 
        climate: "Экваториальный, тропический", 
        mainCities: "Сан-Паулу, Буэнос-Айрес, Лима, Богота", 
        facts: "В Южной Америке находится самая длинная горная цепь — Анды.", 
        description: "Континент с уникальной природой и богатыми лесами." 
    },
    "#b97a57": { 
        name: "Австралия", 
        population: "26 млн", 
        area: "8.56 млн км²", 
        climate: "Субтропический и пустынный", 
        mainCities: "Сидней, Мельбурн, Брисбен, Перт", 
        facts: "Здесь находится самый большой коралловый риф в мире — Большой Барьерный риф.", 
        description: "Наименьший континент, окружённый океанами." 
    },
    "#00a2e8": { 
        name: "Антарктида", 
        population: "0", 
        area: "14 млн км²", 
        climate: "Полярный", 
        mainCities: "Исследовательские станции (Амундсен-Скотт, Мирный и др.)", 
        facts: "На континенте находится 70% пресной воды планеты.", 
        description: "Самый холодный континент, почти полностью покрытый льдом." 
    },
    "#ffffff": { 
        name: "Океан", 
        population: "1 (Тут только Патрик)", 
        area: "361 млн км²", 
        climate: "Морской", 
        mainCities: "Нет постоянных городов", 
        facts: "Океаны занимают 71% поверхности Земли и регулируют климат.", 
        description: "Огромные водные просторы, соединяющие континенты." 
    }
};


window.addEventListener('click', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(globe);
    
    if (intersects.length > 0 && dataTexture.image) {
        const uv = intersects[0].uv;
        
        // Инвертируем UV по оси Y
        const flippedY = 1 - uv.y;
        const x = Math.floor(uv.x * dataTexture.image.width);
        const y = Math.floor(flippedY * dataTexture.image.height);
        
        console.log(`UV: (${uv.x.toFixed(2)}, ${uv.y.toFixed(2)}) -> Пиксель: (${x}, ${y})`);
        
        const canvas = document.createElement('canvas');
        canvas.width = dataTexture.image.width;
        canvas.height = dataTexture.image.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(dataTexture.image, 0, 0);
        
        const pixel = ctx.getImageData(x, y, 1, 1).data;
        const colorKey = rgbToHex(pixel[0], pixel[1], pixel[2]);
        console.log("Определённый цвет:", colorKey);
        
        if (continents[colorKey]) {
            const continent = continents[colorKey];
            showInfoBox(continent);
        } else {
            document.getElementById('infoBox').classList.remove('show');
        }
    }
});

////////////////////////////
// 6. Обработка изменения размеров экрана
////////////////////////////
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

////////////////////////////
// Функции для управления информационным окном
////////////////////////////

// Функция закрытия окна
function closeInfoBox() {
    console.log("closeInfoBox вызвана");
    const infoBox = document.getElementById('infoBox');
    infoBox.classList.remove('show');
}

// Функция переключения сворачивания содержимого
function toggleCollapse() {
    console.log("toggleCollapse вызвана");
    const infoBox = document.getElementById('infoBox');
    const toggleBtn = document.getElementById('toggleBtn');
    infoBox.classList.toggle('collapsed');
    if (infoBox.classList.contains('collapsed')) {
        toggleBtn.textContent = 'Развернуть';
    } else {
        toggleBtn.textContent = 'Свернуть';
    }
}
// Функция показа окна с информацией
function showInfoBox(continentData) {
    console.log("showInfoBox вызвана с данными:", continentData);
    const infoBox = document.getElementById('infoBox');
    
    document.getElementById('continentName').textContent = continentData.name || "Нет данных";
    document.getElementById('continentPopulation').textContent = "Население: " + (continentData.population || "Нет данных");
    document.getElementById('continentArea').textContent = "Площадь: " + (continentData.area || "Нет данных");
    document.getElementById('continentClimate').textContent = "Климат: " + (continentData.climate || "Нет данных");
    document.getElementById('continentMainCities').textContent = "Главные города: " + (continentData.mainCities || "Нет данных");
    document.getElementById('continentFacts').textContent = "Интересный факт: " + (continentData.facts || "Нет данных");
    document.getElementById('continentDescription').textContent = continentData.description || "Нет данных";
    
    document.getElementById('toggleBtn').textContent = 'Развернуть';
    
    setTimeout(() => {
        infoBox.classList.add('show');
    }, 100);
}
textureLoader.load(
    earthTexturePath,
    undefined,
    undefined,
    (err) => console.error('Error loading texture:', err)
);
