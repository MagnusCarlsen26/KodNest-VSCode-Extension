export function sanitizeFilename(
    title: string
): string {
    return title.replace(/[^a-z0-9_\-]/gi, '_');
}