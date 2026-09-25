// Toggle the graph visualization on or off here
const ENABLE_GRAPH = true;

if (ENABLE_GRAPH) {
    const canvas = document.getElementById('bg-canvas');
    const ctx = canvas.getContext('2d');

    let particles = [];
    let mouse = { x: null, y: null, radius: 150 };
    let lastScrollY = window.scrollY;
    
    // Check if the device is a touch screen
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    class Particle {
        constructor(canvasWidth, canvasHeight) {
            this.x = Math.random() * canvasWidth;
            this.y = Math.random() * canvasHeight;
            
            // Depth of field: z goes from 0 (background) to 1 (foreground)
            this.z = Math.random(); 
            
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
            
            // Particles closer to the camera are slightly larger (increased variance)
            this.baseRadius = (Math.random() * 2.5 + 0.5) * (this.z * 0.6 + 0.4); 
            this.radius = this.baseRadius;
        }

        update(canvasWidth, canvasHeight, scrollDelta) {
            this.x += this.vx;
            // Scroll delta applies a parallax shift so the graph appears to stay in place physically 
            // relative to the scrolling page, creating a cohesive background feel
            this.y += this.vy - scrollDelta * 0.4; 

            // Wrap around edges to keep them on screen smoothly
            if (this.x < 0) this.x = canvasWidth;
            if (this.x > canvasWidth) this.x = 0;
            if (this.y < 0) this.y = canvasHeight;
            if (this.y > canvasHeight) this.y = 0;
        }

        draw(ctx) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            // Particles in the background are dimmer, foreground are brighter
            const alpha = 0.05 + (this.z * 0.25); 
            ctx.fillStyle = `rgba(96, 165, 250, ${alpha})`; 
            ctx.fill();
        }
    }

    let logicalWidth, logicalHeight;

    function init(resetParticles = true) {
        logicalWidth = window.innerWidth;
        logicalHeight = window.innerHeight;
        
        // Fix for High-DPI (Retina) displays to prevent low-res look
        const dpr = window.devicePixelRatio || 1;
        canvas.width = logicalWidth * dpr;
        canvas.height = logicalHeight * dpr;
        ctx.scale(dpr, dpr);
        
        if (resetParticles) {
            particles = [];
        }
        
        // Increased density so they form huge webs naturally, rather than tiny 2-dot pairs
        const numParticles = Math.floor((logicalWidth * logicalHeight) / 7000);
        
        // Dynamically adjust particles without clearing existing ones
        if (particles.length < numParticles) {
            for (let i = particles.length; i < numParticles; i++) {
                particles.push(new Particle(logicalWidth, logicalHeight));
            }
        } else if (particles.length > numParticles) {
            particles.splice(numParticles);
        }
    }

    function animate() {
        requestAnimationFrame(animate);
        ctx.clearRect(0, 0, logicalWidth, logicalHeight);

        const currentScrollY = window.scrollY;
        const scrollDelta = currentScrollY - lastScrollY;
        lastScrollY = currentScrollY;

        for (let i = 0; i < particles.length; i++) {
            particles[i].update(logicalWidth, logicalHeight, scrollDelta);

            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // Connect them if they are close enough (increased to form large clusters)
                if (distance < 160) {
                    ctx.beginPath();
                    // The depth (z) of the particles determines how bright the connection line is
                    const avgZ = (particles[i].z + particles[j].z) / 2;
                    const maxOpacity = 0.16 * (avgZ * 0.8 + 0.2); 
                    
                    // Maps distance to opacity perfectly
                    ctx.strokeStyle = `rgba(96, 165, 250, ${maxOpacity * (1 - distance / 160)})`; 
                    ctx.lineWidth = 1;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }

            // Mouse interaction
            if (mouse.x != null && mouse.y != null) {
                const dx = particles[i].x - mouse.x;
                const dy = particles[i].y - mouse.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < mouse.radius) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(37, 99, 235, ${0.24 * (1 - distance / mouse.radius)})`; 
                    ctx.lineWidth = 1;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.stroke();
                    
                    // push effect (increased force for faster moving away dots)
                    const forceDirectionX = dx / distance;
                    const forceDirectionY = dy / distance;
                    const force = (mouse.radius - distance) / mouse.radius;
                    
                    particles[i].x += forceDirectionX * force * 1.5;
                    particles[i].y += forceDirectionY * force * 1.5;
                    
                    // Slightly enlarge nodes near the mouse for a dynamic response
                    particles[i].radius = particles[i].baseRadius + (force * 1.5);
                } else {
                    particles[i].radius = particles[i].baseRadius;
                }
            } else {
                particles[i].radius = particles[i].baseRadius;
            }
            
            particles[i].draw(ctx);
        }
    }

    window.addEventListener('resize', () => {
        init(false);
    });

    // Mouse events
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.x;
        mouse.y = e.y;
    });

    window.addEventListener('mouseout', () => {
        mouse.x = null;
        mouse.y = null;
    });

    // Touch events for interaction
    window.addEventListener('touchstart', (e) => {
        if (e.touches.length > 0) {
            mouse.x = e.touches[0].clientX;
            mouse.y = e.touches[0].clientY;
        }
    });

    window.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
            mouse.x = e.touches[0].clientX;
            mouse.y = e.touches[0].clientY;
        }
    });

    window.addEventListener('touchend', () => {
        mouse.x = null;
        mouse.y = null;
    });

    init(true);
    animate();
} else {
    // If graph is disabled, hide the canvas
    const canvas = document.getElementById('bg-canvas');
    if (canvas) canvas.style.display = 'none';
}
