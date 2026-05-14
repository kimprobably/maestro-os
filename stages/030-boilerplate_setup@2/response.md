Blocked on missing source boilerplate.

I verified in this workspace that:

- `apps/waketask-iphone` does not exist.
- `SwiftAIBoilerplatePro-Distribution` is not present anywhere locally (searched under `/home/daytona/workspace` and `/home/daytona` at practical depth).
- No fallback iOS boilerplate structure exists (`Packages/`, `.xcodeproj`, `CompositionRoot` absent).
- `scripts/iphone-app-factory/bootstrap.mjs` currently does not clone/copy the boilerplate; it only writes workflow metadata.
- So the gate failure is expected and deterministic.

I updated the required evidence file with commands, findings, and risks:

- [boilerplate-setup.md](/home/daytona/workspace/.workflow/iphone-app-factory/evidence/boilerplate-setup.md)

To continue, I need one of:
1. A local checkout of `SwiftAIBoilerplatePro-Distribution` in the workspace, or
2. A tar/zip of it placed in the workspace, or
3. Network-enabled clone access to `github.com` for that repo.

Once provided, I can immediately materialize `apps/waketask-iphone`, rebrand it correctly, and rerun the boilerplate gate.