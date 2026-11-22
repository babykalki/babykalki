---
name: brief
description: "BabyKalki: the founder's briefing now — done, waiting for approval, blocked, overdue, quota, backups."
disable-model-invocation: true
---
# /brief — the founder's briefing (BabyKalki)

The founder typed /brief. Give the briefing NOW, short, in this order, each line with how you know it (tool + id, or "not checked"):

1. **Done since the last briefing** — closed tasks (`list_tasks` with state "done") and committed facts you can see.
2. **Waiting for the founder** — pending approval requests (`list_approvals`, status "pending"): id R-…, item, one line each.
   Remind: "decide on https://<agent host>/bk-approve" — you can never decide for the founder.
3. **Blocked / overdue** — open tasks past their due date (`list_tasks`), with owner.
4. **Health** — read /data/run/supervisor-state.json if you can (backups, last restore test, Librarian round, quota); else say "not checked".
5. **Next** — at most three things you will do, each already a task (`add_task` if you are allowed; otherwise say who should add it).

Use only your OWN Library connector (library-<your role>). If a tool is refused for your role, say so in one line and go on.
Never invent numbers. Facts you have not checked are labelled "not checked".
