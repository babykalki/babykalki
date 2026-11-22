"""rclone stand-in for the v0.5r2 lease-race tests: delays or interferes on purpose, then becomes the real rclone
($REAL_RCLONE). The tests call it through a tiny executable wrapper they write themselves (zip tools drop exec bits)."""
import os, shutil, sys, time

args, e = sys.argv[1:], os.environ
cmd, joined = (args[0] if args else ""), " ".join(args)
if cmd == "copyto" and "lease.json" in joined and e.get("RACE_SLOW_LEASE_WRITE"):
    open(e["RACE_MARK"], "w").close()                       # "I have read the lease and am about to write it"
    time.sleep(float(e["RACE_SLOW_LEASE_WRITE"]))
elif cmd == "cat" and "lease.json" in joined and e.get("RACE_SLOW_LEASE_READ"):
    time.sleep(float(e["RACE_SLOW_LEASE_READ"]))
elif cmd == "check" and e.get("RACE_STEAL_ON_CHECK"):     # another copy takes the lease while this one uploads
    shutil.copyfile(e["RACE_STEAL_ON_CHECK"], os.path.join(e["RACE_REMOTE"], "lease.json"))
os.execv(e["REAL_RCLONE"], [e["REAL_RCLONE"], *args])
