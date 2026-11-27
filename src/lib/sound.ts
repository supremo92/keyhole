// Tiny synthesised sound effects (no audio files needed).
let ctx: AudioContext | null = null;

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
};
