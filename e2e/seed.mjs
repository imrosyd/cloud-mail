// Seeds the local dev database (wrangler dev, pm2 "cloud-mail") with the accounts and the
// awkward mail the UI tests need. Safe to run repeatedly. Touches only the local sqlite file.
import {DatabaseSync} from 'node:sqlite'
import {createHash, randomBytes} from 'node:crypto'
import {readdirSync} from 'node:fs'
import {join, dirname} from 'node:path'
import {fileURLToPath} from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const dir = join(here, '..', 'mail-worker', '.wrangler', 'state', 'v3', 'd1', 'miniflare-D1DatabaseObject')
const file = readdirSync(dir).find(f => f.endsWith('.sqlite') && !f.startsWith('metadata'))
if (!file) throw new Error('No local D1 file found. Start the dev instance once first.')
const db = new DatabaseSync(join(dir, file))

function hash(password) {
  const salt = randomBytes(16).toString('base64')
  return {salt, hash: createHash('sha256').update(salt + password).digest('base64')}
}

import {USERS} from './users.mjs'

for (const u of Object.values(USERS)) {
  const row = db.prepare('select user_id from user where email = ?').get(u.email)
  const {salt, hash: h} = hash(u.password)
  if (row) db.prepare('update user set password = ?, salt = ? where email = ?').run(h, salt, u.email)
  else throw new Error(`${u.email} does not exist in the dev database; create it once through the app`)
}

const qa = db.prepare('select user_id from user where email = ?').get(USERS.qa.email)
const account = db.prepare('select account_id from account where user_id = ? order by account_id limit 1').get(qa.user_id)
const base = db.prepare('select * from email where user_id = ? and type = 0 limit 1').get(qa.user_id)

const cases = [
  {tag: 'null-body', subject: '[e2e] Report domain with only an attachment', name: 'noreply-dmarc-support', text: null, content: null, att: true},
  {tag: 'html', subject: '[e2e] HTML newsletter', name: 'Newsletter', text: null, content: '<p>Hello <b>reader</b></p><img src="https://example.com/pixel.png">'},
  {tag: 'long-name', subject: '[e2e] ' + 'Very long subject '.repeat(8), name: 'A sender with an unreasonably long display name that keeps going', text: 'plain text body https://example.org/x', content: null},
  {tag: 'disposable', subject: '[e2e] Disposable mail', name: 'E2E Sender', text: 'delete me for good', content: null},
  {tag: 'unread', subject: '[e2e] Unread one', name: 'E2E Sender', text: 'unread body', content: null, unread: 0},
]

const cols = Object.keys(base).filter(k => k !== 'email_id')
db.prepare("delete from attachments where email_id in (select email_id from email where subject like '[e2e]%')").run()
db.prepare("delete from email where subject like '[e2e]%'").run()
for (const c of cases) {
  const row = {...base, subject: c.subject, name: c.name, send_email: 'sender@e2e.test', text: c.text, content: c.content,
    recipient: JSON.stringify([{address: USERS.qa.email, name: ''}]), to_email: USERS.qa.email, account_id: account.account_id,
    unread: c.unread ?? 1, is_del: 0, type: 0, status: 0}
  const info = db.prepare(`insert into email (${cols.join(',')}) values (${cols.map(() => '?').join(',')})`).run(...cols.map(k => row[k]))
  if (c.att) {
    db.prepare('insert into attachments (user_id, email_id, account_id, key, filename, mime_type, size, status, type) values (?,?,?,?,?,?,?,?,?)')
      .run(qa.user_id, Number(info.lastInsertRowid), account.account_id, 'e2e.zip', 'report.zip', 'application/zip', 739, 0, 0)
  }
}
console.log(`seeded ${cases.length} e2e emails and reset the qa/admin passwords in ${file.slice(0, 8)}...`)

// Enough rows for the paged lists (invite codes, roles, users) to span several pages
db.prepare("delete from reg_key where code like 'E2E%'").run()
const regCols = db.prepare('pragma table_info(reg_key)').all().map(c => c.name).filter(n => n !== 'rege_key_id')
const role = db.prepare('select * from role order by role_id limit 1').get()
for (let i = 1; i <= 23; i++) {
  const row = {code: 'E2E' + String(i).padStart(3, '0'), count: 5, role_id: role.role_id, user_id: 1, expire_time: null, create_time: '2026-10-01 00:00:00'}
  db.prepare(`insert into reg_key (${regCols.join(',')}) values (${regCols.map(() => '?').join(',')})`).run(...regCols.map(k => row[k] ?? null))
}

db.prepare("delete from role where name like 'E2E role%'").run()
const roleCols = Object.keys(role).filter(k => k !== 'role_id')
for (let i = 1; i <= 6; i++) {
  const row = {...role, name: 'E2E role ' + i, is_default: 0, sort: 10 + i}
  if ('key' in row) row.key = 'e2e-role-' + i
  db.prepare(`insert into role (${roleCols.join(',')}) values (${roleCols.map(() => '?').join(',')})`).run(...roleCols.map(k => row[k]))
}

db.prepare("delete from user where email like 'e2e-user-%'").run()
const userBase = db.prepare('select * from user where email = ?').get(USERS.qa.email)
const userCols = Object.keys(userBase).filter(k => k !== 'user_id')
for (let i = 1; i <= 12; i++) {
  const row = {...userBase, email: `e2e-user-${String(i).padStart(2, '0')}@example.com`}
  db.prepare(`insert into user (${userCols.join(',')}) values (${userCols.map(() => '?').join(',')})`).run(...userCols.map(k => row[k]))
}
console.log('seeded 23 invite codes, 6 roles and 12 users for paging')
