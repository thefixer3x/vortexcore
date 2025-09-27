/**
 * Test framework: Jest (TypeScript) — uses describe/it/expect globals.
 * Also runs under Vitest if "globals: true" is enabled or by importing describe/it/expect from 'vitest'.
 *
 * Scope: Validates the PR review instruction content from the diff.
 * Focus: Happy paths, edge cases (missing/renumbered sections), and critical phrasing.
 */

type Section = { number: number; title: string; items: string[] };

const DOC = `# Instructions for Conducting Productive Pull Request Reviews

This guide is intended to help you perform effective and constructive PR reviews.

## 1. Prepare for the Review
- Ensure you have pulled the latest changes from the branch.
- Familiarize yourself with the purpose of the PR by reading its description and linked issues.
- Skim through the commit messages for context.

2. Use Copilot to Assist in Understanding
Allow Copilot to summarise or explain complex sections of code.
Ask Copilot for potential edge cases or scenarios the code might miss.
Request test suggestions from Copilot for untested logic.

3. Review Code Quality
Check for adherence to coding standards and style guidelines.
Look for potential bugs, security risks, or performance issues.
Confirm that code is modular, readable, and maintainable.

4. Evaluate Tests and Documentation
Ensure the PR includes sufficient test coverage.
Review documentation updates for clarity and completeness.
Use Copilot to suggest additional unit or integration tests if gaps are found.

5. Provide Constructive Feedback
Be specific and respectful in your comments.
Highlight both strengths and areas for improvement.
Use suggestions or code snippets to propose improvements where possible.

6. Approve or Request Changes
Approve the PR if it meets quality and functionality standards.
Request changes if there are critical issues, explaining why in detail.
Consider optional improvements as suggestions rather than blockers.

7. Follow Up
Respond promptly to the author’s updates or questions.
Ensure all discussions are resolved before merging.
Merge using the agreed strategy (squash, rebase, or merge commit).

---
`;

/**
 * Parses the instruction document to extract numbered sections and their items.
 * Accepts headings either as "## N. Title" or "N. Title" (as present in the diff).
 */
function extractSections(md: string): { title: string; sections: Section[] } {
  const lines = md.split(/\r?\n/);

  const titleLine = lines.find((l) => l.trim().startsWith('# ')) ?? '';
  const title = titleLine.replace(/^#\s*/, '').trim();

  const sections: Section[] = [];
  let current: Section | null = null;

  for (const raw of lines) {
    const line = raw.replace(/\s+$/,''); // trim right only to preserve indentation semantics if any

    // Detect numbered section headers with optional "##"
    const m = line.match(/^(?:##\s*)?(\d+)\.\s+(.*)$/);
    if (m) {
      if (current) sections.push(current);
      current = { number: Number(m[1]), title: (m[2] || '').trim(), items: [] };
      continue;
    }

    if (!current) continue;

    const t = line.trim();

    // Stop conditions aren't necessary; we accumulate until next header.
    if (!t) continue; // skip blank lines

    // Skip horizontal rules
    if (/^[-*_]{3,}$/.test(t)) continue;

    // Normalize bullets and keep plain lines as actionable items as well
    const normalized = t.replace(/^-+\s*/, '').trim();
    if (normalized) current.items.push(normalized);
  }

  if (current) sections.push(current);

  return { title, sections };
}

/**
 * Validates the document for structure and content quality.
 * Returns an array of human-readable error messages (empty when valid).
 */
function validateDocument(md: string): string[] {
  const errors: string[] = [];
  const { title, sections } = extractSections(md);

  if (!title) errors.push('Missing H1 title.');

  // Expect sections 1..7 in order
  const expectedCount = 7;
  const nums = sections.map((s) => s.number);

  // Ordering/sequential check
  for (let i = 0; i < nums.length; i++) {
    const expected = i + 1;
    if (nums[i] !== expected) {
      errors.push(`Sections out of order: expected ${expected} but got ${nums[i]} at position ${i + 1}.`);
    }
  }

  // Presence check
  for (let n = 1; n <= expectedCount; n++) {
    if (!nums.includes(n)) errors.push(`Missing section ${n}.`);
  }

  // Actionability check: at least 3 items per section
  sections.forEach((s) => {
    if (s.items.length < 3) {
      errors.push(`Section ${s.number} ("${s.title}") should list at least 3 actionable items; found ${s.items.length}.`);
    }
  });

  return errors;
}

describe('Copilot PR review instructions (from diff)', () => {
  test('has exact H1 title', () => {
    const { title } = extractSections(DOC);
    expect(title).toBe('Instructions for Conducting Productive Pull Request Reviews');
  });

  test('has 7 numbered sections in sequential order with correct titles', () => {
    const { sections } = extractSections(DOC);
    expect(sections.map((s) => s.number)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(sections.map((s) => s.title)).toEqual([
      'Prepare for the Review',
      'Use Copilot to Assist in Understanding',
      'Review Code Quality',
      'Evaluate Tests and Documentation',
      'Provide Constructive Feedback',
      'Approve or Request Changes',
      'Follow Up',
    ]);
  });

  test('each section lists at least 3 actionable items', () => {
    const { sections } = extractSections(DOC);
    for (const s of sections) {
      expect({
        section: s.number,
        title: s.title,
        items: s.items.length,
      }).toEqual(expect.objectContaining({ items: expect.any(Number) }));
      expect(s.items.length).toBeGreaterThanOrEqual(3);
    }
  });

  test('section-specific phrasing and key concepts are present', () => {
    const { sections } = extractSections(DOC);
    const s2 = sections.find((x) => x.number === 2)!;
    const s4 = sections.find((x) => x.number === 4)!;
    const s6 = sections.find((x) => x.number === 6)!;
    const s7 = sections.find((x) => x.number === 7)!;

    // Copilot guidance with British spelling "summarise"
    const s2Text = s2.items.join(' ').toLowerCase();
    expect(s2Text).toContain('copilot');
    expect(s2Text).toContain('summarise');

    // Tests and docs emphasis
    expect(s4.items.join(' ').toLowerCase()).toContain('test coverage');

    // Approval and changes
    expect(s6.items.join(' ')).toContain('Approve the PR');

    // Merge strategies listed
    const s7Text = s7.items.join(' ').toLowerCase();
    expect(s7Text).toContain('squash');
    expect(s7Text).toContain('rebase');
    expect(s7Text).toContain('merge commit');
  });

  test('negative scenario: validation catches missing and misordered sections', () => {
    // Introduce an error by renumbering section 6 as 8
    const badDoc = DOC.replace(/\n6\.\s+Approve or Request Changes/, '\n8. Approve or Request Changes');
    const errors = validateDocument(badDoc);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors.join(' ')).toMatch(/Missing section 6/i);
    expect(errors.join(' ')).toMatch(/expected 6 but got 8/i);
  });

  test('negative scenario: validation flags insufficient actionable items', () => {
    // Create a minimal section with fewer than 3 items
    const minimalDoc = DOC.replace(
      /## 1\.[\s\S]*?Skim through the commit messages for context\./m,
      '## 1. Prepare for the Review\n- Do one thing\n'
    );
    const errors = validateDocument(minimalDoc);
    expect(errors.join(' ')).toMatch(/Section 1 .* at least 3 actionable items/i);
  });
});