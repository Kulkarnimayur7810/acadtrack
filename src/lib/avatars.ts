// High-quality handcrafted SVG Avatar Collection
// 100% vector, zero external network dependencies, high-contrast, beautiful for all screen sizes

export interface AvatarOption {
  id: string
  name: string
  category: 'robot' | 'demon' | 'cyber' | 'abstract' | 'cute'
  svg: string
}

function svgToDataUrl(svgString: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString.trim())}`
}

export const AVATAR_COLLECTION: AvatarOption[] = [
  // ─── 1. Robots & Mecha ────────────────────────────────────────────────────────
  {
    id: 'bot-neon',
    name: 'Cyber Sentinel',
    category: 'robot',
    svg: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="80" rx="40" fill="#0F172A"/>
      <circle cx="40" cy="40" r="32" fill="#1E293B" stroke="#38BDF8" stroke-width="2"/>
      <rect x="26" y="24" width="28" height="24" rx="6" fill="#334155" stroke="#38BDF8" stroke-width="2"/>
      <rect x="30" y="32" width="20" height="7" rx="3" fill="#0284C7"/>
      <circle cx="35" cy="35.5" r="2" fill="#E0F2FE"/>
      <circle cx="45" cy="35.5" r="2" fill="#E0F2FE"/>
      <line x1="40" y1="24" x2="40" y2="16" stroke="#38BDF8" stroke-width="3" stroke-linecap="round"/>
      <circle cx="40" cy="14" r="3" fill="#38BDF8"/>
      <rect x="34" y="52" width="12" height="10" rx="2" fill="#38BDF8"/>
      <line x1="20" y1="36" x2="24" y2="36" stroke="#38BDF8" stroke-width="3" stroke-linecap="round"/>
      <line x1="56" y1="36" x2="60" y2="36" stroke="#38BDF8" stroke-width="3" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'bot-titan',
    name: 'Mecha Titan',
    category: 'robot',
    svg: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="80" rx="40" fill="#18181B"/>
      <polygon points="40,16 62,32 54,64 26,64 18,32" fill="#27272A" stroke="#F59E0B" stroke-width="2"/>
      <polygon points="40,24 54,36 48,56 32,56 26,36" fill="#3F3F46"/>
      <polygon points="34,36 46,36 40,44" fill="#F59E0B"/>
      <circle cx="32" cy="48" r="3" fill="#FDE68A"/>
      <circle cx="48" cy="48" r="3" fill="#FDE68A"/>
      <line x1="40" y1="16" x2="40" y2="28" stroke="#F59E0B" stroke-width="2"/>
    </svg>`,
  },
  {
    id: 'bot-retro',
    name: 'Retro 8-Bit Bot',
    category: 'robot',
    svg: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="80" rx="40" fill="#0C4A6E"/>
      <rect x="22" y="24" width="36" height="32" rx="4" fill="#0369A1" stroke="#BAE6FD" stroke-width="2"/>
      <rect x="28" y="30" width="24" height="16" rx="2" fill="#082F49"/>
      <rect x="32" y="34" width="4" height="4" fill="#38BDF8"/>
      <rect x="44" y="34" width="4" height="4" fill="#38BDF8"/>
      <rect x="34" y="42" width="12" height="2" fill="#38BDF8"/>
      <rect x="18" y="36" width="4" height="8" rx="2" fill="#38BDF8"/>
      <rect x="58" y="36" width="4" height="8" rx="2" fill="#38BDF8"/>
      <rect x="38" y="16" width="4" height="8" fill="#BAE6FD"/>
      <circle cx="40" cy="14" r="3" fill="#E0F2FE"/>
    </svg>`,
  },
  {
    id: 'bot-synth',
    name: 'Android AI Synth',
    category: 'robot',
    svg: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="80" rx="40" fill="#312E81"/>
      <circle cx="40" cy="40" r="28" fill="#4338CA" stroke="#A5B4FC" stroke-width="2"/>
      <path d="M 28 38 Q 40 30 52 38" stroke="#818CF8" stroke-width="3" fill="none" stroke-linecap="round"/>
      <circle cx="34" cy="44" r="4" fill="#C7D2FE"/>
      <circle cx="46" cy="44" r="4" fill="#C7D2FE"/>
      <circle cx="34" cy="44" r="1.5" fill="#312E81"/>
      <circle cx="46" cy="44" r="1.5" fill="#312E81"/>
      <path d="M 36 54 Q 40 57 44 54" stroke="#A5B4FC" stroke-width="2" fill="none" stroke-linecap="round"/>
      <circle cx="40" cy="20" r="3" fill="#A5B4FC"/>
    </svg>`,
  },

  // ─── 2. Devil & Fantasy ───────────────────────────────────────────────────────
  {
    id: 'demon-crimson',
    name: 'Crimson Oni',
    category: 'demon',
    svg: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="80" rx="40" fill="#450A0A"/>
      <!-- Horns -->
      <path d="M 24 28 C 18 16 26 10 32 18 Z" fill="#EF4444"/>
      <path d="M 56 28 C 62 16 54 10 48 18 Z" fill="#EF4444"/>
      <!-- Face -->
      <path d="M 24 30 C 24 54 32 64 40 64 C 48 64 56 54 56 30 Z" fill="#991B1B" stroke="#F87171" stroke-width="1.5"/>
      <!-- Eyes -->
      <polygon points="30,38 38,40 32,44" fill="#FEF08A"/>
      <polygon points="50,38 42,40 48,44" fill="#FEF08A"/>
      <!-- Teeth / Smile -->
      <path d="M 32 52 Q 40 60 48 52" stroke="#FEF2F2" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <polygon points="36,52 38,56 40,52" fill="#FEF2F2"/>
      <polygon points="40,52 42,56 44,52" fill="#FEF2F2"/>
    </svg>`,
  },
  {
    id: 'demon-shadow',
    name: 'Shadow Imp',
    category: 'demon',
    svg: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="80" rx="40" fill="#2E1065"/>
      <!-- Horns -->
      <path d="M 26 26 C 20 12 32 10 34 20 Z" fill="#A855F7"/>
      <path d="M 54 26 C 60 12 48 10 46 20 Z" fill="#A855F7"/>
      <!-- Face -->
      <circle cx="40" cy="42" r="22" fill="#3B0764" stroke="#C084FC" stroke-width="2"/>
      <!-- Eyes glowing violet -->
      <ellipse cx="33" cy="39" rx="5" ry="3" fill="#E9D5FF"/>
      <ellipse cx="47" cy="39" rx="5" ry="3" fill="#E9D5FF"/>
      <circle cx="33" cy="39" r="2" fill="#581C87"/>
      <circle cx="47" cy="39" r="2" fill="#581C87"/>
      <!-- Smirk -->
      <path d="M 33 49 Q 40 55 48 48" stroke="#F3E8FF" stroke-width="2" fill="none" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'fantasy-sorcerer',
    name: 'Arcane Mage',
    category: 'demon',
    svg: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="80" rx="40" fill="#042F2E"/>
      <!-- Hood -->
      <path d="M 40 14 C 20 18 20 62 40 66 C 60 62 60 18 40 14 Z" fill="#115E59" stroke="#2DD4BF" stroke-width="2"/>
      <!-- Shadow inner hood -->
      <path d="M 40 22 C 28 26 28 54 40 56 C 52 54 52 26 40 22 Z" fill="#134E4A"/>
      <!-- Glowing Eyes -->
      <circle cx="34" cy="38" r="3" fill="#5EEAD4"/>
      <circle cx="46" cy="38" r="3" fill="#5EEAD4"/>
      <!-- Arcane Rune -->
      <circle cx="40" cy="27" r="2" fill="#99F6E4"/>
      <line x1="40" y1="24" x2="40" y2="30" stroke="#5EEAD4" stroke-width="1.5"/>
    </svg>`,
  },
  {
    id: 'fantasy-valkyrie',
    name: 'Celestial Guardian',
    category: 'demon',
    svg: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="80" rx="40" fill="#172554"/>
      <!-- Halo -->
      <ellipse cx="40" cy="18" rx="18" ry="5" fill="none" stroke="#FDE047" stroke-width="2"/>
      <!-- Helmet / Visage -->
      <polygon points="40,24 58,40 50,62 30,62 22,40" fill="#1E40AF" stroke="#60A5FA" stroke-width="2"/>
      <!-- Wings accent -->
      <path d="M 22 36 C 12 30 14 20 20 22 Z" fill="#93C5FD"/>
      <path d="M 58 36 C 68 30 66 20 60 22 Z" fill="#93C5FD"/>
      <line x1="40" y1="28" x2="40" y2="52" stroke="#FDE047" stroke-width="2"/>
      <circle cx="34" cy="42" r="3" fill="#FFFFFF"/>
      <circle cx="46" cy="42" r="3" fill="#FFFFFF"/>
    </svg>`,
  },

  // ─── 3. Cyber & Futuristic ────────────────────────────────────────────────────
  {
    id: 'cyber-astronaut',
    name: 'Neon Cosmo',
    category: 'cyber',
    svg: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="80" rx="40" fill="#09090B"/>
      <!-- Helmet Outer -->
      <circle cx="40" cy="42" r="25" fill="#27272A" stroke="#E4E4E7" stroke-width="2.5"/>
      <!-- Glass Visor with Iridescent sheen -->
      <path d="M 24 40 C 24 30 56 30 56 40 C 56 50 24 50 24 40 Z" fill="#4338CA"/>
      <path d="M 26 38 C 26 32 54 32 54 38 Z" fill="#6366F1"/>
      <!-- Reflection highlight -->
      <ellipse cx="46" cy="36" rx="5" ry="2" fill="#E0E7FF" transform="rotate(-15 46 36)"/>
      <!-- Collar -->
      <rect x="28" y="60" width="24" height="8" rx="3" fill="#52525B"/>
    </svg>`,
  },
  {
    id: 'cyber-samurai',
    name: 'Cyber Samurai',
    category: 'cyber',
    svg: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="80" rx="40" fill="#18181B"/>
      <!-- Helmet crest -->
      <polygon points="40,12 34,26 46,26" fill="#F43F5E"/>
      <circle cx="40" cy="18" r="3" fill="#FFE4E6"/>
      <!-- Mask -->
      <path d="M 22 28 C 22 52 30 64 40 64 C 50 64 58 52 58 28 Z" fill="#27272A" stroke="#FB7185" stroke-width="2"/>
      <!-- Visor slit -->
      <rect x="28" y="36" width="24" height="6" rx="2" fill="#E11D48"/>
      <line x1="30" y1="39" x2="50" y2="39" stroke="#FFE4E6" stroke-width="1.5"/>
      <!-- Breathing filter -->
      <polygon points="40,46 34,56 46,56" fill="#3F3F46"/>
    </svg>`,
  },
  {
    id: 'cyber-pilot',
    name: 'Hyper Pilot',
    category: 'cyber',
    svg: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="80" rx="40" fill="#042F2E"/>
      <!-- Helmet -->
      <circle cx="40" cy="40" r="26" fill="#065F46" stroke="#34D399" stroke-width="2"/>
      <!-- Aviator Visor -->
      <ellipse cx="33" cy="38" rx="8" ry="7" fill="#F59E0B"/>
      <ellipse cx="47" cy="38" rx="8" ry="7" fill="#F59E0B"/>
      <rect x="33" y="36" width="14" height="3" fill="#D97706"/>
      <!-- Mic -->
      <path d="M 40 50 C 44 56 48 54 52 52" stroke="#E2E8F0" stroke-width="2" fill="none" stroke-linecap="round"/>
      <circle cx="53" cy="51" r="2.5" fill="#34D399"/>
    </svg>`,
  },

  // ─── 4. Abstract & Cosmic ─────────────────────────────────────────────────────
  {
    id: 'abstract-supernova',
    name: 'Cosmic Supernova',
    category: 'abstract',
    svg: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="80" rx="40" fill="#1E1B4B"/>
      <circle cx="40" cy="40" r="28" fill="#312E81"/>
      <circle cx="40" cy="40" r="18" fill="#4338CA"/>
      <circle cx="40" cy="40" r="10" fill="#6366F1"/>
      <circle cx="40" cy="40" r="4" fill="#FFFFFF"/>
      <!-- Orbital rings -->
      <ellipse cx="40" cy="40" rx="30" ry="10" fill="none" stroke="#C7D2FE" stroke-width="1.5" transform="rotate(-30 40 40)"/>
      <circle cx="56" cy="30" r="2.5" fill="#FDE047"/>
    </svg>`,
  },
  {
    id: 'abstract-prism',
    name: 'Prism Core',
    category: 'abstract',
    svg: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="80" rx="40" fill="#0F172A"/>
      <!-- Isometric cube -->
      <polygon points="40,16 62,28 40,40 18,28" fill="#38BDF8"/>
      <polygon points="40,40 62,28 62,54 40,66" fill="#0284C7"/>
      <polygon points="40,40 18,28 18,54 40,66" fill="#0369A1"/>
      <circle cx="40" cy="40" r="4" fill="#FFFFFF"/>
    </svg>`,
  },
  {
    id: 'abstract-quantum',
    name: 'Quantum Nexus',
    category: 'abstract',
    svg: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="80" rx="40" fill="#1C1917"/>
      <ellipse cx="40" cy="40" rx="26" ry="10" fill="none" stroke="#F97316" stroke-width="2" transform="rotate(0 40 40)"/>
      <ellipse cx="40" cy="40" rx="26" ry="10" fill="none" stroke="#E11D48" stroke-width="2" transform="rotate(60 40 40)"/>
      <ellipse cx="40" cy="40" rx="26" ry="10" fill="none" stroke="#8B5CF6" stroke-width="2" transform="rotate(120 40 40)"/>
      <circle cx="40" cy="40" r="7" fill="#FBBF24"/>
    </svg>`,
  },

  // ─── 5. Cute & Creatures ──────────────────────────────────────────────────────
  {
    id: 'cute-fox',
    name: 'Cyber Fox',
    category: 'cute',
    svg: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="80" rx="40" fill="#431407"/>
      <!-- Ears -->
      <polygon points="20,16 32,32 18,36" fill="#EA580C"/>
      <polygon points="22,22 28,30 20,32" fill="#FEF08A"/>
      <polygon points="60,16 48,32 62,36" fill="#EA580C"/>
      <polygon points="58,22 52,30 60,32" fill="#FEF08A"/>
      <!-- Head -->
      <polygon points="40,58 20,34 60,34" fill="#F97316"/>
      <polygon points="40,58 28,38 52,38" fill="#FFF7ED"/>
      <!-- Nose & Eyes -->
      <circle cx="40" cy="54" r="2.5" fill="#1C1917"/>
      <circle cx="32" cy="38" r="2.5" fill="#1C1917"/>
      <circle cx="48" cy="38" r="2.5" fill="#1C1917"/>
    </svg>`,
  },
  {
    id: 'cute-cat',
    name: 'Pixel Kitty',
    category: 'cute',
    svg: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="80" rx="40" fill="#1E1B4B"/>
      <!-- Ears -->
      <polygon points="22,18 34,30 20,34" fill="#818CF8"/>
      <polygon points="24,24 30,30 22,32" fill="#F472B6"/>
      <polygon points="58,18 46,30 60,34" fill="#818CF8"/>
      <polygon points="56,24 50,30 58,32" fill="#F472B6"/>
      <!-- Head -->
      <circle cx="40" cy="42" r="20" fill="#6366F1"/>
      <ellipse cx="33" cy="40" rx="3.5" ry="4" fill="#FFFFFF"/>
      <ellipse cx="47" cy="40" rx="3.5" ry="4" fill="#FFFFFF"/>
      <circle cx="33" cy="40" r="2" fill="#0F172A"/>
      <circle cx="47" cy="40" r="2" fill="#0F172A"/>
      <polygon points="40,45 38,43 42,43" fill="#F472B6"/>
      <!-- Whiskers -->
      <line x1="24" y1="44" x2="16" y2="43" stroke="#C7D2FE" stroke-width="1.5"/>
      <line x1="24" y1="46" x2="16" y2="48" stroke="#C7D2FE" stroke-width="1.5"/>
      <line x1="56" y1="44" x2="64" y2="43" stroke="#C7D2FE" stroke-width="1.5"/>
      <line x1="56" y1="46" x2="64" y2="48" stroke="#C7D2FE" stroke-width="1.5"/>
    </svg>`,
  },
  {
    id: 'cute-owl',
    name: 'Tech Owl',
    category: 'cute',
    svg: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="80" rx="40" fill="#064E3B"/>
      <!-- Body -->
      <circle cx="40" cy="42" r="22" fill="#059669"/>
      <!-- Ear tufts -->
      <polygon points="24,20 32,32 20,30" fill="#047857"/>
      <polygon points="56,20 48,32 60,30" fill="#047857"/>
      <!-- Glasses / Sensor Eyes -->
      <circle cx="32" cy="38" r="8" fill="#ECFDF5" stroke="#F59E0B" stroke-width="2"/>
      <circle cx="48" cy="38" r="8" fill="#ECFDF5" stroke="#F59E0B" stroke-width="2"/>
      <circle cx="32" cy="38" r="3" fill="#064E3B"/>
      <circle cx="48" cy="38" r="3" fill="#064E3B"/>
      <polygon points="40,42 37,47 43,47" fill="#F59E0B"/>
    </svg>`,
  },
]

export function getAvatarDataUrl(id: string | null | undefined): string | null {
  if (!id) return null
  const item = AVATAR_COLLECTION.find(a => a.id === id)
  if (!item) {
    // If it's already a data: or http URL
    if (id.startsWith('data:') || id.startsWith('http')) return id
    return null
  }
  return svgToDataUrl(item.svg)
}
