# AGENT & DEVELOPER INSTRUCTIONS

## 🚨 MANDATORY RULE: ALWAYS PULL BEFORE STARTING ANY TASK

The Sound Team (음총팀) continuously edits and commits data directly to the GitHub remote `main` branch via the web application:
- `src/data/songs.json`
- `src/data/recommendedPlaylist.json`
- `src/data/backups/`

### Critical Workflow for all Agents & Developers:
1. **PULL FIRST**: Before analyzing files, making code edits, or touching data, ALWAYS run:
   ```bash
   git pull origin main
   ```
2. **Never overwrite sound team data** without merging their latest commits first.
3. **Verify build** with `npm run build` after changes.
4. **Push commits** to `origin/main`.
