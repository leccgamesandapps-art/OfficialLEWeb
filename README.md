# OfficialLEWeb

LEID Unified Platform — shared auth hub for **LEMODZ** and **LEVoiceCall**.

- Live: https://officialleweb.vercel.app
- Facebook App ID: `2338993963576572` (LEID ACCOUNT)
- Stack: pure HTML + CSS + JS

## Pages
- `/` — Login / Register
- `/main/Main.html` — Dashboard (LEVoiceCall + LEMODZ connection)
- `/main/Privacy.html` — Privacy Policy
- `/main/ToS.html` — Terms of Service

## SSO
Other LE sites use:
```
https://officialleweb.vercel.app/?return_to={encoded_url}&app=...
```
After login, redirects with `?leid=&name=&fb=&from=officialleweb`.
