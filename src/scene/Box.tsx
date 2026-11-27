import type { ThreeElements } from "@react-three/fiber";
import type { Vec3 } from "./layout";
import { OutlineFor } from "./outline";

type Props = Omit<ThreeElements["mesh"], "position"> & {
    size: Vec3;
    position?: Vec3;
    color: string;
    emissive?: string;
    roughness?: number;
    metalness?: number;
    opacity?: number;
};

// A coloured box: the building block for all the cartoon furniture.
export function Box({ size, color, emissive, roughness = 0.8, metalness = 0, opacity = 1, ...rest }: Props) {
    return (
        <mesh castShadow receiveShadow {...rest}>
            <boxGeometry args={size} />
            <meshStandardMaterial
                color={color}
                emissive={emissive ?? "#000000"}
                roughness={roughness}
                metalness={metalness}
                transparent={opacity < 1}
                opacity={opacity}
            />
            {opacity === 1 && <OutlineFor />}
        </mesh>
    );
}
