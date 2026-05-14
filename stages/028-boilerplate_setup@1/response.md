Blocked on source availability.

I completed the required reads from workflow artifacts and wrote the requested evidence file:
- [boilerplate-setup.md](/home/daytona/workspace/.workflow/iphone-app-factory/evidence/boilerplate-setup.md)

Critical blocker:
- `apps/waketask-iphone` cannot be created from `SwiftAIBoilerplatePro/SwiftAIBoilerplatePro-Distribution` because this environment cannot reach GitHub (`Could not resolve host: github.com`), and no local boilerplate copy exists in the workspace.

Also identified:
- `scripts/iphone-app-factory/bootstrap.mjs` currently does not clone/copy the boilerplate; it only writes workflow/context files. So its `ok:true` output is a false setup signal for this stage.

To proceed, I need one of:
1. A local copy of `SwiftAIBoilerplatePro-Distribution` in this workspace.
2. Network access enabled for `git clone`.
3. A tarball/zip of the boilerplate added to the workspace.