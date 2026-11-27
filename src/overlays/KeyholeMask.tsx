// A black screen with a fuzzy keyhole-shaped hole in it, drawn over the canvas.
export function KeyholeMask({ open }: { open: boolean }) {
    return (
        <svg
            className={`keyhole ${open ? "open" : ""}`}
            viewBox="-50 -50 100 100"
            preserveAspectRatio="xMidYMid meet"
            aria-hidden
        >
            <defs>
                <filter id="keyhole-blur" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="2.2" />
                </filter>
                <radialGradient id="keyhole-vignette" cx="0" cy="0" r="55" gradientUnits="userSpaceOnUse">
                    <stop offset="0.55" stopColor="#000" stopOpacity="0" />
                    <stop offset="1" stopColor="#000" stopOpacity="0.75" />
                </radialGradient>
                <mask id="keyhole-mask" maskUnits="userSpaceOnUse" x="-2000" y="-2000" width="4000" height="4000">
                    <rect x="-2000" y="-2000" width="4000" height="4000" fill="white" />
                    <g filter="url(#keyhole-blur)" className="keyhole-shape">
                        <circle cx="0" cy="-14" r="25" fill="black" />
                        <path d="M -12 2 L -22 50 L 22 50 L 12 2 Z" fill="black" />
                    </g>
                </mask>
            </defs>
            <rect x="-2000" y="-2000" width="4000" height="4000" fill="url(#keyhole-vignette)" />
            <rect x="-2000" y="-2000" width="4000" height="4000" fill="#050302" mask="url(#keyhole-mask)" />
            {/* A faint aiming ring in the middle of the keyhole. */}
            <g className="keyhole-shape">
                <circle cx="0" cy="-14" r="1.6" fill="none" stroke="#fff6dc" strokeOpacity="0.45" strokeWidth="0.35" />
            </g>
        </svg>
    );
}
