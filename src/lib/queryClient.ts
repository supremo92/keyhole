import { QueryClient } from "@tanstack/react-query";

// One shared client, so non-React code (the camera sequences) can prefetch and read data.
export const queryClient = new QueryClient({
    defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } },
});
