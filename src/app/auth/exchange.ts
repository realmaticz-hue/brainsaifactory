import { create } from "zustand"
import { connectProvider } from "./connectProvider"
export const useSocialStore = create((set) => ({
    connections: {},
    setConnection(provider, token) {
        set((state) => ({
            connections: {
                ...state.connections,
                [provider]: token
            }
        }))
    }
}))

export default async function handler(req, res) {
    const { provider, code } = req.body

    const response = await fetch(
        `https://api.${provider}.com/oauth/token`,
        {
            method: "POST",
            body: JSON.stringify({
                code,
                client_id: process.env.CLIENT_ID,
                client_secret: process.env.CLIENT_SECRET,
            }),
        }
    )

    const data = await response.json()
    res.json(data)
}


