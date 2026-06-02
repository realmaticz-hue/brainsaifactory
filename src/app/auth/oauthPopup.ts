export function oauthPopup(provider: string, authUrl: string) {

    const width = 600
    const height = 700
    const left = window.innerWidth / 2 - width / 2
    const top = window.innerHeight / 2 - height / 2

    const popup = window.open(
        authUrl,
        "oauthPopup",
        `width=${width},height=${height},left=${left},top=${top}`
    )

    return new Promise((resolve) => {

        window.addEventListener("message", (event) => {

            if (event.data.type === "oauth_success") {
                resolve(event.data)
            }

        })

    })
}