Blocked on source acquisition; I documented everything in [boilerplate-setup.md](/home/daytona/workspace/.workflow/iphone-app-factory/evidence/boilerplate-setup.md).

What I found:
- `apps/waketask-iphone` does not exist.
- `bootstrap.mjs` does not clone/copy the boilerplate; it only creates workflow context files.
- No local `SwiftAIBoilerplatePro-Distribution` (or iOS boilerplate markers like `App.xcconfig`, `.xcodeproj`, `Packages/Core`) exists in this workspace.
- Direct git fetch fails (`Could not resolve host: github.com`).
- GitHub connector search returned no repository for `SwiftAIBoilerplatePro-Distribution`.

What I need to proceed now:
1. A local path to the boilerplate distribution, or  
2. A repo archive placed in the workspace (`.zip`/`.tar.gz`), or  
3. Restored DNS/network access to fetch `https://github.com/SwiftAIBoilerplatePro/SwiftAIBoilerplatePro-Distribution`.

As soon as you provide one of those, I’ll complete clone/rebrand into `apps/waketask-iphone`, read the required boilerplate docs, and rerun `boilerplate-contract-gate.mjs`.