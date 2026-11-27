import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Canvas } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { useDoors, useNotes } from "./lib/api";
import { ensureSession } from "./lib/auth-client";
import { leaveRoom } from "./lib/flow";
import { Hud } from "./overlays/Hud";
import { KeyholeMask } from "./overlays/KeyholeMask";
import { NamePrompt } from "./overlays/NamePrompt";
import { PaperSheet } from "./overlays/PaperSheet";
import { CameraRig } from "./scene/CameraRig";
import { Hallway } from "./scene/Hallway";
import { VIEWS } from "./scene/layout";
import { Room } from "./scene/Room";
import { useView } from "./stores/view";

const queryClient = new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } } });

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
    const { mode, doorId, doorSlot, noteId, blackout, keyhole } = useView();
    const doors = useDoors(auth === "ready");
    const door = doors.data?.find((d) => d.id === doorId);
    const notes = useNotes(doorId);
    const note = notes.data?.find((n) => n.id === noteId);

    useEffect(() => {
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

    const loading = auth === "pending" || doors.isPending;
    const failed = auth === "error" || doors.isError;

    return (
        <div className="app">
            {/* The stage holds only the canvas (and its labels). Pointer positions are read in
                page coordinates, so labels over the canvas don't throw off hover and mouse-look,
                and clicks on the overlay buttons never reach the 3D scene. */}
            <div className="stage" ref={appRef}>
                <Canvas
                    shadows
                    camera={{ fov: 60, position: VIEWS.hallway.pos, near: 0.05, far: 200 }}
                    dpr={[1, 2]}
                    eventSource={appRef as React.RefObject<HTMLElement>}
                    eventPrefix="client"
                >
                    <color attach="background" args={["#0d0907"]} />
                    <ambientLight intensity={0.5} />
                    <hemisphereLight args={["#fff3dd", "#3a2a1e", 0.5]} />
                    <CameraRig />
                    {doors.data && <Hallway doors={doors.data} />}
                    {door && <Room door={door} />}
                </Canvas>
            </div>

            <KeyholeMask open={keyhole} />
            <Hud door={door} notes={notes.data} />

            {mode === "writing" && door && <PaperSheet mode="write" doorId={door.id} />}
            {mode === "reading" && door && note && <PaperSheet key={note.id} mode="read" doorId={door.id} note={note} />}
            {mode === "naming" && doorSlot !== null && <NamePrompt slot={doorSlot} />}

            <div className={`blackout ${blackout ? "on" : ""}`} />
            {(loading || failed) && (
                <div className="splash">
                    <div className="splash-key">⚿</div>
                    <h1>The Keyhole</h1>
                    <p>{failed ? "The hallway is locked. Try refreshing the page." : "Finding your hallway..."}</p>
                </div>
            )}
        </div>
    );
}
