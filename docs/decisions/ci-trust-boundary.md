# CI provenance and secret scanning

Gitleaks remains a required pull request check for the public repository.
[GitHub Secret Scanning](https://docs.github.com/en/code-security/how-tos/secure-your-secrets/detect-secret-leaks/enable-secret-scanning)
and repository push protection complement the Gitleaks check by detecting
supported secrets in GitHub and blocking supported secrets during pushes.

- **SEC-01 (CI provenance), not planned.** The maintainer accepts that the
  workflow, planner and final validator come from the simulated PR merge. A PR
  can therefore change the code that decides whether its checks passed. GitHub
  Secret Scanning detects supported secrets. Independent CI provenance would
  require a separate control.
- **SEC-02 (Gitleaks provenance), accepted.** The maintainer keeps the current
  automatic pull request check and accepts its PR-supplied workflow definition.
  An independent check on this personal repository would require a dedicated
  GitHub App and a separate scanner. The base revision still supplies the
  scanner version and policy. GitHub applies its existing workflow approval
  policy to fork and updater PRs.
