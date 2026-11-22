---
name: connections
description: "BabyKalki: the Connections Register — every key and account the company uses, green/amber/red, cap and expiry."
disable-model-invocation: true
---
# /connections — the Connections Register (BabyKalki)

Call `list_connections` on your own Library connector. Show one row per connection: id, what it is, owner citizen,
level/scope (the narrowest token), state as 🟢 green / 🟠 amber / 🔴 red, spend against cap, expiry date, last check.
Flag in one line each: anything red, anything expiring within 14 days, anything over 80 % of its cap, anything with no
owner. Never print a secret value (the register holds names and metadata only — if you ever see a key, stop and tell
the founder). Only the Steward can register or update a connection; others suggest the change to the Steward.
