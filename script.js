
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    75, 
    window.innerWidth / window.innerHeight, 
    0.1, 
    1000
);

const renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById('globe')
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.z = 10;


const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.rotateSpeed = 0.5;
controls.enableZoom = true;


const textureLoader = new THREE.TextureLoader();

const backgroundTexture = textureLoader.load(backgroundTexturePath, (texture) => {
    console.log("Background texture загружена:", texture.image.width, texture.image.height);
});

const skyGeometry = new THREE.SphereGeometry(570, 60, 60);

const skyMaterial = new THREE.MeshBasicMaterial({
    map: backgroundTexture,
    side: THREE.BackSide  
});

const skySphere = new THREE.Mesh(skyGeometry, skyMaterial);
scene.add(skySphere);
const earthTexture = textureLoader.load(earthTexturePath);
const dataTexture = textureLoader.load(dataTexturePath, (texture) => {
    console.log("DataTexture загружена:", texture.image.width, texture.image.height);
});

const geometry = new THREE.SphereGeometry(10, 50, 50);
const material = new THREE.MeshBasicMaterial({ map: earthTexture });
const globe = new THREE.Mesh(geometry, material);
scene.add(globe);

scene.fog = new THREE.FogExp2(0x000000, 0.0015);


function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();


const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function rgbToHex(r, g, b) {
    return (
        "#" +
        ((1 << 24) | (r << 16) | (g << 8) | b)
            .toString(16)
            .slice(1)
            .toLowerCase()
    );
}

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


window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});


function closeInfoBox() {
    console.log("closeInfoBox вызвана");
    const infoBox = document.getElementById('infoBox');
    infoBox.classList.remove('show');
}

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
