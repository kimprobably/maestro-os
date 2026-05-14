Blocked on filesystem permissions inside `apps/waketask-iphone`.

I validated scope and attempted edits, but writes to required paths fail (`Permission denied`) because app subdirectories/files are owned by `nobody:root` and are not writable (e.g. `SwiftAIBoilerplatePro/*`, `Packages/*`, `Config/*`, `.github/*`).

I did write the requested evidence file:
- [foundation.md](/home/daytona/workspace/.workflow/iphone-app-factory/evidence/foundation.md)

Unblock commands:
```bash
sudo chown -R root:root /home/daytona/workspace/apps/waketask-iphone
sudo find /home/daytona/workspace/apps/waketask-iphone -type d -exec chmod u+rwx {} \;
sudo find /home/daytona/workspace/apps/waketask-iphone -type f -exec chmod u+rw {} \;
```

After you run that, I can immediately complete the full foundation implementation (brand/bundle identity, legal docs, placeholders, secrets templates, macOS CI skeleton, Appium skeleton).