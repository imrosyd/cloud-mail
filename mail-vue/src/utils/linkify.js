const ESCAPES = {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}
const URL_RE = /https?:\/\/[^\s<>"']+[^\s<>"'.,;:!?)\]]/gi

function escapeHtml(text) {
    return text.replace(/[&<>"']/g, ch => ESCAPES[ch])
}

// Escapes plain text and turns URLs into links that open in a new tab
export function linkify(text = '') {
    let out = ''
    let last = 0
    for (const match of text.matchAll(URL_RE)) {
        const url = escapeHtml(match[0])
        out += escapeHtml(text.slice(last, match.index))
        out += `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`
        last = match.index + match[0].length
    }
    return out + escapeHtml(text.slice(last))
}
