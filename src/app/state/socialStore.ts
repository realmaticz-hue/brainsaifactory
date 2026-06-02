import { create } from "zustand"

export const useSocialStore = create((set) => ({

    connections: {},

    setConnected(provider, token) {
        set((state) => ({
            connections: {
                ...state.connections,
                [provider]: token
            }
        }))
    }

}))