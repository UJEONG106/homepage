console.log("Robotics Lab App Loading...");
gsap.registerPlugin(ScrollTrigger);

const scene = document.getElementById('scene');
const cards = document.querySelectorAll('.tunnel-card');
const overlay = document.getElementById('overlay');
const closeBtn = document.getElementById('close-overlay');
const contentBody = document.getElementById('content-body');

const totalDepth = 8000; // Match body height
const zStep = 2500;
const sceneMaxZ = (cards.length - 1) * zStep;
const restartBtn = document.getElementById('restart-btn');
const restartContainer = document.getElementById('restart-container');
const startZ = -1000; // Balanced starting distance

// 1. Scene Scroll Logic
window.addEventListener('scroll', () => {
    const scrollPos = window.scrollY;
    const scrollMax = document.documentElement.scrollHeight - window.innerHeight;
    const progress = Math.min(1, Math.max(0, scrollPos / scrollMax));
    
    // Show/Hide Restart Button at the end (threshold: 98%)
    if (progress > 0.98) {
        gsap.to(restartContainer, { opacity: 1, y: 0, duration: 0.5, pointerEvents: 'all' });
    } else {
        gsap.to(restartContainer, { opacity: 0, y: 20, duration: 0.3, pointerEvents: 'none' });
    }
    
    // Move the entire scene forward with startZ offset
    const currentZ = (progress * (sceneMaxZ + 1000)) + startZ;
    
    gsap.to(scene, {
        z: currentZ,
        duration: 0.5,
        ease: "power2.out"
    });

    // Individual card adjustments (opacity based on distance)
    cards.forEach((card, index) => {
        const cardZ = -index * zStep;
        const globalZ = currentZ + cardZ;
        
        let opacity = 1;
        if (globalZ > 0) {
            // Fading out as it passes through the camera
            opacity = Math.max(0, 1 - globalZ / 1000);
            card.style.pointerEvents = 'none';
        } else {
            // Fading in from distance
            const dist = Math.abs(globalZ);
            if (dist > 3500) {
                opacity = Math.max(0, 1 - (dist - 3500) / 1000);
            }
            card.style.pointerEvents = 'all';
        }
        
        gsap.to(card, {
            opacity: opacity,
            duration: 0.3
        });
    });
});

// 2. Side Nav Click Logic
const sideItems = document.querySelectorAll('.side-item');
sideItems.forEach((item, index) => {
    item.addEventListener('click', () => {
        const scrollMax = document.documentElement.scrollHeight - window.innerHeight;
        const targetProgress = (index * zStep) / (sceneMaxZ + 1000);
        const targetY = targetProgress * scrollMax;
        
        window.scrollTo({
            top: targetY,
            behavior: 'smooth'
        });
    });
});

// 2. Click to Zoom-in Logic (Wonderland "Suck-in")
cards.forEach((card, index) => {
    card.addEventListener('click', () => {
        // External link for Portfolio (index 2)
        if (index === 2) {
            window.open('https://myhome-nine-psi.vercel.app/', '_blank');
            return;
        }

        const cardZ = -index * zStep;
        
        // Synchronize scroll position to the card's depth
        const targetProgress = (index * zStep) / (sceneMaxZ + 1000);
        const scrollMax = document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo({
            top: targetProgress * scrollMax,
            behavior: 'auto'
        });

        const tl = gsap.timeline();
        // Move scene to bring card into focus (suck-in effect)
        tl.to(scene, {
            z: -cardZ + 800, 
            duration: 0.8,
            ease: "power2.inOut"
        });

        tl.to(card, {
            scale: 2,
            opacity: 0,
            duration: 0.8
        }, "-=0.8");

        tl.call(() => {
            showContent(index);
        });
    });
});

function showContent(index, immediate = false) {
    const template = document.getElementById(`tpl-section${index + 1}`) || document.getElementById('tpl-section1');
    contentBody.innerHTML = '';
    contentBody.appendChild(template.content.cloneNode(true));
    
    if (immediate) {
        gsap.set(overlay, { display: 'block', opacity: 1 });
    } else {
        gsap.set(overlay, { display: 'block', opacity: 0 });
        gsap.to(overlay, { opacity: 1, duration: 0.5 });
    }
    
    // Update hash to persist state on refresh
    location.hash = `section${index + 1}`;
    
    // Disable body scroll while overlay is open
    document.body.style.overflow = 'hidden';
}

// 3. Back to Tunnel
closeBtn.addEventListener('click', () => {
    gsap.to(overlay, {
        opacity: 0,
        duration: 0.5,
        onComplete: () => {
            overlay.style.display = 'none';
            document.body.style.overflow = 'auto';
            
            // Clear hash
            history.pushState("", document.title, window.location.pathname + window.location.search);
            
            // Recalculate scene position to match scroll
            const scrollPos = window.scrollY;
            const progress = scrollPos / (document.documentElement.scrollHeight - window.innerHeight);
            const currentZ = (progress * (sceneMaxZ + 1000)) + startZ; // Unified formula
            gsap.set(scene, { z: currentZ });
        }
    });
});

// 4. Mouse Parallax (Immersive Feel)
window.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 30;
    const y = (e.clientY / window.innerHeight - 0.5) * 30;
    
    gsap.to(scene, {
        rotationY: x * 0.1,
        rotationX: -y * 0.1,
        duration: 1,
        ease: "power2.out"
    });
});

// 5. Restart Journey
restartBtn.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// 6. Handle Refresh / Initial Hash (Immediate)
const initHash = location.hash;
if (initHash && initHash.startsWith('#section')) {
    const index = parseInt(initHash.replace('#section', '')) - 1;
    if (!isNaN(index) && index >= 0 && index < cards.length) {
        // Jump camera to the card position first (Instant)
        const targetProgress = (index * zStep) / (sceneMaxZ + 1000);
        const scrollMax = document.documentElement.scrollHeight - window.innerHeight;
        
        // Use immediate scroll
        window.scrollTo(0, targetProgress * scrollMax);
        const currentZ = (targetProgress * (sceneMaxZ + 1000)) + startZ;
        gsap.set(scene, { z: currentZ });
        
        showContent(index, true); // Open without animation to prevent flashing
    }
} else {
    window.scrollTo(0, 0);
}
