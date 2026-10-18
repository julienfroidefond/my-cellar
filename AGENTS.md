<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Production cellar access

- Production URL: `https://cellar.julienfroidefond.com`
- The read-only production export is `GET /api/export`.
- Use the local, uncommitted `.env.local` variable `CELLAR_API_TOKEN` with the header `Authorization: Bearer $CELLAR_API_TOKEN`.
- Never print, persist, commit, or include the token in reports, logs, or tool output.
- Treat production access as read-only unless the user explicitly requests a mutation; save the export outside the repository before analysis.
