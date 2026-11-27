import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { MathUtils, PerspectiveCamera, Vector3 } from "three";
import { useView } from "../stores/view";
import { AIM_NDC, DOORMAT_PITCH } from "./layout";

// Furthest the peeking view turns (radians) at the screen edges.
const MAX_YAW = 0.9;
const MAX_UP = 0.45;
const MAX_DOWN = 0.55;

// Eases the camera towards the target in the store, and adds mouse-look.
export function CameraRig() {
    const look = useRef<Vector3 | null>(null);
    const lastSeq = useRef(-1);
    const turn = useRef({ yaw: 0, pitch: 0 });
    const target = useRef(new Vector3());

    useFrame((state, dt) => {
        const { cam, mode, doormat } = useView.getState();
        const camera = state.camera as PerspectiveCamera;
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

        // Peeking: the mouse turns the view a long way, so the far sides of the room are
        // reachable well before the edge of the screen. In the doormat strip at the bottom
        // the view settles, tilted down at the floor icons. The hallway just sways.
        let yaw = 0;
        let pitch = 0;
        const { x, y } = state.pointer;
        if (mode === "peeking") {
            if (doormat) {
                pitch = DOORMAT_PITCH;
            } else {
                yaw = -MathUtils.clamp(x, -1, 1) * MAX_YAW;
                // Above the aim point looks up a little; below it looks down further.
                const dy = y - AIM_NDC[1];
                pitch = dy > 0 ? (dy / (1 - AIM_NDC[1])) * MAX_UP : (dy / (1 + AIM_NDC[1])) * MAX_DOWN;
            }
        } else if (mode === "hallway") {
            yaw = -x * 0.08;
            pitch = y * 0.04;
        }
        const s = Math.min(1, dt * 4);
        turn.current.yaw += (yaw - turn.current.yaw) * s;
        turn.current.pitch += (pitch - turn.current.pitch) * s;
        camera.rotateY(turn.current.yaw);
        camera.rotateX(turn.current.pitch);
    });

    return null;
}
