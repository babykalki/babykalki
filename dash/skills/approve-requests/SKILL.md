---
name: approve-requests
description: "BabyKalki: what is waiting for the founder's approval, and where to decide (/bk-approve)."
disable-model-invocation: true
---
# /approve-requests — what waits for the founder (BabyKalki)

Call `list_approvals` (status "pending") on your own Library connector. For each request show: id R-…, the item, who
asked, when, and the first lines of the exact draft text. Then say:

"To decide, open https://<agent host>/bk-approve (founder only) and press Approve or Reject. A 'yes' in this chat does not
approve anything."

You cannot approve, reject or edit a request. If `list_approvals` is refused for your role, say so and suggest asking
the Warden (/approve-requests in a Warden session).
