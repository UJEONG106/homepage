class WonderlandApp {
    constructor() {
        this.container = document.body;
        this.canvasContainer = document.getElementById('canvas-container');
        
        // Use global THREE from UMD script
        this.scene = new THREE.Scene();
        this.scene.fog = null;
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        
        this.cards = [];
        this.cardData = [
            { img: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=1200', title: '학교 소개', url: 'school-intro.html' },
            { img: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=1200', title: '학과 소개', url: null },
            { img: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1200', title: '나의 포트폴리오', url: 'https://myhome-nine-psi.vercel.app/' },
            { img: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1200', title: '관련 회사', url: null },
            { img: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=1200', title: '학교 생활', url: 'school-life.html' }
        ];

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        console.log("WonderlandApp Constructor Initialized");
        this.init();
    }

    init() {
        try {
            // Renderer Setup
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            this.canvasContainer.appendChild(this.renderer.domElement);

            // Camera Position
            this.camera.position.z = 20;

            this.addLights();
            this.addContent();
            this.setupSmoothScroll();
            this.setupGSAPScroll();
            this.animate();

            window.addEventListener('resize', () => this.resize());
            window.addEventListener('mousemove', (e) => this.onMouseMove(e));
            window.addEventListener('click', (e) => this.onClick(e));

            // Force loader fade even if images take time
            setTimeout(() => {
                const loader = document.getElementById('loader');
                if (loader) {
                    loader.classList.add('loaded');
                }
            }, 2500);

            // Loader bar simulation
            let loadProgress = 0;
            const loaderInt = setInterval(() => {
                loadProgress += 5;
                const bar = document.getElementById('loader-bar');
                if (bar) bar.style.width = `${Math.min(loadProgress, 100)}%`;
                if (loadProgress >= 100) clearInterval(loaderInt);
            }, 50);

            // Clock Update Logic
            const updateClock = () => {
                const now = new Date();
                const clock = document.getElementById('clock');
                if (clock) {
                    clock.innerText = now.getHours().toString().padStart(2, '0') + ":" + 
                                     now.getMinutes().toString().padStart(2, '0');
                }
            };
            updateClock();
            setInterval(updateClock, 10000);

        } catch (error) {
            console.error("Initialization Failed:", error);
            // Emergency loader removal
            document.getElementById('loader').style.display = 'none';
        }
    }

    addLights() {
        // Soft Ambient Daylight
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);

        // Directional Sun Light 
        const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
        sunLight.position.set(50, 80, 50);
        this.scene.add(sunLight);

    }

    addContent() {
        const loader = new THREE.TextureLoader();
        const geometry = new THREE.BoxGeometry(7, 7, 0.5); 

        const cardOffsets = this.cardData.map((_, i) => ({
            xRandom: (0.9 + Math.random() * 0.1), // Just variance
            yOffset: (Math.random() - 0.5) * 6,
            rotY: (Math.random() - 0.5) * 0.5,
            rotX: (Math.random() - 0.5) * 0.2
        }));

        const setsCount = 4; 
        
        for (let s = 0; s < setsCount; s++) {
            this.cardData.forEach((data, i) => {
                const offsets = cardOffsets[i]; 

                const material = new THREE.MeshPhysicalMaterial({
                    transparent: true,
                    opacity: 1.0,
                    side: THREE.DoubleSide
                });

                const mesh = new THREE.Mesh(geometry, material);
                
                const cardIndex = s * this.cardData.length + i;
                const totalSpacing = 40; 
                
                const isMobile = window.innerWidth < 768;
                const xBase = isMobile ? 3.5 : 6.5; 
                
                mesh.position.z = -cardIndex * totalSpacing;
                mesh.position.x = (i % 2 === 0 ? xBase : -xBase) * offsets.xRandom;
                mesh.position.y = offsets.yOffset;
                mesh.rotation.y = offsets.rotY;
                mesh.rotation.x = offsets.rotX;

                mesh.userData = { url: data.url, title: data.title, index: i };

                this.scene.add(mesh);
                this.cards.push(mesh);

                loader.load(data.img, (texture) => {
                    mesh.material.map = texture;
                    mesh.material.needsUpdate = true;
                });
            });
        }
    }

    addFloor() {
        const geometry = new THREE.PlaneGeometry(1000, 1000);
        const material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.1,
            metalness: 0.1,
            transparent: true,
            opacity: 0.15, 
        });
        const floor = new THREE.Mesh(geometry, material);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -25;
        this.scene.add(floor);
    }

    addParticles() {
        const count = 200;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        
        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 400;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 200;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 800 - 200;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const material = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.8,
            transparent: true,
            opacity: 0.9,
            map: this.createSparkleTexture(),
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }

    createSparkleTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.4)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 32, 32);
        return new THREE.CanvasTexture(canvas);
    }

    setupSmoothScroll() {
        if (typeof Lenis === 'undefined') return;
        const isMobile = window.innerWidth < 768;
        
        this.lenis = new Lenis({
            duration: 1.5,
            easing: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
            infinite: true,
            touchMultiplier: isMobile ? 2 : 0 // Enable touch for mobile
        });

        const scrollFn = (time) => {
            this.lenis.raf(time);
            requestAnimationFrame(scrollFn);
        };
        requestAnimationFrame(scrollFn);

        this.isScrolling = false;
        window.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (this.isScrolling) return;

            const direction = e.deltaY > 0 ? 1 : -1;
            this.isScrolling = true;

            const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollStep = totalHeight / this.cards.length;

            this.lenis.scrollTo(`+=${direction * (scrollStep + 1)}`, {
                duration: 1.2,
                onComplete: () => {
                    this.isScrolling = false;
                }
            });

            setTimeout(() => { this.isScrolling = false; }, 1300);
        }, { passive: false });
    }

    setupGSAPScroll() {
        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
        gsap.registerPlugin(ScrollTrigger);

        ScrollTrigger.create({
            trigger: document.body,
            start: "top top",
            end: "bottom bottom",
            scrub: 1.2,
            onUpdate: (self) => {
                const progress = self.progress;
                const totalSpacing = 40;
                const totalDepth = this.cards.length * totalSpacing;
                
                let minDistance = 1000;
                let focalIndex = -1;

                this.cards.forEach((card, i) => {
                    const initialOffset = -i * totalSpacing;
                    const movement = progress * totalDepth;
                    
                    let currentZ = (initialOffset + movement) % totalDepth;
                    if (currentZ < 0) currentZ += totalDepth;

                    if (currentZ > 30) currentZ -= totalDepth;
                    card.position.z = currentZ;

                    const distToCam = 20 - currentZ;
                    
                    if (distToCam < 2) {
                        card.material.opacity = Math.max(0, distToCam / 8); 
                    } else if (distToCam > 150) {
                        card.material.opacity = Math.max(0, (250 - distToCam) / 100);
                    } else {
                        card.material.opacity = 1.0; 
                    }
                    card.visible = (distToCam > 0) && (card.material.opacity > 0.1);

                    // Robust focus: Find card closest to focus distance 12
                    const absDist = Math.abs(distToCam - 12);
                    if (absDist < minDistance) {
                        minDistance = absDist;
                        focalIndex = card.userData.index;
                    }
                });

                if (focalIndex !== -1) {
                    this.updateMenuHighlights(focalIndex);
                }
            }
        });
    }
    updateMenuHighlights(activeIndex) {
        for (let i = 0; i < 5; i++) {
            const item = document.getElementById(`m${i+1}`);
            if (!item) continue;
            
            if (i === activeIndex) {
                item.classList.add('active-pill');
                item.classList.remove('opacity-60');
            } else {
                item.classList.remove('active-pill');
                item.classList.add('opacity-60');
            }
        }
    }

    onMouseMove(e) {
        if (window.innerWidth < 768) return; // Disable tilt on mobile for performance
        this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

        const xVal = (e.clientX / window.innerWidth - 0.5) * 2;
        const yVal = (e.clientY / window.innerHeight - 0.5) * 2;
        
        this.cards.forEach(card => {
            if (card.visible) {
                gsap.to(card.rotation, {
                    y: xVal * 0.1,
                    x: -yVal * 0.1,
                    duration: 0.5
                });
            }
        });
    }

    onClick(e) {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.cards);

        if (intersects.length > 0) {
            const clickedCard = intersects[0].object;
            if (clickedCard.visible && clickedCard.userData.url) {
                console.log("Navigating to:", clickedCard.userData.title);
                window.location.href = clickedCard.userData.url;
            }
        }
    }

    jumpTo(index) {
        if (!this.lenis || this.isScrolling) return;
        
        const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
        const currentProgress = this.lenis.scroll / totalHeight;
        
        // Find current card in focus
        const currentIdx = Math.round((currentProgress % 1) * this.cards.length) % 5;
        if (currentIdx === index) return; // Already here

        let targetI = -1;
        for (let i = 0; i < this.cards.length; i++) {
            if (this.cards[i].userData.index === index) {
                const pos = i / this.cards.length;
                if (pos > (currentProgress % 1)) {
                    targetI = i;
                    break;
                }
            }
        }

        // If not found in current cycle (e.g. looking for card 1 while at card 5), 
        // it must be at the start of the next cycle
        if (targetI === -1) {
            for (let i = 0; i < this.cards.length; i++) {
                if (this.cards[i].userData.index === index) {
                    targetI = i;
                    break;
                }
            }
        }

        if (targetI !== -1) {
            const targetPos = targetI / this.cards.length;
            let finalTarget = targetPos;
            
            // Critical forward-only logic:
            const cycleProgress = currentProgress % 1;
            if (targetPos <= cycleProgress) {
                // It's in the next cycle
                finalTarget = Math.floor(currentProgress) + 1 + targetPos;
            } else {
                // It's ahead in the current cycle
                finalTarget = Math.floor(currentProgress) + targetPos;
            }
            
            this.lenis.scrollTo(finalTarget * totalHeight, { duration: 1.8, easing: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t) });
        }
    }

    resize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        const time = performance.now() * 0.001;
        this.cards.forEach((card, i) => {
            card.position.y += Math.sin(time + i) * 0.003;
        });

        if (this.clouds) {
            this.clouds.forEach((cloud, i) => {
                cloud.position.x += Math.cos(time * 0.1 + i) * 0.01;
                cloud.position.z += 0.05; // Slowly move forward
                if (cloud.position.z > 50) cloud.position.z = -450; // Simple loop
            });
        }

        if (this.particles) {
            this.particles.position.z += 0.1;
            if (this.particles.position.z > 100) this.particles.position.z = -400;
        }
        
        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(() => this.animate());
    }
}

// Instant execution
console.log("Script Loaded. Starting App...");
const app = new WonderlandApp();
