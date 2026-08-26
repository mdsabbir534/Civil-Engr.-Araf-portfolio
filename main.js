document.addEventListener('DOMContentLoaded', () => {
    // 1. Mobile navigation drawer toggle
    const menuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (menuBtn && mobileMenu) {
        menuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // 2. Dynamic project showcase filtering
    const filterBtns = document.querySelectorAll('.filter-btn');
    const projectItems = document.querySelectorAll('.project-item');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => {
                b.classList.remove('active', 'bg-sky-600', 'text-white');
                b.classList.add('bg-slate-800', 'text-slate-300');
            });
            btn.classList.add('active', 'bg-sky-600', 'text-white');
            btn.classList.remove('bg-slate-800', 'text-slate-300');

            const filter = btn.getAttribute('data-filter');

            projectItems.forEach(item => {
                if (filter === 'all' || item.classList.contains(filter)) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });

    // 3. Handle contact form submission
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (event) => {
            event.preventDefault();
            alert('Thank you! Your project inquiry has been received.');
            contactForm.reset();
        });
    }

    // 4. Initialize 3D CAD/BIM Structural Viewer
    initBuilding3DViewer();
});

// ==========================================
// 3D CAD / BIM Structural Building Viewer
// ==========================================
function initBuilding3DViewer() {
    const container = document.getElementById('three-container');
    if (!container) return;

    // Scene & Camera Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f1d);
    scene.fog = new THREE.FogExp2(0x0a0f1d, 0.015);

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(38, 28, 42);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Orbit Controls (Mouse/Touch interactions)
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.2;
    controls.maxPolarAngle = Math.PI / 2 + 0.05;
    controls.minDistance = 15;
    controls.maxDistance = 85;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dirLight1.position.set(20, 40, 20);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xf59e0b, 0.6);
    dirLight2.position.set(-20, 20, -20);
    scene.add(dirLight2);

    // Ground Foundation & Grid
    const gridHelper = new THREE.GridHelper(50, 25, 0x0284c7, 0x1e293b);
    gridHelper.position.y = -0.1;
    scene.add(gridHelper);

    const foundationGeo = new THREE.BoxGeometry(22, 1, 22);
    const foundationMat = new THREE.MeshStandardMaterial({ 
        color: 0x1e293b, 
        roughness: 0.8,
        metalness: 0.2
    });
    const foundation = new THREE.Mesh(foundationGeo, foundationMat);
    foundation.position.y = -0.5;
    scene.add(foundation);

    // Procedural RCC Building Model
    const buildingGroup = new THREE.Group();
    const floors = 8;
    const floorHeight = 3.2;
    const gridX = [-8, -2.7, 2.7, 8];
    const gridZ = [-8, -2.7, 2.7, 8];

    const slabMat = new THREE.MeshStandardMaterial({ 
        color: 0x0f172a, 
        metalness: 0.1, 
        roughness: 0.6,
        transparent: true,
        opacity: 0.85
    });

    const columnMat = new THREE.MeshStandardMaterial({ 
        color: 0x0284c7, 
        metalness: 0.4, 
        roughness: 0.3 
    });

    const shearWallMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        transparent: true,
        opacity: 0.35,
        wireframe: false
    });

    // Central Elevator/Stair Shear Wall Core
    const coreGeo = new THREE.BoxGeometry(5.4, floors * floorHeight, 5.4);
    const coreMesh = new THREE.Mesh(coreGeo, shearWallMat);
    coreMesh.position.y = (floors * floorHeight) / 2;
    buildingGroup.add(coreMesh);

    const coreEdges = new THREE.EdgesGeometry(coreGeo);
    const coreLine = new THREE.LineSegments(coreEdges, new THREE.LineBasicMaterial({ color: 0xf59e0b, linewidth: 2 }));
    coreLine.position.y = coreMesh.position.y;
    buildingGroup.add(coreLine);

    // Floor Slabs and Structural Columns
    for (let f = 0; f < floors; f++) {
        const currentY = (f + 1) * floorHeight;

        // Concrete Floor Slab
        const slabGeo = new THREE.BoxGeometry(18, 0.35, 18);
        const slab = new THREE.Mesh(slabGeo, slabMat);
        slab.position.y = currentY;
        buildingGroup.add(slab);

        const slabEdges = new THREE.EdgesGeometry(slabGeo);
        const slabLine = new THREE.LineSegments(slabEdges, new THREE.LineBasicMaterial({ color: 0x38bdf8 }));
        slabLine.position.y = currentY;
        buildingGroup.add(slabLine);

        // Columns
        gridX.forEach(x => {
            gridZ.forEach(z => {
                if (Math.abs(x) < 3 && Math.abs(z) < 3) return;

                const colGeo = new THREE.BoxGeometry(0.55, floorHeight, 0.55);
                const column = new THREE.Mesh(colGeo, columnMat);
                column.position.set(x, currentY - (floorHeight / 2), z);
                buildingGroup.add(column);

                const colEdges = new THREE.EdgesGeometry(colGeo);
                const colLine = new THREE.LineSegments(colEdges, new THREE.LineBasicMaterial({ color: 0x0369a1 }));
                colLine.position.set(x, currentY - (floorHeight / 2), z);
                buildingGroup.add(colLine);
            });
        });
    }

    scene.add(buildingGroup);

    // Buttons
    let isWireframe = false;
    const wireframeBtn = document.getElementById('toggle-wireframe-btn');
    if (wireframeBtn) {
        wireframeBtn.addEventListener('click', () => {
            isWireframe = !isWireframe;
            slabMat.wireframe = isWireframe;
            columnMat.wireframe = isWireframe;
            shearWallMat.wireframe = isWireframe;
        });
    }

    const resetCamBtn = document.getElementById('reset-cam-btn');
    if (resetCamBtn) {
        resetCamBtn.addEventListener('click', () => {
            camera.position.set(38, 28, 42);
            controls.target.set(0, 12, 0);
        });
    }

    controls.target.set(0, 12, 0);

    // Window Resize
    window.addEventListener('resize', () => {
        if (!container) return;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });

    // Animation Loop
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();
}