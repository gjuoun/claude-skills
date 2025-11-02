---
name: Update apps with Brew
description: Update apps with Brew to the latest version.
---

upgrade these apps, use brew to upgrade unless otherwise specified:

- you can upgrade multiple apps in a single command, but formulas and casks cannot be mixed:
  - Multiple formulas: `brew upgrade app1 app2 app3`
  - Multiple casks: `brew upgrade --cask app1 app2 app3`
  - Mixed (formulas + casks): Use separate commands for each type
- if other tools are mentioned, use the tool to upgrade. Example: `rustup update`
- if an app is installed at `/Applications/<app-name>` remove the current install and replace it with the new one

<apps>
codex --cask
claude-code --cask
visual-studio-code --cask
cursor --cask
ghostty --cask
cherry-studio --cask
datagrip --cask
orbstack --cask
fnm
bun
amazon-q --cask
uv
obsidian --cask
hurl
rust (with `rustup update`)
</apps>
