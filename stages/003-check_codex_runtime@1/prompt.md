Goal: Verify Claude Code and Codex CLI auth work inside a fresh Daytona sandbox

## Completed stages
- **check_claude_runtime**: succeeded
  - Script: `mkdir -p .workflow/fabro; node -e "const fs=require('fs'),path=require('path'),os=require('os'); const {spawnSync}=require('child_process'); const clean=(value)=>String(value||'').replace(/sk-[A-Za-z0-9_-]+/g,'[redacted]').trim().slice(0,800); const unresolvedTemplate=(value)=>value.charCodeAt(0)===123 && value.charCodeAt(1)===123; const usable=(key)=>{const value=process.env[key]||''; return Boolean(value && !unresolvedTemplate(value));}; const installCreds=()=>{const value=process.env.CLAUDE_CODE_CREDENTIALS_JSON_BASE64||''; if(!value || unresolvedTemplate(value)) return false; const raw=Buffer.from(value,'base64').toString('utf8'); const data=JSON.parse(raw); if(!data.claudeAiOauth?.accessToken || !data.claudeAiOauth?.refreshToken) throw new Error('invalid Claude credentials JSON'); const dir=path.join(os.homedir(),'.claude'); fs.mkdirSync(dir,{recursive:true}); fs.writeFileSync(path.join(dir,'.credentials.json'), raw,{mode:0o600}); return true;}; const installedCredentials=installCreds(); const credentialsFile=fs.existsSync(path.join(os.homedir(),'.claude','.credentials.json')); const run=(cmd,args,timeout=120000)=>{const r=spawnSync(cmd,args,{encoding:'utf8',timeout,env:{...process.env,CI:'1'}}); return {cmd:[cmd,...args].join(' '), status:r.status, signal:r.signal||null, stdout:clean(r.stdout), stderr:clean(r.stderr)};}; const env={CLAUDE_CODE_OAUTH_TOKEN:usable('CLAUDE_CODE_OAUTH_TOKEN'), CLAUDE_CODE_CREDENTIALS_JSON_BASE64:usable('CLAUDE_CODE_CREDENTIALS_JSON_BASE64'), installedCredentials, credentialsFile}; const checks=[run('claude',['--version'],45000), run('claude',['-p','Reply with exactly OK.'],120000)]; const missing=credentialsFile ? [] : ['claude_credentials_file']; const failed=checks.filter((check)=>check.status!==0); const report={ok:missing.length===0 && failed.length===0, env, missing, checks, failed}; fs.writeFileSync('.workflow/fabro/daytona-cli-auth-runtime-smoke.json', JSON.stringify(report,null,2)+'\n'); console.log(JSON.stringify(report,null,2)); if(!report.ok) process.exit(1);"`
  - Output:
    ```
    (2 lines omitted)
      "env": {
        "CLAUDE_CODE_OAUTH_TOKEN": true,
        "CLAUDE_CODE_CREDENTIALS_JSON_BASE64": true,
        "installedCredentials": true,
        "credentialsFile": true
      },
      "missing": [],
      "checks": [
        {
          "cmd": "claude --version",
          "status": 0,
          "signal": null,
          "stdout": "2.1.141 (Claude Code)",
          "stderr": ""
        },
        {
          "cmd": "claude -p Reply with exactly OK.",
          "status": 0,
          "signal": null,
          "stdout": "OK.",
          "stderr": ""
        }
      ],
      "failed": []
    }
    ```


Reply with exactly OK.