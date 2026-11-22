---
name: tasks
description: "BabyKalki: the open tasks in the Library, overdue first, grouped by owner."
disable-model-invocation: true
---
# /tasks — open tasks (BabyKalki)

Call `list_tasks` (state "open") on your own Library connector. Show a compact table: id, title, owner, due, and
"OVERDUE" when the due date is past (today's date is in your context). Overdue first, then by owner
(warden, librarian, reviewer, steward, builder, scout). End with one line: how many open, how many overdue.
If the founder added words after /tasks (an owner name, "done", "all"), filter by them (state "done" or "all" when asked).
Do not close or change tasks here unless the founder explicitly asks.
