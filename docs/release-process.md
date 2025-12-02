
# Release Process (Automated with release-please)

This project uses [release-please](https://github.com/google-github-actions/release-please-action) to fully automate versioning, changelog generation, and NPM publishing.

## Steps to Release

1. **Merge your changes into `main`.**
2. **Wait for release-please to create a release PR.**
   - The release PR will update the changelog and bump the version.
3. **Merge the release PR.**
   - On merge, release-please will create a GitHub release and publish to NPM automatically.

## Troubleshooting
- If the release PR is not created, ensure your changes are on `main` and follow conventional commit messages.
- If NPM publish fails, check workflow logs and NPM token configuration.

## Best Practices
- Use conventional commits for clear changelogs and automation.
- Do not manually create tags or releases; let release-please handle it.
- Review the release PR for changelog and version updates before merging.

## Maintainers
- See `.github/workflows/release-please.yml` for automation details.
