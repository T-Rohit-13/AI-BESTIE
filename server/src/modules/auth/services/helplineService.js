// INARO — Verified Counselling Helpline Directory (Team Member 1 Scope)
// Maps Indian states/regions to official, verified mental health helplines.
// National fallback: KIRAN (1800-599-0019) — 24x7 Free Multi-lingual Helpline by NIMHANS.
// Referenced in TEAM_OWNERSHIP.md: "verified counselling helpline fallback pathway"

const HELPLINE_DIRECTORY = {
  // ── National Fallback (used when location is missing or unmatched) ──────────
  NATIONAL: {
    name:   'KIRAN Mental Health Helpline',
    phone:  '1800-599-0019',
    region: 'National',
    description: 'Free 24x7 multi-lingual mental health helpline by Ministry of Social Justice & Empowerment, operated by NIMHANS.',
  },

  // ── State-Specific Helplines ─────────────────────────────────────────────────
  'Tamil Nadu': {
    name:   'Tele-MANAS Tamil Nadu',
    phone:  '14416',
    region: 'Tamil Nadu',
    description: 'National Tele Mental Health Programme — Tamil language support available.',
  },
  'Maharashtra': {
    name:   'iCall — TISS Mumbai',
    phone:  '9152987821',
    region: 'Maharashtra',
    description: 'Psychosocial helpline by Tata Institute of Social Sciences, trained counsellors.',
  },
  'Karnataka': {
    name:   'Vandrevala Foundation',
    phone:  '1860-2662-345',
    region: 'Karnataka',
    description: '24/7 mental health helpline and crisis support across India.',
  },
  'Delhi': {
    name:   'Vandrevala Foundation',
    phone:  '1860-2662-345',
    region: 'Delhi NCR',
    description: '24/7 mental health helpline and crisis support across India.',
  },
  'Kerala': {
    name:   'DISHA Helpline Kerala',
    phone:  '1056',
    region: 'Kerala',
    description: 'State mental health helpline operated by Kerala Health Department.',
  },
  'Andhra Pradesh': {
    name:   'NIMHANS Tele-MANAS',
    phone:  '14416',
    region: 'Andhra Pradesh',
    description: 'National Tele Mental Health Programme — Telugu language support available.',
  },
  'Telangana': {
    name:   'NIMHANS Tele-MANAS',
    phone:  '14416',
    region: 'Telangana',
    description: 'National Tele Mental Health Programme — Telugu language support available.',
  },
  'West Bengal': {
    name:   'iCall — TISS',
    phone:  '9152987821',
    region: 'West Bengal',
    description: 'Psychosocial helpline by Tata Institute of Social Sciences.',
  },
  'Gujarat': {
    name:   'Vandrevala Foundation',
    phone:  '1860-2662-345',
    region: 'Gujarat',
    description: '24/7 mental health helpline and crisis support.',
  },
  'Rajasthan': {
    name:   'KIRAN Mental Health Helpline',
    phone:  '1800-599-0019',
    region: 'Rajasthan',
    description: 'Free 24x7 multi-lingual mental health helpline by NIMHANS.',
  },
  'Punjab': {
    name:   'KIRAN Mental Health Helpline',
    phone:  '1800-599-0019',
    region: 'Punjab',
    description: 'Free 24x7 multi-lingual mental health helpline — Punjabi/Hindi support.',
  },
  'Uttar Pradesh': {
    name:   'KIRAN Mental Health Helpline',
    phone:  '1800-599-0019',
    region: 'Uttar Pradesh',
    description: 'Free 24x7 multi-lingual mental health helpline — Hindi support.',
  },
};

/**
 * Resolves the appropriate helpline for a given state name.
 * Performs a case-insensitive match and falls back to the national KIRAN helpline.
 *
 * @param {string|undefined} state - The user's state from their location object.
 * @returns {{ name: string, phone: string, region: string }} Validated helpline object.
 */
const resolveHelpline = (state) => {
  if (!state) return HELPLINE_DIRECTORY.NATIONAL;

  const normalised = state.trim();
  
  // Exact key match first
  if (HELPLINE_DIRECTORY[normalised]) {
    return HELPLINE_DIRECTORY[normalised];
  }

  // Case-insensitive fallback scan
  const matchKey = Object.keys(HELPLINE_DIRECTORY).find(
    (key) => key.toLowerCase() === normalised.toLowerCase()
  );

  return matchKey ? HELPLINE_DIRECTORY[matchKey] : HELPLINE_DIRECTORY.NATIONAL;
};

/**
 * Validates that a helpline object has non-empty required fields.
 * Enforces the TEAM_OWNERSHIP.md rule: "validate that assigned helpline details
 * are non-empty and active before persisting".
 *
 * @param {{ name: string, phone: string, region: string }} helpline
 * @returns {boolean}
 */
const isValidHelpline = (helpline) => {
  return (
    helpline &&
    typeof helpline.name  === 'string' && helpline.name.trim().length > 0 &&
    typeof helpline.phone === 'string' && helpline.phone.trim().length > 0 &&
    typeof helpline.region=== 'string' && helpline.region.trim().length > 0
  );
};

module.exports = { resolveHelpline, isValidHelpline, HELPLINE_DIRECTORY };
