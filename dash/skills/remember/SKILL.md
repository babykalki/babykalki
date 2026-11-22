---
name: remember
description: "BabyKalki: propose what the founder just said as a Library fact (the Librarian round commits it)."
disable-model-invocation: true
---
# /remember — propose a fact (BabyKalki)

The founder typed /remember followed by something to remember. Turn it into ONE short, checkable fact and call
`propose_fact` on your own Library connector with:
- text: the fact in one sentence, in the founder's words where possible;
- topic: one word (company, people, product, money, customers, rules …);
- instrument: "the founder said so in a <your role> session on <today's date>";
- source: "founder".
Show the proposal id P-… back. Then ask for a Librarian round now: `touch /data/run/librarian-requests/NOW`
(say so if you cannot). Tell the founder: "Proposed as P-…; the Librarian round commits it within minutes — see the
status page." If the text contains a password, key or token: do NOT propose it; say why.
If nothing follows /remember, ask what to remember.
