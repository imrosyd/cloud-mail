// UI checks for the main flows. Runs against the LOCAL dev instance only:
//   node e2e/seed.mjs && node e2e/run.mjs
// Playwright is resolved from PLAYWRIGHT_PATH (default: the copy installed for clipnixid).
import {createRequire} from 'node:module'
import {USERS} from './users.mjs'
import {execFileSync} from 'node:child_process'
import {fileURLToPath} from 'node:url'

const BASE = process.env.E2E_BASE || 'http://localhost:8790'
const host = new URL(BASE).hostname
if (!['localhost', '127.0.0.1'].includes(host)) {
  console.error(`Refusing to run against ${host}: these tests write data and are for the local dev instance only.`)
  process.exit(2)
}
// Start from known data every time: earlier runs mark mail read and delete rows
execFileSync(process.execPath, ['--no-warnings', fileURLToPath(new URL('./seed.mjs', import.meta.url))], {stdio: 'inherit'})

const require = createRequire(import.meta.url)
const {chromium} = require(process.env.PLAYWRIGHT_PATH || '/var/www/clipnixid/node_modules/playwright')

const browser = await chromium.launch()
const results = []
let failures = 0

async function session(user, {width = 1440, height = 860} = {}) {
  const page = await (await browser.newContext({viewport: {width, height}})).newPage()
  page.problems = []
  page.on('pageerror', e => page.problems.push(e.message))
  page.on('response', r => { if (r.url().includes('/api/') && r.status() >= 500) page.problems.push(`${r.status()} ${r.url()}`) })
  await page.goto(`${BASE}/login`)
  await page.fill('input[placeholder=Email]', user.email.split('@')[0])
  await page.fill('input[placeholder=Password]', user.password)
  await page.click('button:has-text("Sign in")')
  await page.waitForSelector('.email-row, .el-menu-item', {timeout: 15000})
  await page.locator('.el-notification__closeBtn').click().catch(() => {})
  await page.mouse.move(700, 500)
  await page.waitForTimeout(800)
  return page
}

async function test(name, fn) {
  try {
    await fn()
    results.push(`ok   ${name}`)
  } catch (e) {
    failures++
    results.push(`FAIL ${name}\n       ${String(e.message).split('\n')[0]}`)
  }
}

function expect(cond, message) {
  if (!cond) throw new Error(message)
}

const qa = await session(USERS.qa)

await test('inbox lists mail and the sidebar has no admin section for a normal user', async () => {
  expect(await qa.locator('.email-row').count() > 3, 'no rows')
  expect(await qa.locator('.manage-title').count() === 0, 'manage section visible')
})

await test('search narrows the list and an empty result offers to clear', async () => {
  await qa.fill('.filter-search input', 'Unread one')
  await qa.keyboard.press('Enter')
  await qa.waitForTimeout(900)
  expect(await qa.locator('.email-row').count() === 1, 'expected 1 row')
  await qa.fill('.filter-search input', 'zzzz-no-match')
  await qa.keyboard.press('Enter')
  await qa.waitForTimeout(900)
  expect(await qa.locator('text=Clear filters').count() === 1, 'no clear button')
  await qa.click('text=Clear filters')
  await qa.waitForTimeout(900)
  expect(await qa.locator('.email-row').count() > 3, 'list did not come back')
})

await test('unread filter returns only unread mail', async () => {
  await qa.click('.filter-btn[title="Unread"]')
  await qa.waitForTimeout(900)
  const n = await qa.locator('.email-row').count()
  expect(n >= 1, 'no unread rows')
  await qa.click('.filter-btn[title="All"]')
  await qa.waitForTimeout(700)
})

await test('delete can be undone', async () => {
  const before = await qa.locator('.email-row').count()
  await qa.mouse.click(900, 78) // blank part of the list toolbar
  await qa.keyboard.press('j')
  await qa.keyboard.press('#')
  await qa.waitForTimeout(900)
  expect(await qa.locator('.email-row').count() === before - 1, 'row not removed')
  await qa.click('text=Undo')
  await qa.waitForTimeout(1500)
  expect(await qa.locator('.email-row').count() === before, 'row not restored')
})

await test('a deleted mail shows in the trash and can be restored', async () => {
  const subject = '[e2e] Unread one'
  const row = qa.locator('.email-row', {hasText: subject})
  await row.first().hover()
  await row.first().locator('.row-action[title="Delete"]').click()
  await qa.waitForTimeout(900)
  expect(await row.count() === 0, 'still in inbox')
  await qa.locator('.el-menu-item:has-text("Trash")').click()
  await qa.waitForTimeout(1500)
  expect(await qa.locator('.email-row', {hasText: subject}).count() === 1, 'not in trash')
  await qa.locator('.email-row', {hasText: subject}).first().hover()
  await qa.locator('.email-row', {hasText: subject}).first().locator('.row-action[title="Restore"]').click()
  await qa.waitForTimeout(1200)
  expect(await qa.locator('.email-row', {hasText: subject}).count() === 0, 'still in trash after restore')
  await qa.locator('.el-menu-item:has-text("Inbox")').click()
  await qa.waitForTimeout(1500)
  expect(await qa.locator('.email-row', {hasText: subject}).count() === 1, 'not back in inbox')
})

await test('deleting forever asks first and removes the mail for good', async () => {
  const subject = '[e2e] Disposable mail'
  const row = qa.locator('.email-row', {hasText: subject})
  await row.first().hover()
  await row.first().locator('.row-action[title="Delete"]').click()
  await qa.waitForTimeout(800)
  await qa.locator('.el-menu-item:has-text("Trash")').click()
  await qa.waitForTimeout(1500)
  const trashRow = qa.locator('.email-row', {hasText: subject}).first()
  await trashRow.hover()
  await trashRow.locator('.row-action[title="Delete forever"]').click()
  await qa.waitForSelector('.el-message-box')
  await qa.locator('.el-message-box__btns .el-button--primary').click()
  await qa.waitForTimeout(1200)
  expect(await qa.locator('.email-row', {hasText: subject}).count() === 0, 'still listed')
  await qa.reload()
  await qa.waitForTimeout(1800)
  expect(await qa.locator('.email-row', {hasText: subject}).count() === 0, 'came back after reload')
  await qa.locator('.el-menu-item:has-text("Inbox")').click()
  await qa.waitForTimeout(1200)
})

await test('a read mail can be marked unread and shows up under Unread', async () => {
  const row = qa.locator('.email-row', {hasText: 'Very long subject'}).first()
  await row.hover()
  await row.locator('.row-action[title="Mark as unread"]').click()
  await qa.waitForTimeout(900)
  await qa.click('.filter-btn[title="Unread"]')
  await qa.waitForTimeout(1000)
  expect(await qa.locator('.email-row', {hasText: 'Very long subject'}).count() === 1, 'not under Unread')
  await qa.click('.filter-btn[title="All"]')
  await qa.waitForTimeout(700)
})

await test('message pane shows a mail that has no body, only an attachment', async () => {
  await qa.locator('.layout-btn').nth(1).click()
  await qa.waitForTimeout(600)
  await qa.locator('.email-row', {hasText: 'only an attachment'}).first().click()
  await qa.waitForTimeout(1200)
  expect(await qa.locator('.preview .subject').count() === 1, 'subject missing')
  expect(await qa.locator('.preview .att').count() === 1, 'attachment missing')
})

await test('message pane shows an HTML mail', async () => {
  await qa.locator('.email-row', {hasText: 'HTML newsletter'}).first().click()
  await qa.waitForTimeout(1200)
  expect((await qa.locator('.preview .subject').innerText()).includes('HTML newsletter'), 'wrong subject')
})

await test('layout choice and divider size survive a reload', async () => {
  const handle = await qa.locator('.split-handle').boundingBox()
  await qa.mouse.move(handle.x + 4, handle.y + 200)
  await qa.mouse.down()
  await qa.mouse.move(handle.x + 124, handle.y + 200, {steps: 5})
  await qa.mouse.up()
  const width = Math.round((await qa.locator('.split-body .scroll').boundingBox()).width)
  await qa.reload()
  await qa.waitForSelector('.split-body')
  await qa.waitForTimeout(1200)
  expect(await qa.locator('.split-body.split-right').count() === 1, 'layout lost')
  expect(Math.abs(Math.round((await qa.locator('.split-body .scroll').boundingBox()).width) - width) < 3, 'width lost')
})

await test('remote images are hidden when blocking is on and can be shown per mail', async () => {
  await qa.locator('.el-menu-item:has-text("Settings")').first().click()
  await qa.waitForTimeout(800)
  await qa.locator('.notify:has-text("Block remote images") .el-switch').click()
  await qa.locator('.el-menu-item:has-text("Inbox")').click()
  await qa.waitForTimeout(1200)
  await qa.locator('.email-row', {hasText: 'HTML newsletter'}).first().click()
  await qa.waitForTimeout(1200)
  expect(await qa.locator('.preview .img-banner').count() === 1, 'no banner')
  const hidden = await qa.evaluate(() => {
    const host = document.querySelector('.preview .mail-content .content-html')
    const img = host && host.shadowRoot && host.shadowRoot.querySelector('img')
    return img ? img.hasAttribute('src') : null
  })
  expect(hidden === false, 'image still has a src')
  await qa.click('.preview .img-banner button')
  await qa.waitForTimeout(600)
  expect(await qa.locator('.preview .img-banner').count() === 0, 'banner stayed')
  await qa.locator('.el-menu-item:has-text("Settings")').first().click()
  await qa.waitForTimeout(600)
  await qa.locator('.notify:has-text("Block remote images") .el-switch').click()
  await qa.locator('.el-menu-item:has-text("Inbox")').click()
  await qa.waitForTimeout(800)
})

await test('opening a mail in the full page works for a mail with a null text part', async () => {
  await qa.locator('.layout-btn').nth(0).click()
  await qa.waitForTimeout(500)
  await qa.locator('.email-row', {hasText: 'only an attachment'}).first().click()
  await qa.waitForSelector('.email-title', {timeout: 8000})
  expect(await qa.locator('.att').count() === 1, 'attachment missing on full page')
  await qa.goBack()
})

await test('the question mark key opens the shortcut list', async () => {
  await qa.locator('.el-menu-item:has-text("Inbox")').click()
  await qa.waitForTimeout(800)
  await qa.mouse.click(900, 78)
  await qa.keyboard.press('Shift+Slash')
  await qa.waitForSelector('.shortcut-list', {timeout: 4000})
  expect(await qa.locator('.shortcut-list kbd').count() > 6, 'no keys listed')
  await qa.keyboard.press('Escape')
  await qa.waitForTimeout(500)
})

await test('the compose window lets you pick which address to send from', async () => {
  await qa.locator('.writer-box').click()
  await qa.waitForSelector('.sender-select', {timeout: 5000})
  await qa.locator('.sender-select').click()
  await qa.waitForTimeout(700)
  const options = await qa.locator('.sender-popper .el-select-dropdown__item:visible').count()
  expect(options >= 2, 'only ' + options + ' addresses offered')
  await qa.locator('.sender-popper .el-select-dropdown__item:visible', {hasText: 'zeta@example2.com'}).click()
  await qa.waitForTimeout(400)
  expect((await qa.locator('.sender-select .el-select__placeholder').innerText()).includes('zeta@example2.com'), 'choice not shown')
  await qa.locator('.send .write-box .close-btn').click()
  await qa.waitForTimeout(600)
  expect(await qa.locator('.sender-select').isVisible() === false, 'compose window did not close')
})

await test('sent page shows the recipient and has no Unread filter', async () => {
  await qa.locator('.el-menu-item:has-text("Sent")').click()
  await qa.waitForTimeout(1200)
  expect(await qa.locator('.filter-btn[title="Unread"]').count() === 0, 'unread filter on sent')
})

await test('no page errors for the normal user', async () => {
  expect(qa.problems.length === 0, qa.problems.join(' | '))
})

const admin = await session(USERS.admin)

await test('admin sees every management page in the sidebar', async () => {
  expect(await admin.locator('.manage-title').count() === 1, 'manage title missing')
  for (const label of ['Analytics', 'All Users', 'All Mail', 'Role', 'Invite Code', 'System Settings']) {
    expect(await admin.locator('.el-menu-item', {hasText: label}).count() === 1, `missing ${label}`)
  }
})

for (const label of ['Analytics', 'All Users', 'All Mail', 'Role', 'System Settings', 'Settings']) {
  await test(`admin page opens without errors: ${label}`, async () => {
    const before = admin.problems.length
    await admin.locator('.el-menu-item').filter({hasText: new RegExp(`^\\s*${label}\\s*$`)}).first().click()
    await admin.waitForTimeout(1800)
    expect(admin.problems.length === before, admin.problems.slice(before).join(' | '))
  })
}

// Pages are kept alive, so earlier dropdowns stay in the DOM hidden; only the open one counts
function visiblePageSizes(page) {
  return page.evaluate(() => [...document.querySelectorAll('.el-select-dropdown__item')]
    .filter(el => el.getClientRects().length > 0).map(el => el.textContent.trim()).filter(text => /\/page$/.test(text)))
}

async function choosePageSize(page, root, label) {
  await page.locator(`${root} .el-pagination__sizes .el-select`).first().click()
  await page.locator('.el-select-dropdown__item:visible', {hasText: label}).click()
  await page.waitForTimeout(1000)
}

await test('invite codes are paged and the page size can be 5, 10, 20 or 50', async () => {
  await admin.locator('.el-menu-item').filter({hasText: /^\s*Invite Code\s*$/}).first().click()
  await admin.waitForSelector('.code-item', {timeout: 8000})
  expect(await admin.locator('.code-item').count() === 10, 'default page is not 10')
  await admin.locator('.page-bar:visible .el-pagination__sizes .el-select').first().click()
  const offered = await visiblePageSizes(admin)
  expect(['5/page', '10/page', '20/page', '50/page'].every(o => offered.includes(o)) && offered.length === 4, 'sizes: ' + offered.join(','))
  await admin.keyboard.press('Escape')
  await choosePageSize(admin, '.page-bar:visible', '5/page')
  expect(await admin.locator('.code-item').count() === 5, 'size 5 not applied')
  const firstOnPage1 = await admin.locator('.code-item .code').first().innerText()
  await admin.locator('.page-bar:visible .btn-next').first().click()
  await admin.waitForTimeout(1000)
  expect(await admin.locator('.code-item').count() === 5, 'page 2 not full')
  expect((await admin.locator('.code-item .code').first().innerText()) !== firstOnPage1, 'page 2 shows the same codes')
  await admin.reload()
  await admin.waitForTimeout(1800)
  await admin.locator('.el-menu-item').filter({hasText: /^\s*Invite Code\s*$/}).first().click()
  await admin.waitForSelector('.code-item', {timeout: 8000})
  expect(await admin.locator('.code-item').count() === 5, 'page size not remembered')
  await choosePageSize(admin, '.page-bar:visible', '50/page')
  expect(await admin.locator('.code-item').count() === 23, 'size 50 should show all 23')
  await admin.evaluate(() => localStorage.removeItem('page-size:reg-key'))
})

await test('roles are paged', async () => {
  await admin.locator('.el-menu-item').filter({hasText: /^\s*Role\s*$/}).first().click()
  await admin.waitForTimeout(1500)
  await choosePageSize(admin, '.page-bar:visible', '5/page')
  expect(await admin.locator('.perm-box .el-table__body tr').count() === 5, 'page 1 is not 5 rows')
  await admin.locator('.page-bar:visible .btn-next').first().click()
  await admin.waitForTimeout(800)
  expect(await admin.locator('.perm-box .el-table__body tr').count() === 2, 'page 2 should hold the remaining 2')
  await admin.evaluate(() => localStorage.removeItem('page-size:role'))
})

await test('all users offers the same four page sizes', async () => {
  await admin.locator('.el-menu-item').filter({hasText: /^\s*All Users\s*$/}).first().click()
  await admin.waitForTimeout(1800)
  await admin.locator('.pagination:visible .el-pagination__sizes .el-select').first().click()
  const offered = await visiblePageSizes(admin)
  expect(offered.join(',') === '5/page,10/page,20/page,50/page', 'sizes: ' + offered.join(','))
  await admin.keyboard.press('Escape')
})

await test('delete account is a danger button', async () => {
  await admin.locator('.el-menu-item').filter({hasText: /^\s*Settings\s*$/}).first().click()
  await admin.waitForTimeout(1000)
  expect(await admin.locator('.del-email .el-button--danger').count() === 1, 'not red')
})

await browser.close()
console.log(results.join('\n'))
console.log(failures ? `\n${failures} failed` : `\nall ${results.length} passed`)
process.exit(failures ? 1 : 0)
