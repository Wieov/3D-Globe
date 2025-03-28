////////////////////////////
// 1. Инициализация сцены и загрузчика текстур
////////////////////////////
const scene = new THREE.Scene();
const textureLoader = new THREE.TextureLoader();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ 
    canvas: document.getElementById('globe'),
    antialias: true 
});
renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.z = 12;

////////////////////////////
// 2. Загрузка всех текстур (исправленная версия)
////////////////////////////
let earthTexture, dataTexture, backgroundTexture;

// Загрузка фоновой текстуры с обработкой
textureLoader.load(backgroundTexturePath, 
    (texture) => {
        const bgGeometry = new THREE.SphereGeometry(500, 60, 60);
        const bgMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.BackSide
        });
        scene.add(new THREE.Mesh(bgGeometry, bgMaterial));
    },
    undefined,
    (err) => console.error('Ошибка загрузки фона:', err)
);

// Загрузка основной текстуры Земли с обновлением материала
textureLoader.load(earthTexturePath,
    (texture) => {
        earthTexture = texture;
        globeMaterial.map = texture; // Обновляем материал после загрузки
        globeMaterial.needsUpdate = true;
    },
    undefined,
    (err) => console.error('Ошибка загрузки текстуры Земли:', err)
);

// Загрузка dataTexture с проверкой
textureLoader.load(dataTexturePath,
    (texture) => {
        dataTexture = texture;
        dataTexture.needsUpdate = true;
    },
    undefined,
    (err) => console.error('Ошибка загрузки dataTexture:', err)
);

////////////////////////////
// 3. Создание глобуса (исправлено)
////////////////////////////
const globeGeometry = new THREE.SphereGeometry(5, 64, 64);
const globeMaterial = new THREE.MeshPhongMaterial({
    specular: 0x222222,
    shininess: 10
});
const globe = new THREE.Mesh(globeGeometry, globeMaterial);
scene.add(globe);

////////////////////////////
// 4. Шейдерное свечение (оптимизировано)
////////////////////////////
const glowGeometry = new THREE.SphereGeometry(5.05, 64, 64);
const glowMaterial = new THREE.ShaderMaterial({
    uniforms: {
        c: { value: 1.2 },
        p: { value: 2.5 },
        glowColor: { value: new THREE.Color(0x00ffff) },
        viewVector: { value: new THREE.Vector3() }
    },
    vertexShader: `
        uniform vec3 viewVector;
        uniform float c;
        uniform float p;
        varying float intensity;
        
        void main() {
            vec3 vNormal = normalize(normalMatrix * normal);
            vec3 vNormel = normalize(normalMatrix * viewVector);
            intensity = pow(c - dot(vNormal, vNormel), p);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        precision highp float;
        uniform vec3 glowColor;
        varying float intensity;
        
        void main() {
            vec3 glow = glowColor * intensity;
            gl_FragColor = vec4(glow, intensity * 0.8);
        }
    `,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true
});

const glow = new THREE.Mesh(glowGeometry, glowMaterial);
scene.add(glow);

////////////////////////////
// 5. Освещение и управление
////////////////////////////
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

////////////////////////////
// 6. Анимация (исправлено)
////////////////////////////
function animate() {
    requestAnimationFrame(animate);
    
    // Обновляем вектор направления камеры
    if (glowMaterial) {
        glowMaterial.uniforms.viewVector.value = 
            new THREE.Vector3().subVectors(camera.position, globe.position);
    }
    
    controls.update();
    renderer.render(scene, camera);
}
animate();

// Остальной код обработки кликов остается без изменений
// ... (Raycaster, функции работы с инфобоксом)

// Остальной код (работа с инфобоксом и т.д.) остается без изменений

////////////////////////////
// 5. Raycaster для определения клика
////////////////////////////
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

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
