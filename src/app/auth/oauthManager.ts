import { oauthPopup } from "./oauthPopup"

export async function connectProvider(provider: string) {

    const authUrl = `/api/oauth/start?provider=${provider}`

    const result = await oauthPopup(provider, authUrl) as { code?: string }

    if (result?.code) {

        const tokenRes = await fetch("/api/oauth/exchange", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(result)
        })

        return await tokenRes.json()
    }
}