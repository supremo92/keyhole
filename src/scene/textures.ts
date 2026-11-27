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
