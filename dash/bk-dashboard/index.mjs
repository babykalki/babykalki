// index.mjs — host half of the BabyKalki dashboard plugin (v0.7, 20 Nov 2026). MIT licence.
// It does nothing on the server: dsh needs a host-side row so it can serve the browser half (./client → client.js).
// client.js is WRITTEN BY bk_dash.py at every start from client.tpl.js (the citizens' names and the links are filled in).
export const name = 'babykalki-dashboard'
export function apply () {}
