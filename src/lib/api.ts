import { useMutation, useQuery } from "@tanstack/react-query";
import type { AnswerResult, RoomId, ShiftState } from "../../shared/lexicon";
import { queryClient } from "./queryClient";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(path, {
        ...init,
        headers: { "content-type": "application/json", ...init?.headers },
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
        const message = typeof data?.error === "string" ? data.error : `Something went wrong (${res.status})`;
        throw new Error(message);
    }
    return data as T;
}

// The night so far: which rooms are waiting, solved or locked, and your Phrasebook.
export const useShift = (enabled: boolean) =>
    useQuery({ queryKey: ["shift"], queryFn: () => request<ShiftState>("/api/shift"), enabled });

export const getShift = () => queryClient.getQueryData<ShiftState>(["shift"]);

// Slide a reply (glyphs) under a door. The Worker checks it.
export function useAnswer() {
    return useMutation({
        mutationFn: ({ roomId, reply }: { roomId: RoomId; reply: string[] }) =>
            request<AnswerResult>(`/api/rooms/${roomId}/answer`, { method: "POST", body: JSON.stringify({ reply }) }),
        onSuccess: (result) => queryClient.setQueryData(["shift"], result.shift),
    });
}
