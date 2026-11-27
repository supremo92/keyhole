// Tiny synthesised sound effects (no audio files needed).
let ctx: AudioContext | null = null;

// Start the audio engine early (while the page loads) so the first sound never stalls a
// frame. Browsers keep it paused until the first click or key press, so resume it then.
export function warmUpAudio() {
    ctx ??= new AudioContext();
    const resume = () => {
        if (ctx?.state === "suspended") void ctx.resume();
    };
    window.addEventListener("pointerdown", resume, { once: true, capture: true });
    window.addEventListener("keydown", resume, { once: true, capture: true });
}

function audio() {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
}

function noiseBurst(opts: {
    at?: number;
    duration: number;
    gain: number;
    type: BiquadFilterType;
    freq: number;
    freqTo?: number;
    q?: number;
}) {
    const ac = audio();
    const start = ac.currentTime + (opts.at ?? 0);
    const length = Math.ceil(ac.sampleRate * opts.duration);
    const buffer = ac.createBuffer(1, length, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;

    const src = ac.createBufferSource();
    src.buffer = buffer;
    const filter = ac.createBiquadFilter();
    filter.type = opts.type;
    filter.Q.value = opts.q ?? 1;
    filter.frequency.setValueAtTime(opts.freq, start);
    if (opts.freqTo) filter.frequency.exponentialRampToValueAtTime(opts.freqTo, start + opts.duration);
    const gain = ac.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(opts.gain, start + Math.min(0.02, opts.duration / 4));
    gain.gain.exponentialRampToValueAtTime(0.0001, start + opts.duration);

    src.connect(filter).connect(gain).connect(ac.destination);
    src.start(start);
    src.stop(start + opts.duration);
}

export const sounds = {
    whoosh() {
        noiseBurst({ duration: 0.6, gain: 0.07, type: "bandpass", freq: 300, freqTo: 1400, q: 0.8 });
    },
    // Planks being pried off and clattering to the floor.
    crack() {
        [0, 0.18, 0.32, 0.5].forEach((at, i) => {
            noiseBurst({ at, duration: 0.09, gain: 0.35, type: "bandpass", freq: 1800 - i * 200, q: 2 });
            noiseBurst({ at: at + 0.35, duration: 0.25, gain: 0.3, type: "lowpass", freq: 260 });
        });
    },
    // Paper sliding across the floor.
    slide() {
        noiseBurst({ duration: 0.8, gain: 0.12, type: "bandpass", freq: 2500, freqTo: 700, q: 0.7 });
    },
    click() {
        noiseBurst({ duration: 0.05, gain: 0.2, type: "highpass", freq: 3000 });
    },
    // Knuckles on wood, from the other side. Happy knocks are quick and bright.
    knock(times = 3, happy = true) {
        for (let i = 0; i < times; i++) {
            const at = i * (happy ? 0.16 : 0.32);
            noiseBurst({ at, duration: 0.09, gain: 0.5, type: "lowpass", freq: happy ? 520 : 300 });
            noiseBurst({ at, duration: 0.03, gain: 0.15, type: "bandpass", freq: 1500, q: 3 });
        }
    },
    // A long, disappointed breath behind the planks.
    sigh() {
        noiseBurst({ duration: 1.1, gain: 0.12, type: "bandpass", freq: 700, freqTo: 300, q: 0.7 });
    },
    // A sharp intake of breath. Not yours.
    gasp() {
        noiseBurst({ duration: 0.45, gain: 0.12, type: "bandpass", freq: 1400, freqTo: 2600, q: 1.2 });
    },
    // Something heavy, somewhere out in the hallway.
    thud() {
        noiseBurst({ duration: 0.3, gain: 0.45, type: "lowpass", freq: 120 });
    },
    // A chair dragged across floorboards.
    scrape() {
        noiseBurst({ duration: 0.6, gain: 0.1, type: "bandpass", freq: 500, freqTo: 900, q: 3 });
    },
    // A metal locker door.
    locker() {
        noiseBurst({ duration: 0.25, gain: 0.2, type: "bandpass", freq: 2200, freqTo: 1600, q: 8 });
        noiseBurst({ at: 0.05, duration: 0.15, gain: 0.25, type: "lowpass", freq: 300 });
    },
    // One drop of water landing in a puddle. Ambient: silent until audio is allowed.
    drip() {
        if (ctx?.state !== "running") return;
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(1800, t);
        osc.frequency.exponentialRampToValueAtTime(600, t + 0.08);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.06, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
        osc.connect(g).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.13);
    },
    // A heavy page turning.
    page() {
        noiseBurst({ duration: 0.35, gain: 0.1, type: "bandpass", freq: 1800, freqTo: 600, q: 0.6 });
    },
    // Someone on the other side of the door shuffling through papers.
    shuffle() {
        [0, 0.22, 0.5, 0.65].forEach((at, i) =>
            noiseBurst({ at, duration: 0.18 + (i % 2) * 0.1, gain: 0.05, type: "bandpass", freq: 3200 - i * 300, q: 0.9 }),
        );
    },
    // A rubber stamp coming down hard on a desk.
    stamp() {
        noiseBurst({ duration: 0.12, gain: 0.5, type: "lowpass", freq: 180 });
        noiseBurst({ duration: 0.04, gain: 0.2, type: "bandpass", freq: 1200, q: 2 });
    },
    // A cat's meow: a buzzy tone that rises then falls, through a moving "mouth" filter.
    meow() {
        const ac = audio();
        const t = ac.currentTime;
        const osc = ac.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(520, t);
        osc.frequency.exponentialRampToValueAtTime(820, t + 0.18);
        osc.frequency.exponentialRampToValueAtTime(430, t + 0.55);
        const mouth = ac.createBiquadFilter();
        mouth.type = "bandpass";
        mouth.Q.value = 4;
        mouth.frequency.setValueAtTime(900, t);
        mouth.frequency.exponentialRampToValueAtTime(2200, t + 0.15);
        mouth.frequency.exponentialRampToValueAtTime(800, t + 0.55);
        const g = ac.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.25, t + 0.05);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
        osc.connect(mouth).connect(g).connect(ac.destination);
        osc.start(t);
        osc.stop(t + 0.62);
    },
    // A faulty light: a short electrical buzz (mains hum plus crackle).
    buzz(duration = 0.12, gain = 0.03) {
        // Ambient: stay silent until the browser has allowed audio (after a click).
        if (ctx?.state !== "running") return;
        const ac = ctx;
        const start = ac.currentTime;
        const osc = ac.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.value = 100;
        const g = ac.createGain();
        g.gain.setValueAtTime(gain, start);
        g.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        osc.connect(g).connect(ac.destination);
        osc.start(start);
        osc.stop(start + duration);
        noiseBurst({ duration: duration * 0.6, gain: gain * 2, type: "highpass", freq: 4000 });
    },
};
