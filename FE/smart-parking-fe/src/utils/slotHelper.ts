/**
 * Utility function to sort slot codes intelligently and naturally.
 * Handles mixed prefix styles such as "G0-01" vs "G-021" belonging to the same zone (Zone G),
 * sorting by numerical sequence: G0-01, G0-02, ..., G0-20, G-021, ..., G-040.
 */
export function compareSlotCodes(a: any, b: any): number {
  const codeA: string = (typeof a === 'string' ? a : a?.slotCode || '').trim();
  const codeB: string = (typeof b === 'string' ? b : b?.slotCode || '').trim();

  const matchA = codeA.match(/^(.*?)(\d+)$/);
  const matchB = codeB.match(/^(.*?)(\d+)$/);

  if (matchA && matchB) {
    const rawPrefixA = matchA[1];
    const rawPrefixB = matchB[1];
    const numA = parseInt(matchA[2], 10);
    const numB = parseInt(matchB[2], 10);

    // Normalize base prefix by removing trailing separators/hyphens and zero-padding
    // e.g. "G0-" -> "G", "G-" -> "G", "A0-" -> "A", "A-" -> "A"
    const baseA = rawPrefixA.replace(/[-_.\s0]+$/, '').toUpperCase();
    const baseB = rawPrefixB.replace(/[-_.\s0]+$/, '').toUpperCase();

    // If both belong to the exact same base zone (e.g. both base "G"), compare numbers directly
    if (baseA && baseB && baseA === baseB) {
      if (numA !== numB) {
        return numA - numB;
      }
    }

    // If base prefixes differ, compare raw prefixes naturally
    const prefixCmp = rawPrefixA.localeCompare(rawPrefixB, undefined, { numeric: true, sensitivity: 'base' });
    if (prefixCmp !== 0) {
      return prefixCmp;
    }

    return numA - numB;
  }

  return codeA.localeCompare(codeB, undefined, { numeric: true, sensitivity: 'base' });
}
