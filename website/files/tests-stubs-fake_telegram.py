"""Stand-ins for the community desk tests (v0.5): a fake Telegram Bot API and a fake OpenAI-compatible LLM, both on
127.0.0.1 in a thread. No network. The fake Telegram keeps every call so tests can check what the bot did."""
import itertools, json, threading, time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

BOT = {"id": 999000111, "is_bot": True, "first_name": "Desk", "username": "bk_desk_bot"}
ADMIN_ACTIONS = ("deleteMessage", "restrictChatMember", "banChatMember")


class _Server:
    def __init__(self, handler):
        self.httpd = ThreadingHTTPServer(("127.0.0.1", 0), handler)
        self.httpd.owner = self
        self.port = self.httpd.server_address[1]
        threading.Thread(target=self.httpd.serve_forever, daemon=True).start()

    def close(self):
        self.httpd.shutdown(); self.httpd.server_close()


class FakeTelegram(_Server):
    """/bot<token>/<method>. Wrong token ⇒ 401. admin=False ⇒ delete/restrict/ban answer 400 'not enough rights'.
    getUpdates returns updates with update_id >= offset (and forgets older ones, like Telegram). replay_all=True ignores
    the offset (to prove the bot itself never handles an update twice)."""

    def __init__(self, token):
        self.token, self.updates, self.calls, self.admin, self.replay_all = token, [], [], True, False
        self.lock, self.mid, self.uid = threading.Lock(), itertools.count(5000), itertools.count(1)
        super().__init__(_TgHandler)
        self.url = f"http://127.0.0.1:{self.port}"

    def push(self, message=None, **upd):
        with self.lock:
            u = {"update_id": next(self.uid), **upd}
            if message is not None:
                message.setdefault("message_id", next(self.mid)); message.setdefault("date", int(time.time()))
                u["message"] = message
            self.updates.append(u)
            return u

    def sent(self, chat=None):
        return [p for m, p in list(self.calls) if m == "sendMessage" and (chat is None or p.get("chat_id") == chat)]

    def texts(self, chat=None):
        return [p["text"] for p in self.sent(chat)]

    def called(self, method):
        return [p for m, p in list(self.calls) if m == method]

    def reset(self):
        with self.lock:
            self.calls.clear()


class _TgHandler(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def _send(self, code, obj):
        b = json.dumps(obj).encode()
        self.send_response(code); self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(b))); self.end_headers(); self.wfile.write(b)

    def do_POST(self):
        tg = self.server.owner
        n = int(self.headers.get("Content-Length") or 0)
        params = json.loads(self.rfile.read(n) or b"{}")
        parts = self.path.strip("/").split("/")
        if len(parts) != 2 or parts[0] != "bot" + tg.token:
            return self._send(401, {"ok": False, "error_code": 401, "description": "Unauthorized"})
        method = parts[1]
        with tg.lock:
            tg.calls.append((method, params))
        if method == "getMe":
            return self._send(200, {"ok": True, "result": BOT})
        if method == "deleteWebhook":
            return self._send(200, {"ok": True, "result": True})
        if method == "getUpdates":
            off = params.get("offset") or 0
            with tg.lock:
                if not tg.replay_all:
                    tg.updates = [u for u in tg.updates if u["update_id"] >= off]
                ups = list(tg.updates)
            if not ups:
                time.sleep(min(0.2, float(params.get("timeout") or 0)))
            return self._send(200, {"ok": True, "result": ups})
        if method == "sendMessage":
            return self._send(200, {"ok": True, "result": {"message_id": next(tg.mid), "chat": {"id": params.get("chat_id")},
                                                           "text": params.get("text")}})
        if method in ADMIN_ACTIONS:
            if not tg.admin:
                return self._send(400, {"ok": False, "error_code": 400, "description": "Bad Request: not enough rights"})
            return self._send(200, {"ok": True, "result": True})
        return self._send(404, {"ok": False, "error_code": 404, "description": "Not Found: method not found"})


class FakeLLM(_Server):
    """POST /v1/chat/completions (OpenAI) or /v1/messages (Anthropic). reply = str or callable(request_body) -> str.
    Keeps every request (path + headers + body)."""

    def __init__(self, reply="It is free. (see: FAQ: Is it free?)"):
        self.reply, self.requests, self.status, self.thinking = reply, [], 200, False
        super().__init__(_LlmHandler)
        self.url = f"http://127.0.0.1:{self.port}/v1/chat/completions"
        self.anthropic_url = f"http://127.0.0.1:{self.port}/v1/messages"


class _LlmHandler(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def do_POST(self):
        llm = self.server.owner
        n = int(self.headers.get("Content-Length") or 0)
        body = json.loads(self.rfile.read(n) or b"{}")
        llm.requests.append({"path": self.path, "headers": dict(self.headers), "body": body})
        if llm.status != 200:
            self.send_response(llm.status); self.end_headers(); return
        text = llm.reply(body) if callable(llm.reply) else llm.reply
        if self.path.endswith("/v1/messages"):                 # Anthropic-compatible (the Coding Plan endpoint)
            blocks = [{"type": "text", "text": text}]
            if llm.thinking:                                    # GLM on the Coding Plan, thinking not disabled
                blocks.insert(0, {"type": "thinking", "thinking": "Hidden reasoning: the canary is in my prompt."})
            b = json.dumps({"type": "message", "role": "assistant", "content": blocks,
                            "usage": {"input_tokens": 30, "output_tokens": 12}}).encode()
        else:
            b = json.dumps({"choices": [{"message": {"role": "assistant", "content": text}}], "usage": {"total_tokens": 42}}).encode()
        self.send_response(200); self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(b))); self.end_headers(); self.wfile.write(b)
