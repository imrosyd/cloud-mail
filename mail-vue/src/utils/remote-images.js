// Hides images (and other resources) that would be fetched from the sender's servers when a
// message is opened. Those requests tell the sender that, when and from where the mail was read.
const REMOTE = /^\s*(https?:)?\/\//i

function isRemote(value, allowedHost) {
    if (!value || !REMOTE.test(value)) return false
    if (allowedHost) {
        try {
            if (new URL(value, 'https://placeholder.invalid').host === allowedHost) return false
        } catch (e) {
            // an unparsable address is treated as remote
        }
    }
    return true
}

const CSS_URL = /url\(\s*(['"]?)\s*((?:https?:)?\/\/[^)'"]+)\1\s*\)/gi

/**
 * @param {string} html message body
 * @param {string} [allowedHost] host of the app's own attachment storage, never blocked
 * @returns {{html: string, count: number}} the cleaned body and how many resources were hidden
 */
export function blockRemoteImages(html, allowedHost) {
    if (!html) return {html: html || '', count: 0}
    const doc = new DOMParser().parseFromString(html, 'text/html')
    let count = 0

    doc.querySelectorAll('img, source, video, audio, input[type=image]').forEach(el => {
        const src = el.getAttribute('src')
        const srcset = el.getAttribute('srcset')
        if (isRemote(src, allowedHost)) {
            el.removeAttribute('src')
            count++
        }
        if (srcset && srcset.split(',').some(part => isRemote(part.trim().split(/\s+/)[0], allowedHost))) {
            el.removeAttribute('srcset')
            count++
        }
        if (el.hasAttribute('poster') && isRemote(el.getAttribute('poster'), allowedHost)) {
            el.removeAttribute('poster')
            count++
        }
    })

    doc.querySelectorAll('[background]').forEach(el => {
        if (isRemote(el.getAttribute('background'), allowedHost)) {
            el.removeAttribute('background')
            count++
        }
    })

    doc.querySelectorAll('[style]').forEach(el => {
        const style = el.getAttribute('style')
        const cleaned = style.replace(CSS_URL, (match, q, url) => {
            if (!isRemote(url, allowedHost)) return match
            count++
            return 'none'
        })
        if (cleaned !== style) el.setAttribute('style', cleaned)
    })

    doc.querySelectorAll('style').forEach(el => {
        const cleaned = el.textContent.replace(CSS_URL, (match, q, url) => {
            if (!isRemote(url, allowedHost)) return match
            count++
            return 'none'
        })
        if (cleaned !== el.textContent) el.textContent = cleaned
    })

    // Stylesheets and fonts pulled from other servers leak the same information
    doc.querySelectorAll('link[rel~=stylesheet]').forEach(el => {
        if (isRemote(el.getAttribute('href'), allowedHost)) {
            el.remove()
            count++
        }
    })

    return {html: doc.documentElement.outerHTML, count}
}
