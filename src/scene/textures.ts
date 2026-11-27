import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from "three";
import type { WallpaperPattern } from "../../shared/constants";

// Patterns drawn on a <canvas> and used as textures, cached by their settings.
const cache = new Map<string, CanvasTexture>();

function make(key: string, repeat: [number, number], draw: (g: CanvasRenderingContext2D, s: number) => void) {
    const cached = cache.get(key);
    if (cached) return cached;
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const g = canvas.getContext("2d")!;
    draw(g, size);
    const tex = new CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = RepeatWrapping;
    tex.repeat.set(...repeat);
    tex.colorSpace = SRGBColorSpace;
    tex.anisotropy = 4;
    cache.set(key, tex);
    return tex;
}

function speckle(g: CanvasRenderingContext2D, s: number, alpha: number, count = 1800) {
    for (let i = 0; i < count; i++) {
        g.fillStyle = Math.random() > 0.5 ? `rgba(0,0,0,${alpha})` : `rgba(255,255,255,${alpha})`;
        g.fillRect(Math.random() * s, Math.random() * s, 2, 2);
    }
}

export function wallpaper(pattern: WallpaperPattern, [base, accent]: [string, string], repeat: [number, number]) {
    return make(`wp:${pattern}:${base}:${accent}:${repeat}`, repeat, (g, s) => {
        g.fillStyle = base;
        g.fillRect(0, 0, s, s);
        g.fillStyle = accent;
        g.strokeStyle = accent;
        switch (pattern) {
            case "stripes":
                for (let x = 0; x < s; x += 64) g.fillRect(x, 0, 26, s);
                g.globalAlpha = 0.5;
                for (let x = 40; x < s; x += 64) g.fillRect(x, 0, 6, s);
                break;
            case "dots":
                for (let y = 0; y < 4; y++)
                    for (let x = 0; x < 4; x++) {
                        g.beginPath();
                        g.arc(x * 64 + (y % 2) * 32 + 16, y * 64 + 32, 10, 0, Math.PI * 2);
                        g.fill();
                    }
                break;
            case "checks":
                g.globalAlpha = 0.55;
                for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) if ((x + y) % 2) g.fillRect(x * 64, y * 64, 64, 64);
                break;
            case "diamonds":
                for (let y = 0; y < 3; y++)
                    for (let x = 0; x < 3; x++) {
                        const cx = x * 128 + (y % 2) * 64;
                        const cy = y * 128;
                        g.beginPath();
                        g.moveTo(cx, cy - 40);
                        g.lineTo(cx + 28, cy);
                        g.lineTo(cx, cy + 40);
                        g.lineTo(cx - 28, cy);
                        g.closePath();
                        g.fill();
                    }
                break;
            case "waves":
                g.lineWidth = 8;
                for (let y = 16; y < s; y += 48) {
                    g.beginPath();
                    for (let x = 0; x <= s; x += 4) g.lineTo(x, y + Math.sin((x / s) * Math.PI * 4) * 10);
                    g.stroke();
                }
                break;
            case "plain":
                break;
        }
        g.globalAlpha = 1;
        speckle(g, s, 0.03);
    });
}

export function woodFloor(repeat: [number, number]) {
    return make(`wood:${repeat}`, repeat, (g, s) => {
        const tones = ["#7a4f2c", "#8a5c34", "#6d4526", "#94653b"];
        for (let i = 0; i < 8; i++) {
            g.fillStyle = tones[i % tones.length];
            g.fillRect(i * 32, 0, 32, s);
            g.fillStyle = "rgba(0,0,0,0.35)";
            g.fillRect(i * 32, 0, 2, s);
            g.fillRect(i * 32, ((i * 97) % s), 32, 2);
        }
        speckle(g, s, 0.05, 2500);
    });
}

export function carpet(colour: string, repeat: [number, number]) {
    return make(`carpet:${colour}:${repeat}`, repeat, (g, s) => {
        g.fillStyle = colour;
        g.fillRect(0, 0, s, s);
        speckle(g, s, 0.08, 6000);
    });
}

export function sky() {
    return make("sky", [1, 1], (g, s) => {
        const grad = g.createLinearGradient(0, 0, 0, s);
        grad.addColorStop(0, "#7fb8ec");
        grad.addColorStop(1, "#dff0ff");
        g.fillStyle = grad;
        g.fillRect(0, 0, s, s);
        g.fillStyle = "rgba(255,255,255,0.9)";
        for (const [x, y, r] of [
            [60, 80, 22],
            [85, 72, 28],
            [112, 84, 20],
            [180, 150, 18],
            [200, 142, 24],
        ]) {
            g.beginPath();
            g.arc(x, y, r, 0, Math.PI * 2);
            g.fill();
        }
    });
}

// Signs of age, drawn on transparent canvases and stuck onto walls and ceilings.
function decal(key: string, draw: (g: CanvasRenderingContext2D, s: number) => void) {
    const cached = cache.get(key);
    if (cached) return cached;
    const s = 256;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = s;
    draw(canvas.getContext("2d")!, s);
    const tex = new CanvasTexture(canvas);
    tex.colorSpace = SRGBColorSpace;
    cache.set(key, tex);
    return tex;
}

// A jagged crack in the plaster, branching as it goes.
export function crackTexture(seed = 1) {
    return decal(`crack:${seed}`, (g, s) => {
        let r = seed * 9301;
        const rand = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
        g.strokeStyle = "rgba(30,20,12,0.85)";
        g.lineCap = "round";
        const branch = (x: number, y: number, angle: number, len: number, width: number) => {
            if (len < 6 || width < 0.5) return;
            g.lineWidth = width;
            g.beginPath();
            g.moveTo(x, y);
            for (let i = 0; i < 6; i++) {
                angle += (rand() - 0.5) * 0.9;
                x += Math.cos(angle) * (len / 6);
                y += Math.sin(angle) * (len / 6);
                g.lineTo(x, y);
                if (rand() < 0.25) branch(x, y, angle + (rand() - 0.5) * 2, len * 0.5, width * 0.6);
            }
            g.stroke();
        };
        branch(s * 0.5, 4, Math.PI / 2, s * 0.9, 3.5);
    });
}

// A brown water stain with a darker tide-mark edge.
export function dampTexture(seed = 1) {
    return decal(`damp:${seed}`, (g, s) => {
        for (let i = 0; i < 5; i++) {
            const x = s / 2 + Math.sin(seed * 3 + i * 2.1) * s * 0.18;
            const y = s / 2 + Math.cos(seed * 5 + i * 1.7) * s * 0.18;
            const r = s * (0.22 + ((i * 37 + seed * 11) % 10) / 60);
            const grad = g.createRadialGradient(x, y, r * 0.2, x, y, r);
            grad.addColorStop(0, "rgba(110,80,40,0.28)");
            grad.addColorStop(0.85, "rgba(90,62,30,0.32)");
            grad.addColorStop(1, "rgba(90,62,30,0)");
            g.fillStyle = grad;
            g.fillRect(0, 0, s, s);
        }
    });
}

// Night outside the windows: deep blue, a few stars, a sliver of moon.
export function nightSky(snow = false) {
    return make(`night:${snow}`, [1, 1], (g, s) => {
        const grad = g.createLinearGradient(0, 0, 0, s);
        grad.addColorStop(0, "#0b1530");
        grad.addColorStop(1, "#24375e");
        g.fillStyle = grad;
        g.fillRect(0, 0, s, s);
        g.fillStyle = "rgba(255,255,255,0.8)";
        for (let i = 0; i < 40; i++) g.fillRect((i * 97) % s, (i * 53) % (s * 0.7), 2, 2);
        g.fillStyle = "#f4ecc8";
        g.beginPath();
        g.arc(s * 0.75, s * 0.25, 22, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = "#0e1a38";
        g.beginPath();
        g.arc(s * 0.71, s * 0.22, 20, 0, Math.PI * 2);
        g.fill();
        if (snow) {
            g.fillStyle = "rgba(255,255,255,0.85)";
            for (let i = 0; i < 90; i++) g.fillRect((i * 61) % s, (i * 89) % s, 3, 3);
        }
    });
}
