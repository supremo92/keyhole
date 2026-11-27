import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Door, Note } from "../../shared/types";

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

export const useDoors = (enabled: boolean) =>
    useQuery({ queryKey: ["doors"], queryFn: () => request<Door[]>("/api/doors"), enabled });

// Shared by the hook and by prefetching when you click a door.
export const notesQuery = (doorId: string | null) => ({
    queryKey: ["notes", doorId],
    queryFn: () => request<Note[]>(`/api/doors/${doorId}/notes`),
});

export const useNotes = (doorId: string | null) => useQuery({ ...notesQuery(doorId), enabled: !!doorId });

export function useCreateDoor() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (input: { doorSlot: number; name: string }) =>
            request<Door>("/api/doors", { method: "POST", body: JSON.stringify(input) }),
        onSuccess: (door) => qc.setQueryData<Door[]>(["doors"], (old) => [...(old ?? []), door]),
    });
}

export function useCreateNote() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ doorId, ...input }: { doorId: string; title: string; body: string }) =>
            request<Note>(`/api/doors/${doorId}/notes`, { method: "POST", body: JSON.stringify(input) }),
        onSuccess: (note) => qc.setQueryData<Note[]>(["notes", note.doorId], (old) => [...(old ?? []), note]),
    });
}

export function useUpdateNote() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...input }: { id: string; title: string; body: string }) =>
            request<Note>(`/api/notes/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
        onSuccess: (note) =>
            qc.setQueryData<Note[]>(["notes", note.doorId], (old) =>
                (old ?? []).map((n) => (n.id === note.id ? note : n)),
            ),
    });
}
