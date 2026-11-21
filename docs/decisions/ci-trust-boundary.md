# CI provenance and secret scanning

The maintainer plans to make the repository public and use
[GitHub Secret Scanning](https://docs.github.com/en/code-security/how-tos/secure-your-secrets/detect-secret-leaks/enable-secret-scanning).
Gitleaks remains a required pull request check until the replacement is verified
and the change to the required checks is authorized.

- **SEC-01 (CI provenance), not planned.** The maintainer accepts that the
  workflow, planner and final validator come from the simulated PR merge. A PR
  can therefore change the code that decides whether its checks passed. GitHub
  Secret Scanning detects supported secrets. Independent CI provenance would
  require a separate control.
- **GH-01 (Gitleaks updater recovery), not planned.** The planned switch makes
  further changes to the updater unnecessary. If PR creation fails after the
  update branch is pushed, the updater skips that version until manual
  intervention or a new upstream release.
