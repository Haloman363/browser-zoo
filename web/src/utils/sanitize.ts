/**
 * Sanitization utilities for preventing XSS attacks
 */

/**
 * Sanitize text for safe display (escapes HTML entities)
 * Use this for user-controlled strings that need to be displayed as text
 */
export function sanitizeText(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

/**
 * Safely set text content of an element
 * Prevents XSS by using textContent instead of innerHTML
 */
export function setElementText(element: HTMLElement, text: string): void {
    element.textContent = text;
}

/**
 * Safely clear an element's content
 */
export function clearElement(element: HTMLElement): void {
    element.textContent = '';
}
