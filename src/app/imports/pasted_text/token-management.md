When you store a token, always store expiration.

Example DB record:

{
  "provider": "facebook",
  "access_token": "EAABsb...",
  "refresh_token": "AQABAA...",
  "expires_at": 1773600000
}
2️⃣ Token Expiration Checker

Create:

/auth/tokenMonitor.ts
export function tokenNeedsRefresh(expiresAt:number){

  const now = Date.now() / 1000

  const buffer = 300 // refresh 5 minutes early

  return now > (expiresAt - buffer)

}
3️⃣ Refresh Token Engine

Create:

/auth/refreshToken.ts
export async function refreshToken(provider:string, refreshToken:string){

  const res = await fetch("/api/oauth/refresh", {
    method:"POST",
    headers:{ "Content-Type":"application/json"},
    body: JSON.stringify({
      provider,
      refresh_token: refreshToken
    })
  })

  return res.json()
}
4️⃣ Background Token Watcher

Runs every few minutes.

import { tokenNeedsRefresh } from "./tokenMonitor"
import { refreshToken } from "./refreshToken"

export async function monitorTokens(connections){

  for(const provider in connections){

    const token = connections[provider]

    if(tokenNeedsRefresh(token.expires_at)){

      const newToken = await refreshToken(provider, token.refresh_token)

      connections[provider] = newToken

      console.log("Token refreshed:", provider)

    }

  }

}
5️⃣ Start Token Watcher

Example React hook:

useEffect(()=>{

  const interval = setInterval(()=>{

    monitorTokens(connections)

  }, 300000) // every 5 minutes

  return ()=>clearInterval(interval)

},[connections])
6️⃣ Refresh API Endpoint

Server endpoint:

/api/oauth/refresh

Example:

export default async function handler(req,res){

  const { provider, refresh_token } = req.body

  const response = await fetch(
    `https://api.${provider}.com/oauth/token`,
    {
      method:"POST",
      body: JSON.stringify({
        grant_type:"refresh_token",
        refresh_token
      })
    }
  )

  const data = await response.json()

  res.json(data)

}
7️⃣ Failure Recovery (Important)

If refresh fails:

if(data.error){

  notifyUser("Reconnect "+provider)

}

Most SaaS tools trigger reconnect UI here.

🚀 What This Gives Your App

Your AI Blog Post Generator will now have:

✔ Auto reconnect for social accounts
✔ Expired token recovery
✔ Background token refresh
✔ Multi-platform support
✔ Fewer support issues

This is exactly how social platforms like Hootsuite and Buffer maintain stable social connections.