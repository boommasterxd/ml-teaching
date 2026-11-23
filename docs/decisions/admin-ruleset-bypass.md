# Administrator bypass for the default branch

The repository owner intentionally retains the `Always allow` bypass in the active
[`Protect main` ruleset](https://github.com/boommasterxd/ml-teaching/rules/6914185)
to preserve the option to override branch protection deliberately. GitHub grants
the bypass only to the repository administrator role, which only the owner holds.

The bypass applies to the entire ruleset. When the owner uses it, GitHub can accept
an update to `main` without a pull request or successful required checks. The
normal pull request workflow still requires `CI`, `gitleaks` and `Validate PR Title`.
