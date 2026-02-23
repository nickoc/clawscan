import type { ScanRule } from "../types.js";
import { makeRule } from "./helpers.js";

const PRIV_001 = makeRule(
  "PRIV-001",
  "high",
  "Location tracking or geolocation access",
  "Skill attempts to access device location or geolocation services.",
  /(?:CoreLocation|CLLocationManager|navigator\.geolocation|whereami|ipinfo\.io\/json|geoip|maxmind)/i
);

const PRIV_002 = makeRule(
  "PRIV-002",
  "high",
  "Contact list or address book access",
  "Skill attempts to access the user's contacts or address book.",
  /(?:ABAddressBook|CNContactStore|contacts\.getAll|\/var\/mobile\/Library\/AddressBook|Contacts\.app)/i
);

const PRIV_003 = makeRule(
  "PRIV-003",
  "high",
  "Browser history or bookmarks access",
  "Skill attempts to read browser history, bookmarks, or saved passwords.",
  /(?:places\.sqlite|History\s+DB|Chrome.*History|Safari.*History|\.mozilla\/firefox|Login\s+Data|Cookies\.sqlite)/i
);

export const privacyRules: ScanRule[] = [PRIV_001, PRIV_002, PRIV_003];
