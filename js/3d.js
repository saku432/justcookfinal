import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';

export function initHero3D(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    
    // Abstract shapes floating
    const shapes = [];
    const colors = [0xFF5A5F, 0xFFD166, 0x111827, 0x0f172a, 0x64748b];
    
    // Create multiple shapes
    for(let i=0; i<15; i++) {
        const geoType = Math.random();
        let geometry;
        
        if (geoType < 0.3) {
            geometry = new THREE.TorusGeometry(Math.random() * 2 + 1, Math.random() * 0.5 + 0.1, 16, 100);
        } else if (geoType < 0.6) {
             geometry = new THREE.OctahedronGeometry(Math.random() * 2 + 1);
        } else {
             geometry = new THREE.IcosahedronGeometry(Math.random() * 2 + 1);
        }
        
        const material = new THREE.MeshPhongMaterial({ 
            color: colors[Math.floor(Math.random() * colors.length)],
            wireframe: Math.random() > 0.7,
            transparent: true,
            opacity: Math.random() * 0.5 + 0.2
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        
        // Random placement
        mesh.position.x = (Math.random() - 0.5) * 30;
        mesh.position.y = (Math.random() - 0.5) * 20;
        mesh.position.z = (Math.random() - 0.5) * 20 - 15;
        
        // Velocity for rotation
        mesh.userData = {
            rx: (Math.random() - 0.5) * 0.02,
            ry: (Math.random() - 0.5) * 0.02,
            rz: (Math.random() - 0.5) * 0.02,
            yVel: (Math.random() - 0.5) * 0.01,
            originY: mesh.position.y,
            offset: Math.random() * 100
        };
        
        scene.add(mesh);
        shapes.push(mesh);
    }
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(10, 20, 10);
    scene.add(pointLight);
    
    camera.position.z = 12;
    // slightly tilt camera downwards
    camera.rotation.x = -0.1;
    
    // Animation Loop
    let animationFrameId;
    function animate() {
        animationFrameId = requestAnimationFrame(animate);
        
        const time = Date.now() * 0.001;
        
        shapes.forEach(shape => {
            shape.rotation.x += shape.userData.rx;
            shape.rotation.y += shape.userData.ry;
            shape.rotation.z += shape.userData.rz;
            shape.position.y = shape.userData.originY + Math.sin(time + shape.userData.offset) * 2;
        });
        
        renderer.render(scene, camera);
    }
    animate();
    
    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
        if (!container.clientWidth || !container.clientHeight) return;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
    
    resizeObserver.observe(container);
    
    // Mouse interaction
    const onMouseMove = (e) => {
       const x = (e.clientX / window.innerWidth - 0.5) * 2;
       const y = (e.clientY / window.innerHeight - 0.5) * 2;
       
       gsap.to(camera.position, {
           x: x * 2,
           y: -y * 2,
           duration: 1
       });
    };
    window.addEventListener('mousemove', onMouseMove);
    
    // Cleanup function attaching to window so router can clear it
    window.cleanup3D = () => {
        cancelAnimationFrame(animationFrameId);
        resizeObserver.disconnect();
        window.removeEventListener('mousemove', onMouseMove);
        if(container.contains(renderer.domElement)) {
            container.removeChild(renderer.domElement);
        }
        shapes.forEach(shape => {
            shape.geometry.dispose();
            shape.material.dispose();
        });
        renderer.dispose();
        window.cleanup3D = null;
    };
}
