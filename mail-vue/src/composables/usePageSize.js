export const PAGE_SIZES = [5, 10, 20, 50]

// Page size remembered per list; anything that is not one of the offered sizes falls back to the default
export function readPageSize(key, fallback = 10) {
    try {
        const saved = Number(localStorage.getItem('page-size:' + key))
        if (PAGE_SIZES.includes(saved)) return saved
    } catch (e) {
        // storage can be unavailable; the default is fine
    }
    return PAGE_SIZES.includes(fallback) ? fallback : 10
}

export function savePageSize(key, size) {
    try {
        localStorage.setItem('page-size:' + key, String(size))
    } catch (e) {
        // not remembering is harmless
    }
}

export function nearestPageSize(size) {
    return PAGE_SIZES.includes(size) ? size : PAGE_SIZES.reduce((a, b) => Math.abs(b - size) < Math.abs(a - size) ? b : a)
}
