"""Scenario classifier — rule-based first, keyword fallback.

Classification-first architecture: classify the user's problem into a known
scenario BEFORE touching RAG or LLM.  This eliminates hallucinations for
common legal queries.

Supports: English, romanized Hindi, and Sarvam-translated English (natural verb forms).
"""

from __future__ import annotations

import re
import logging

logger = logging.getLogger("chakravyuha")

# ── Simple stemming for common legal verbs ────────────────────────────────────
# Maps inflected forms to a base form so "beat/beating/beaten" all match.
_STEM_MAP: dict[str, str] = {
    "beating": "beat", "beaten": "beat", "beats": "beat",
    "hitting": "hit", "hits": "hit",
    "stealing": "steal", "stolen": "steal", "stole": "steal", "steals": "steal",
    "throwing": "throw", "threw": "throw", "thrown": "throw", "throws": "throw",
    "kicked": "kick", "kicking": "kick", "kicks": "kick",
    "slapping": "slap", "slapped": "slap", "slaps": "slap",
    "punching": "punch", "punched": "punch", "punches": "punch",
    "attacking": "attack", "attacked": "attack", "attacks": "attack",
    "threatening": "threaten", "threatened": "threaten", "threatens": "threaten",
    "harassing": "harass", "harassed": "harass", "harasses": "harass",
    "cheating": "cheat", "cheated": "cheat", "cheats": "cheat",
    "evicting": "evict", "evicted": "evict", "evicts": "evict",
    "firing": "fire", "fired": "fire", "fires": "fire",
    "removing": "remove", "removed": "remove", "removes": "remove",
    "terminating": "terminate", "terminated": "terminate",
    "kidnapping": "kidnap", "kidnapped": "kidnap",
    "stalking": "stalk", "stalked": "stalk",
    "snatching": "snatch", "snatched": "snatch",
    "molesting": "molest", "molested": "molest",
    "defaming": "defame", "defamed": "defame",
    "murdering": "murder", "murdered": "murder",
    "robbing": "rob", "robbed": "rob",
    "looting": "loot", "looted": "loot",
    "divorcing": "divorce", "divorced": "divorce",
    "abusing": "abuse", "abused": "abuse",
    "losing": "lose", "lost": "lose",
    "missing": "miss",
    "caught": "catch",
    "stopped": "stop", "stopping": "stop",
    "refused": "refuse", "refusing": "refuse",
    "denied": "deny", "denying": "deny",
}


def _stem(text: str) -> str:
    """Apply simple stemming to normalize verb forms in text."""
    words = text.split()
    stemmed = [_STEM_MAP.get(w, w) for w in words]
    return " ".join(stemmed)


# ── Scenario definitions ─────────────────────────────────────────────────────
# Each tuple: (scenario_id, list-of-keyword-sets)
# A keyword-set matches when ALL words in it appear in the (stemmed) text.
# First match wins, so order matters (more specific first).

SCENARIO_RULES: list[tuple[str, list[list[str]]]] = [
    # ── Documents / License ──────────────────────────────────────────────
    ("lost_license", [
        ["license", "lose"],           # lost/losing → lose
        ["license", "miss"],           # missing → miss
        ["driving", "license", "lose"],
        ["dl", "lose"],
        ["without", "license"],        # "caught without a license"
        ["no", "license"],
        ["license", "catch"],          # "caught without license"
        ["license", "expire"],
        ["license", "kho"],            # Hindi: license kho gaya
        ["license", "gum"],            # Hindi: license gum ho gaya
    ]),
    ("lost_documents", [
        ["documents", "lose"],
        ["passport", "lose"],
        ["aadhar", "lose"],
        ["aadhaar", "lose"],
        ["pan", "card", "lose"],
        ["documents", "steal"],
        ["id", "lose"],
        ["id", "miss"],
        ["dastavez", "kho"],           # Hindi
        ["kagaz", "kho"],              # Hindi
    ]),

    # ── Traffic / Challan ────────────────────────────────────────────────
    ("traffic_fine", [
        ["challan"],
        ["traffic", "fine"],
        ["e-challan"],
        ["traffic", "police"],
        ["over", "speeding"],
        ["speeding", "ticket"],
        ["signal", "jump"],
        ["red", "light"],
        ["drunk", "driving"],
        ["dui"],
        ["traffic", "violation"],
    ]),
    ("accident", [
        ["accident"],
        ["hit", "run"],
        ["hit-and-run"],
        ["road", "accident"],
        ["vehicle", "accident"],
        ["car", "crash"],
        ["vehicle", "crash"],
    ]),

    # ── Domestic / Family ────────────────────────────────────────────────
    ("domestic_violence", [
        ["domestic", "violence"],
        ["domestic", "abuse"],
        ["husband", "beat"],           # beat/beating/beaten all stem to "beat"
        ["husband", "hit"],
        ["husband", "abuse"],
        ["husband", "throw"],          # threw/thrown → throw
        ["husband", "kick"],
        ["husband", "slap"],
        ["husband", "punch"],
        ["husband", "threaten"],
        ["husband", "harass"],
        ["husband", "torture"],
        ["wife", "beat"],
        ["wife", "abuse"],
        ["beat", "house"],             # "beat me and threw out of house"
        ["violence", "home"],
        ["violence", "house"],
        ["beat", "throw", "house"],    # "beat and threw out of the house"
        ["throw", "out", "house"],     # "threw me out of the house"
        ["kick", "out", "house"],      # "kicked out of the house"
        ["abuse", "home"],
        ["torture", "home"],
        ["pati", "maarta"],            # Hindi: husband beats
        ["ghar", "hinsa"],             # Hindi: domestic violence
        ["maar", "peet"],              # Hindi: beating
        ["maara"],                     # Hindi: hit
        ["peet"],                      # Hindi: beat
    ]),
    ("dowry", [
        ["dowry"],
        ["dowry", "harass"],
        ["dowry", "demand"],
        ["dahej"],
        ["dahej", "maang"],            # Hindi
    ]),
    ("divorce", [
        ["divorce"],
        ["separation"],
        ["mutual", "consent"],
        ["alimony"],
        ["maintenance"],
        ["want", "divorce"],
        ["need", "divorce"],
    ]),
    ("child_custody", [
        ["child", "custody"],
        ["custody", "battle"],
        ["guardianship"],
        ["custody", "child"],
    ]),

    # ── Criminal ─────────────────────────────────────────────────────────
    ("theft", [
        ["theft"],
        ["steal"],                     # stolen/stole/stealing → steal
        ["rob"],                       # robbed/robbing → rob
        ["robbery"],
        ["burglary"],
        ["pickpocket"],
        ["snatch"],                    # snatching/snatched → snatch
        ["phone", "steal"],
        ["mobile", "steal"],
        ["wallet", "steal"],
        ["bag", "steal"],
        ["phone", "snatch"],
        ["chori"],                     # Hindi: theft
        ["loot"],                      # Hindi: robbery
    ]),
    ("assault", [
        ["assault"],
        ["attack"],                    # attacked/attacking → attack
        ["beaten"],                    # kept for direct match before stemming
        ["physical", "harm"],
        ["hit", "me"],
        ["beat", "me"],
        ["punch"],                     # punched → punch
        ["slap"],                      # slapped → slap
        ["hurt", "me"],
        ["injure"],
    ]),
    ("cheating_fraud", [
        ["cheat"],                     # cheating/cheated → cheat
        ["fraud"],
        ["scam"],
        ["online", "fraud"],
        ["upi", "fraud"],
        ["cyber", "fraud"],
        ["money", "cheat"],
        ["deceive"],
        ["swindle"],
    ]),
    ("cyber_crime", [
        ["cyber", "crime"],
        ["hacking"],
        ["hack"],
        ["data", "leak"],
        ["identity", "theft"],
        ["online", "harass"],
        ["cyber", "bully"],
        ["morphed", "photos"],
        ["online", "threat"],
    ]),
    ("defamation", [
        ["defamation"],
        ["defame"],                    # defaming/defamed → defame
        ["slander"],
        ["libel"],
        ["false", "accusation"],
        ["false", "allegation"],
        ["reputation", "damage"],
    ]),
    ("murder_threat", [
        ["murder", "threat"],
        ["death", "threat"],
        ["threaten", "kill"],          # threatening → threaten
        ["life", "danger"],
        ["threat", "life"],
        ["kill", "threat"],
    ]),
    ("kidnapping", [
        ["kidnap"],                    # kidnapping/kidnapped → kidnap
        ["abduction"],
        ["abduct"],
        ["miss", "child"],             # missing → miss
        ["miss", "person"],
    ]),
    ("sexual_harassment", [
        ["sexual", "harass"],          # harassment → harass
        ["molest"],                    # molestation/molested → molest
        ["eve", "teasing"],
        ["stalk"],                     # stalking/stalked → stalk
        ["posh"],
        ["workplace", "harass"],
        ["inappropriate", "touch"],
    ]),
    ("rape", [
        ["rape"],
        ["sexual", "assault"],
        ["sexually", "assault"],
    ]),

    # ── Property / Civil ─────────────────────────────────────────────────
    ("property_dispute", [
        ["property", "dispute"],
        ["land", "dispute"],
        ["land", "grab"],
        ["encroachment"],
        ["illegal", "possession"],
        ["property", "fraud"],
        ["property", "grab"],
    ]),
    ("tenant_landlord", [
        ["tenant"],
        ["landlord"],
        ["rent", "dispute"],
        ["eviction"],
        ["evict"],                     # evicted → evict
        ["security", "deposit"],
        ["house", "owner"],
        ["owner", "kick"],             # kicked → kick
        ["owner", "throw"],            # threw → throw
        ["throw", "out", "house"],     # "threw out of the house"
        ["kick", "out", "home"],
        ["throw", "out", "home"],
        ["evict", "house"],
        ["evict", "home"],
        ["makaan", "malik"],           # Hindi
        ["kiraya"],                    # Hindi
        ["nikala", "ghar"],            # Hindi
    ]),
    ("inheritance", [
        ["inheritance"],
        ["will", "dispute"],
        ["succession"],
        ["ancestral", "property"],
        ["property", "inherit"],
    ]),

    # ── Consumer / Employment ────────────────────────────────────────────
    ("consumer_complaint", [
        ["consumer", "complaint"],
        ["defective", "product"],
        ["refund"],
        ["warranty"],
        ["overcharged"],
        ["consumer", "rights"],
        ["consumer", "forum"],
        ["faulty", "product"],
    ]),
    ("employment_issue", [
        ["wrongful", "termination"],
        ["salary", "not", "paid"],
        ["wages", "due"],
        ["pf", "not", "paid"],
        ["unfair", "dismissal"],
        ["fire", "job"],               # fired → fire
        ["fire", "work"],
        ["employer", "fire"],          # "employer fired me"
        ["fire", "without", "reason"],
        ["fire", "me"],
        ["lose", "job"],               # lost → lose
        ["remove", "job"],             # removed → remove
        ["remove", "work"],
        ["stop", "working"],           # stopped → stop (will add to stems)
        ["terminate"],                 # terminated → terminate
        ["employer", "not", "paying"],
        ["naukri", "nikala"],          # Hindi
        ["tankhwah", "nahi"],          # Hindi
    ]),
    ("rti", [
        ["rti"],
        ["right", "to", "information"],
        ["information", "act"],
    ]),

    # ── Procedures ───────────────────────────────────────────────────────
    ("file_fir", [
        ["file", "fir"],
        ["fir", "register"],
        ["fir", "lodge"],
        ["police", "complaint"],
        ["police", "report"],
        ["zero", "fir"],
        ["how", "fir"],
        ["lodge", "complaint"],
        ["fir", "darj"],               # Hindi
        ["thana"],                     # Hindi
    ]),
    ("bail", [
        ["bail"],
        ["anticipatory", "bail"],
        ["bail", "process"],
        ["get", "bail"],
        ["apply", "bail"],
    ]),
    ("legal_aid", [
        ["legal", "aid"],
        ["free", "lawyer"],
        ["nalsa"],
        ["legal", "services"],
        ["pro", "bono"],
        ["free", "legal"],
        ["cannot", "afford", "lawyer"],
    ]),
    ("fundamental_rights", [
        ["fundamental", "rights"],
        ["article", "14"],
        ["article", "19"],
        ["article", "21"],
        ["right", "to", "equality"],
        ["right", "to", "freedom"],
        ["right", "to", "life"],
        ["constitutional", "rights"],
    ]),
    ("noise_complaint", [
        ["noise", "complaint"],
        ["loud", "music"],
        ["noise", "pollution"],
    ]),
]


def classify(text: str) -> str:
    """Classify user input into a known legal scenario.

    Applies simple stemming to normalize verb forms before matching.
    Returns scenario_id or "unknown".
    """
    if not text or not text.strip():
        return "empty"

    lower = text.lower().strip()
    # Normalize whitespace
    lower = re.sub(r"\s+", " ", lower)

    # Apply stemming to normalize verb forms
    stemmed = _stem(lower)

    for scenario_id, keyword_sets in SCENARIO_RULES:
        for kw_set in keyword_sets:
            # Match against both original and stemmed text
            if all(kw in stemmed for kw in kw_set) or all(kw in lower for kw in kw_set):
                logger.info("Classified '%s' -> %s (matched: %s)", text[:50], scenario_id, kw_set)
                return scenario_id

    logger.info("Classified '%s' -> unknown", text[:50])
    return "unknown"
