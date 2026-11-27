import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Vector3 } from "three";
import { useView } from "../stores/view";

// Eases the camera towards the target in the store, and adds mouse-look.
export function CameraRig() {
    const look = useRef<Vector3 | null>(null);
    const lastSeq = useRef(-1);
    const sway = useRef({ x: 0, y: 0 });
    const target = useRef(new Vector3());

    useFrame((state, dt) => {
        const { cam, mode } = useView.getState();
        const camera = state.camera;
        if (!look.current) look.current = new Vector3(...cam.look);

        if (cam.seq !== lastSeq.current && cam.instant) {
            camera.position.set(...cam.pos);
            look.current.set(...cam.look);
        }
        lastSeq.current = cam.seq;

        const k = 1 - Math.exp(-dt * 5);
        camera.position.lerp(target.current.set(...cam.pos), k);
        look.current.lerp(target.current.set(...cam.look), k);
        camera.lookAt(look.current);

        // Peeking lets you look around a little; the hallway just sways.
        const strength = mode === "peeking" ? 1 : mode === "hallway" ? 0.12 : 0;
        const s = Math.min(1, dt * 4);
        sway.current.x += (state.pointer.x * strength - sway.current.x) * s;
        sway.current.y += (state.pointer.y * strength - sway.current.y) * s;
        camera.rotateY(-sway.current.x * 0.75);
        camera.rotateX(sway.current.y * 0.3);
    });

    return null;
}
