import { QueryClientProvider } from "@tanstack/react-query";
import { Canvas } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useShift } from "./lib/api";
import { ensureSession } from "./lib/auth-client";
import { leaveRoom } from "./lib/flow";
import { queryClient } from "./lib/queryClient";
import { warmUpAudio } from "./lib/sound";
import { Hud } from "./overlays/Hud";
import { Intro } from "./overlays/Intro";
import { KeyholeMask } from "./overlays/KeyholeMask";
import { NoteDesk } from "./overlays/NoteDesk";
import { BoardOverlay, EyeFlash, Finale, LockerOverlay, ResponseNote, Tannoy } from "./overlays/Readings";
import { CameraRig } from "./scene/CameraRig";
import { Hallway } from "./scene/Hallway";
import { KeyholeAim } from "./scene/KeyholeAim";
import { VIEWS, WALK } from "./scene/layout";
import { Room } from "./scene/Room";
import { roomDef } from "./scene/rooms";
import { SlidingPaper } from "./scene/SlidingPaper";
import { Walker } from "./scene/Walker";
import { useView } from "./stores/view";

const INTRO_KEY = "keyhole-intro-seen";

export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <Keyhole />
        </QueryClientProvider>
    );
}

function Keyhole() {
    const [auth, setAuth] = useState<"pending" | "ready" | "error">("pending");
    const appRef = useRef<HTMLDivElement>(null);
    const { mode, roomId, roomShown, response, blackout, keyhole } = useView(
        useShallow((s) => ({
            mode: s.mode,
            roomId: s.roomId,
            roomShown: s.roomShown,
            response: s.response,
            blackout: s.blackout,
            keyhole: s.keyhole,
        })),
    );
    const aimed = useView((s) => s.mode === "peeking" && s.hoveredId !== null);
    const doormat = useView((s) => s.doormat);
    const shift = useShift(auth === "ready");
    const [showIntro, setShowIntro] = useState(() => !localStorage.getItem(INTRO_KEY));

    const loading = auth === "pending" || shift.isPending;
    const failed = auth === "error" || shift.isError;
    const introOpen = showIntro && !loading && mode === "hallway";
    useEffect(() => useView.getState().set({ paused: introOpen }), [introOpen]);

    const closeIntro = () => {
        localStorage.setItem(INTRO_KEY, "1");
        setShowIntro(false);
    };

    useEffect(() => {
        warmUpAudio();
        ensureSession()
            .then(() => setAuth("ready"))
            .catch(() => setAuth("error"));
    }, []);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") void leaveRoom();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    return (
        <div className="app">
            {/* The stage holds only the canvas (and its labels). Pointer positions are read in
                page coordinates, so labels over the canvas don't throw off hover and mouse-look,
                and clicks on the overlay buttons never reach the 3D scene. */}
            <div className="stage" ref={appRef}>
                <Canvas
                    shadows
                    camera={{ fov: 60, position: VIEWS.hallway(WALK.start).pos, near: 0.05, far: 200 }}
                    dpr={[1, 2]}
                    eventSource={appRef as React.RefObject<HTMLElement>}
                    eventPrefix="client"
                >
                    <color attach="background" args={["#0d0907"]} />
                    {/* Night shift: dimmer than the old daytime building. */}
                    <ambientLight intensity={0.32} />
                    <hemisphereLight args={["#e8eaff", "#2a1e16", 0.35]} />
                    <CameraRig />
                    <Walker />
                    <KeyholeAim />
                    {shift.data && <Hallway shift={shift.data} />}
                    {shift.data && roomShown && <Room room={roomDef(roomShown)} />}
                    <SlidingPaper />
                </Canvas>
            </div>

            <KeyholeMask open={keyhole} aimed={aimed} showRing={!doormat} />
            <EyeFlash />
            <Hud shift={shift.data} onHelp={() => setShowIntro(true)} />
            <Tannoy />

            {mode === "note" && roomId && shift.data && <NoteDesk key={roomId} roomId={roomId} shift={shift.data} />}
            {mode === "response" && response && <ResponseNote response={response} />}
            {mode === "board" && <BoardOverlay shift={shift.data} />}
            {mode === "locker" && <LockerOverlay shift={shift.data} />}
            {mode === "finale" && <Finale />}
            {introOpen && <Intro onClose={closeIntro} />}

            <div className={`blackout ${blackout ? "on" : ""}`} />
            {(loading || failed) && (
                <div className="splash">
                    <div className="splash-key">⚿</div>
                    <h1>The Keyhole</h1>
                    <p>{failed ? "The Institute is locked. Try refreshing the page." : "Clocking in for the night shift..."}</p>
                </div>
            )}
        </div>
    );
}
