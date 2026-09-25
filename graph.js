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
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
            this.radius = Math.random() * 1.5 + 0.5; 
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
            ctx.fillStyle = 'rgba(96, 165, 250, 0.3)'; 
            ctx.fill();
        }
    }

    let logicalWidth, logicalHeight;

    function init() {
        logicalWidth = window.innerWidth;
        logicalHeight = window.innerHeight;
        
        // Fix for High-DPI (Retina) displays to prevent low-res look
        const dpr = window.devicePixelRatio || 1;
        canvas.width = logicalWidth * dpr;
        canvas.height = logicalHeight * dpr;
        ctx.scale(dpr, dpr);
        
        particles = [];
        // Increased density so they form huge webs naturally, rather than tiny 2-dot pairs
        const numParticles = (logicalWidth * logicalHeight) / 9000;
        
        for (let i = 0; i < numParticles; i++) {
            particles.push(new Particle(logicalWidth, logicalHeight));
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
            particles[i].draw(ctx);

            for (let j = i; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // Connect them if they are close enough (increased to form large clusters)
                if (distance < 160) {
                    ctx.beginPath();
                    // Maps distance to opacity perfectly: 0.16 at 0 dist, 0.0 at 160 dist.
                    ctx.strokeStyle = `rgba(96, 165, 250, ${0.16 * (1 - distance / 160)})`; 
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
                    
                    // subtle push effect
                    const forceDirectionX = dx / distance;
                    const forceDirectionY = dy / distance;
                    const force = (mouse.radius - distance) / mouse.radius;
                    
                    particles[i].x += forceDirectionX * force * 0.5;
                    particles[i].y += forceDirectionY * force * 0.5;
                }
            }
        }
    }

    window.addEventListener('resize', init);

    // Only bind mouse events if it's NOT a touch device
    if (!isTouchDevice) {
        window.addEventListener('mousemove', (e) => {
            mouse.x = e.x;
            mouse.y = e.y;
        });

        window.addEventListener('mouseout', () => {
            mouse.x = null;
            mouse.y = null;
        });
    }

    init();
    animate();
} else {
    // If graph is disabled, hide the canvas
    const canvas = document.getElementById('bg-canvas');
    if (canvas) canvas.style.display = 'none';
}
