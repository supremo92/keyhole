import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { MathUtils, PerspectiveCamera, Vector3 } from "three";
import { useView } from "../stores/view";
import { AIM_NDC } from "./layout";

// Eases the camera towards the target in the store, and adds mouse-look.
export function CameraRig() {
    const look = useRef<Vector3 | null>(null);
    const lastSeq = useRef(-1);
    const turn = useRef({ yaw: 0, pitch: 0 });
    const target = useRef(new Vector3());

    useFrame((state, dt) => {
        const { cam, mode } = useView.getState();
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

        // Peeking: turn so that whatever was under the mouse pointer moves into the
        // centre of the keyhole (the aim point). The hallway just sways a little.
        let yaw = 0;
        let pitch = 0;
        const { x, y } = state.pointer;
        if (mode === "peeking") {
            const tanV = Math.tan(MathUtils.degToRad(camera.fov / 2));
            const tanH = tanV * camera.aspect;
            yaw = -Math.atan((x - AIM_NDC[0]) * tanH);
            pitch = Math.atan((y - AIM_NDC[1]) * tanV);
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
