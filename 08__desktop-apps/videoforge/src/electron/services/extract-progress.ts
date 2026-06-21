export function extractProgress(text: string): number | null {
    const match = text.match(/(\d+(\.\d+)?)%/);
    if (!match) return null;
    return parseFloat(match[1]);
}