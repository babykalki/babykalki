---
name: handoff
description: "BabyKalki: hand work to another citizen — a Library task with an owner and a date, and how to open that citizen."
disable-model-invocation: true
---
# /handoff — give work to another citizen (BabyKalki)

The founder typed /handoff <citizen> <what>. Citizens: warden, librarian, reviewer, steward, builder, scout (or their
names from the self cards).
1. Write the task as one line with a clear done-when, and a due date (ask if unclear; default: 3 days).
2. Call `add_task(title, owner, due)` on your own Library connector. If your role may not add tasks, say so and draft
   the exact task text for the Warden instead.
3. Tell the founder how to start that citizen: "BabyKalki panel (top left) → New session with <name>", or the citizen's
   button on the empty home page, then paste: "Pick up task T-… from the Library."
Never act as the other citizen and never use its connector.
