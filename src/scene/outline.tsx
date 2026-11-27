import { Outlines } from "@react-three/drei";
import { createContext, useContext } from "react";

// When set, every Box (and other shapes that opt in) inside draws a cartoon outline.
// Used to show which furniture holds a note, and which one the keyhole is aimed at.
// thickness is in screen pixels (drei Outlines with screenspace off).
export type OutlineStyle = { color: string; thickness: number };
export const OutlineContext = createContext<OutlineStyle | null>(null);

export function OutlineFor() {
    const style = useContext(OutlineContext);
    if (!style) return null;
    return <Outlines thickness={style.thickness} color={style.color} />;
}

export const OUTLINE_IDLE: OutlineStyle = { color: "#e8c25a", thickness: 2.5 };
export const OUTLINE_AIMED: OutlineStyle = { color: "#fff6c8", thickness: 5 };
