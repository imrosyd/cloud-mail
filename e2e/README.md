# UI checks

Browser tests for the main flows (login, search and filters, delete and undo, trash, reading pane,
mark unread, remote images, admin pages). They run against the **local dev instance only** and refuse
any other host, because they delete and restore mail.

```
pm2 restart cloud-mail          # after `npm run build` in mail-vue, so the dev worker serves the new files
node e2e/run.mjs                # reseeds the dev database first, then runs every check
```

* `seed.mjs` resets the passwords of `qa@example.com` and `admin@example.com` and recreates a few
  awkward `[e2e]` mails: no body with an attachment, HTML with a remote image, a very long subject.
  It only touches the local sqlite file under `mail-worker/.wrangler`.
* Playwright is not a dependency of this repo. Point `PLAYWRIGHT_PATH` at an installed copy
  (default: `/var/www/clipnixid/node_modules/playwright`).
* Add a check by appending a `test('...', async () => { ... })` block in `run.mjs`.
