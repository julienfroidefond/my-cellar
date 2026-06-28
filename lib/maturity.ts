export interface MaturityWindow {
  min: number; // années après millésime → à boire à partir de
  max: number; // années après millésime → à boire avant
  note: string;
}

interface Rule {
  appellation?: string[]; // keywords, case-insensitive, OR match
  region?: string[];      // keywords, case-insensitive, OR match
  color?: string[];
  min: number;
  max: number;
  note: string;
}

// Règles ordonnées du plus spécifique (appellation) au plus général (couleur).
// Le premier match l'emporte.
const RULES: Rule[] = [

  // ── Champagne ────────────────────────────────────────────────────────────────
  { appellation: ["blanc de blancs"], region: ["champagne"], min: 3, max: 20, note: "Blanc de Blancs — acidité élevée, garde remarquable" },
  { appellation: ["blanc de noirs"], region: ["champagne"], min: 2, max: 12, note: "Blanc de Noirs" },
  { appellation: ["prestige", "cuvée spéciale", "grand cru"], region: ["champagne"], min: 5, max: 25, note: "Champagne prestige" },
  { region: ["champagne"], min: 0, max: 8, note: "Champagne — à boire relativement jeune" },

  // ── Bordeaux — grands crus ────────────────────────────────────────────────────
  { appellation: ["pauillac"],        color: ["rouge"], min: 8, max: 35, note: "Pauillac — tanins puissants, grande garde" },
  { appellation: ["saint-estèphe", "saint-estephe"], color: ["rouge"], min: 8, max: 30, note: "Saint-Estèphe — robuste, longue garde" },
  { appellation: ["saint-julien"],    color: ["rouge"], min: 6, max: 28, note: "Saint-Julien — élégant, garde classique" },
  { appellation: ["margaux"],         color: ["rouge"], min: 6, max: 30, note: "Margaux — finesse, excellent potentiel de garde" },
  { appellation: ["pomerol"],         color: ["rouge"], min: 5, max: 25, note: "Pomerol — Merlot dominant, velouté" },
  { appellation: ["saint-émilion", "saint-emilion", "st-emilion"], color: ["rouge"], min: 4, max: 22, note: "Saint-Émilion — diverse, de bonne garde" },
  { appellation: ["pessac-léognan", "pessac-leognan"], color: ["rouge"], min: 6, max: 25, note: "Pessac-Léognan rouge — complexe, garde" },
  { appellation: ["pessac-léognan", "pessac-leognan"], color: ["blanc"], min: 3, max: 15, note: "Pessac-Léognan blanc — sauvignon/sémillon, belle garde" },
  { appellation: ["graves"],          color: ["rouge"], min: 4, max: 18, note: "Graves rouge" },
  { appellation: ["graves"],          color: ["blanc"], min: 2, max: 10, note: "Graves blanc" },
  { appellation: ["sauternes", "barsac"], min: 5, max: 50, note: "Sauternes/Barsac — liquoreux, garde exceptionnelle" },
  { appellation: ["moulis", "listrac"], color: ["rouge"], min: 4, max: 15, note: "Moulis/Listrac — bonne garde" },
  { appellation: ["haut-médoc"],      color: ["rouge"], min: 3, max: 15, note: "Haut-Médoc" },
  { appellation: ["médoc"],           color: ["rouge"], min: 3, max: 12, note: "Médoc" },
  { region: ["bordeaux"],             color: ["rouge"], min: 2, max: 10, note: "Bordeaux rouge générique" },
  { region: ["bordeaux"],             color: ["blanc"], min: 1, max: 5,  note: "Bordeaux blanc générique — frais, boire jeune" },

  // ── Bourgogne rouge — grands crus ────────────────────────────────────────────
  { appellation: ["chambertin", "musigny", "romanée", "richebourg", "échezeaux", "corton", "bonnes-mares", "la tâche", "montrachet"], color: ["rouge"], min: 8, max: 30, note: "Grand cru Bourgogne rouge — sommet de garde" },
  { appellation: ["gevrey-chambertin", "chambolle-musigny", "vosne-romanée", "nuits-saint-georges", "morey-saint-denis", "pommard", "volnay", "beaune"], color: ["rouge"], min: 5, max: 20, note: "Village/1er cru Bourgogne rouge" },
  { appellation: ["mercurey", "givry", "rully"], color: ["rouge"], min: 3, max: 12, note: "Côte Chalonnaise rouge" },
  { region: ["bourgogne"], color: ["rouge"], min: 2, max: 10, note: "Bourgogne rouge générique" },

  // ── Bourgogne blanc ──────────────────────────────────────────────────────────
  { appellation: ["montrachet", "chevalier-montrachet", "bâtard-montrachet", "corton-charlemagne"], min: 5, max: 25, note: "Grand cru Bourgogne blanc — garde remarquable" },
  { appellation: ["puligny-montrachet", "chassagne-montrachet", "meursault"], min: 4, max: 15, note: "Côte de Beaune blanc — richesse, longévité" },
  { appellation: ["saint-aubin", "auxey-duresses", "saint-romain"], min: 2, max: 8, note: "Côte de Beaune blanc Village" },
  { appellation: ["chablis grand cru"], min: 5, max: 20, note: "Chablis Grand Cru — iode, minéralité, garde" },
  { appellation: ["chablis premier cru", "chablis 1er cru"], min: 3, max: 12, note: "Chablis Premier Cru" },
  { appellation: ["chablis"], min: 1, max: 6, note: "Chablis — frais, boire assez jeune" },
  { appellation: ["pouilly-fuissé", "saint-véran", "mâcon"], min: 1, max: 5, note: "Mâconnais blanc" },
  { region: ["bourgogne"], color: ["blanc"], min: 1, max: 7, note: "Bourgogne blanc générique" },

  // ── Beaujolais ───────────────────────────────────────────────────────────────
  { appellation: ["beaujolais nouveau"], min: 0, max: 1, note: "Beaujolais Nouveau — boire dans l'année" },
  { appellation: ["moulin-à-vent", "moulin a vent"], min: 3, max: 12, note: "Moulin-à-Vent — le plus solide des crus, peut vieillir" },
  { appellation: ["morgon"], min: 2, max: 10, note: "Morgon — charpenté, garde appréciable" },
  { appellation: ["fleurie", "chénas", "chenas", "juliénas", "julienas", "chiroubles", "saint-amour"], min: 2, max: 7, note: "Cru Beaujolais" },
  { appellation: ["régnié", "regnie", "brouilly", "côte de brouilly", "cote de brouilly"], min: 1, max: 5, note: "Cru Beaujolais léger" },
  { appellation: ["beaujolais villages"], min: 0, max: 3, note: "Beaujolais Villages" },
  { region: ["beaujolais"], min: 0, max: 3, note: "Beaujolais générique" },

  // ── Rhône nord ───────────────────────────────────────────────────────────────
  { appellation: ["hermitage"], color: ["rouge"], min: 8, max: 30, note: "Hermitage rouge — Syrah pure, garde exceptionnelle" },
  { appellation: ["hermitage"], color: ["blanc"], min: 5, max: 25, note: "Hermitage blanc — Marsanne/Roussanne, garde impressionnante" },
  { appellation: ["côte-rôtie", "cote-rotie"], min: 5, max: 25, note: "Côte-Rôtie — Syrah élégante, longue garde" },
  { appellation: ["cornas"], min: 5, max: 20, note: "Cornas — Syrah sévère, vieillissement obligatoire" },
  { appellation: ["saint-joseph"], color: ["rouge"], min: 3, max: 12, note: "Saint-Joseph rouge" },
  { appellation: ["saint-joseph"], color: ["blanc"], min: 2, max: 8, note: "Saint-Joseph blanc" },
  { appellation: ["château-grillet", "chateau-grillet", "condrieu"], min: 1, max: 6, note: "Condrieu/Château-Grillet — Viognier, arômes primaires à préserver" },
  { appellation: ["crozes-hermitage", "crozes hermitage"], color: ["rouge"], min: 2, max: 10, note: "Crozes-Hermitage rouge" },
  { appellation: ["crozes-hermitage", "crozes hermitage"], color: ["blanc"], min: 1, max: 5, note: "Crozes-Hermitage blanc" },

  // ── Rhône sud ────────────────────────────────────────────────────────────────
  { appellation: ["châteauneuf-du-pape", "chateauneuf-du-pape", "chateauneuf du pape"], color: ["rouge"], min: 5, max: 22, note: "Châteauneuf-du-Pape rouge — complexe, garde" },
  { appellation: ["châteauneuf-du-pape", "chateauneuf-du-pape", "chateauneuf du pape"], color: ["blanc"], min: 2, max: 10, note: "Châteauneuf-du-Pape blanc" },
  { appellation: ["gigondas"], min: 3, max: 15, note: "Gigondas — puissant, bonne garde" },
  { appellation: ["vacqueyras"], min: 3, max: 10, note: "Vacqueyras" },
  { appellation: ["rasteau", "lirac"], min: 3, max: 10, note: "Rasteau / Lirac" },
  { appellation: ["tavel"], min: 0, max: 3, note: "Tavel rosé — peut vieillir légèrement" },
  { appellation: ["côtes du rhône villages", "cotes du rhone villages"], min: 2, max: 7, note: "Côtes du Rhône Villages" },
  { region: ["rhône", "rhone"], color: ["rouge"], min: 1, max: 5, note: "Côtes du Rhône générique" },
  { region: ["rhône", "rhone"], color: ["blanc"], min: 1, max: 4, note: "Rhône blanc générique" },

  // ── Alsace ───────────────────────────────────────────────────────────────────
  { appellation: ["vendanges tardives", "sélection de grains nobles", "selection de grains nobles"], min: 5, max: 30, note: "Alsace liquoreux — garde exceptionnelle" },
  { appellation: ["riesling grand cru", "riesling gc"], min: 5, max: 25, note: "Riesling Grand Cru — apogée de l'Alsace" },
  { appellation: ["riesling"], min: 2, max: 12, note: "Riesling d'Alsace — acidité, garde honorable" },
  { appellation: ["gewurztraminer", "gewürztraminer"], min: 2, max: 10, note: "Gewurztraminer — aromatique, quelques années de garde" },
  { appellation: ["pinot gris"], min: 2, max: 10, note: "Pinot Gris Alsace" },
  { appellation: ["muscat d'alsace", "muscat alsace"], min: 0, max: 3, note: "Muscat d'Alsace — boire jeune" },
  { appellation: ["pinot noir alsace", "pinot noir d'alsace"], min: 2, max: 8, note: "Pinot Noir d'Alsace — léger, fruit" },
  { appellation: ["sylvaner", "pinot blanc", "auxerrois"], min: 0, max: 4, note: "Alsace frais — boire jeune" },
  { appellation: ["crémant d'alsace", "cremant d'alsace"], min: 0, max: 4, note: "Crémant d'Alsace" },
  { region: ["alsace"], min: 1, max: 8, note: "Alsace générique" },

  // ── Loire ────────────────────────────────────────────────────────────────────
  { appellation: ["bonnezeaux", "quarts de chaume", "coteaux du layon"], min: 8, max: 40, note: "Loire liquoreux — garde exceptionnelle" },
  { appellation: ["vouvray", "montlouis"], color: ["blanc"], min: 5, max: 30, note: "Vouvray/Montlouis moelleux — potentiel impressionnant" },
  { appellation: ["savennières", "savennieres"], min: 4, max: 20, note: "Savennières — Chenin sec, minéral, grande garde" },
  { appellation: ["sancerre"], color: ["rouge"], min: 3, max: 10, note: "Sancerre rouge — Pinot Noir élégant" },
  { appellation: ["sancerre", "pouilly-fumé", "pouilly-fume", "quincy", "reuilly", "menetou-salon"], color: ["blanc"], min: 2, max: 8, note: "Sauvignon Loire — frais, garde modérée" },
  { appellation: ["chinon", "bourgueil", "saint-nicolas-de-bourgueil"], min: 3, max: 15, note: "Cabernet Franc Loire — élégant, garde" },
  { appellation: ["saumur-champigny"], min: 3, max: 12, note: "Saumur-Champigny" },
  { appellation: ["anjou rouge", "anjou-villages"], min: 3, max: 10, note: "Anjou rouge" },
  { appellation: ["muscadet"], min: 0, max: 4, note: "Muscadet — frais, minéral sur lie" },
  { region: ["loire"], color: ["rouge"], min: 2, max: 8, note: "Loire rouge générique" },
  { region: ["loire"], color: ["blanc"], min: 1, max: 5, note: "Loire blanc générique" },

  // ── Languedoc-Roussillon ──────────────────────────────────────────────────────
  { appellation: ["banyuls", "maury"], min: 5, max: 30, note: "Banyuls/Maury — vin doux naturel, garde remarquable" },
  { appellation: ["collioure"], min: 3, max: 12, note: "Collioure" },
  { appellation: ["faugères", "faugeres"], min: 3, max: 12, note: "Faugères — schistes, bonne garde" },
  { appellation: ["saint-chinian"], min: 3, max: 10, note: "Saint-Chinian" },
  { appellation: ["pic saint-loup", "pic-saint-loup"], min: 3, max: 12, note: "Pic Saint-Loup" },
  { appellation: ["corbières", "corbieres", "fitou", "minervois"], min: 2, max: 8, note: "Languedoc classique" },
  { appellation: ["picpoul", "picpoul de pinet"], min: 0, max: 2, note: "Picpoul — boire dans les 2 ans" },
  { region: ["languedoc", "roussillon"], color: ["rouge"], min: 2, max: 8, note: "Languedoc-Roussillon rouge" },
  { region: ["languedoc", "roussillon"], color: ["blanc", "rosé"], min: 0, max: 3, note: "Languedoc-Roussillon blanc/rosé" },

  // ── Provence ─────────────────────────────────────────────────────────────────
  { appellation: ["bandol"], color: ["rouge"], min: 5, max: 20, note: "Bandol rouge — Mourvèdre, grande garde" },
  { appellation: ["bandol"], color: ["rosé"], min: 1, max: 5, note: "Bandol rosé — peut vieillir quelques années" },
  { appellation: ["palette", "cassis"], color: ["rouge"], min: 3, max: 12, note: "Palette/Cassis rouge" },
  { region: ["provence"], color: ["rosé"], min: 0, max: 2, note: "Provence rosé — fraîcheur, boire jeune" },
  { region: ["provence"], color: ["rouge"], min: 2, max: 8, note: "Provence rouge" },
  { region: ["provence"], color: ["blanc"], min: 1, max: 4, note: "Provence blanc" },

  // ── Sud-Ouest ────────────────────────────────────────────────────────────────
  { appellation: ["madiran"], min: 5, max: 20, note: "Madiran — Tannat, tanins imposants, grande garde" },
  { appellation: ["cahors"], min: 4, max: 18, note: "Cahors — Malbec noir, garde classique" },
  { appellation: ["jurançon"], color: ["blanc"], min: 5, max: 25, note: "Jurançon moelleux — garde impressionnante" },
  { appellation: ["jurançon sec", "jurançon"], min: 2, max: 8, note: "Jurançon sec" },
  { appellation: ["irouléguy"], min: 3, max: 12, note: "Irouléguy" },
  { appellation: ["gaillac", "fronton", "buzet"], min: 2, max: 8, note: "Sud-Ouest classique" },
  { appellation: ["monbazillac", "saussignac"], min: 5, max: 25, note: "Liquoreux Sud-Ouest" },
  { appellation: ["bergerac"], min: 2, max: 8, note: "Bergerac" },
  { region: ["sud-ouest"], color: ["rouge"], min: 3, max: 12, note: "Sud-Ouest rouge" },
  { region: ["sud-ouest"], color: ["blanc"], min: 1, max: 6, note: "Sud-Ouest blanc" },

  // ── Jura ─────────────────────────────────────────────────────────────────────
  { appellation: ["vin jaune", "château-chalon", "chateau-chalon"], min: 5, max: 50, note: "Vin Jaune / Château-Chalon — garde quasi illimitée" },
  { appellation: ["l'étoile", "arbois", "côtes du jura", "cotes du jura"], color: ["blanc"], min: 3, max: 15, note: "Jura blanc — Savagnin, Chardonnay, bonne garde" },
  { appellation: ["arbois", "côtes du jura", "cotes du jura"], color: ["rouge"], min: 3, max: 12, note: "Jura rouge — Poulsard, Trousseau, Pinot Noir" },
  { region: ["jura"], min: 2, max: 12, note: "Jura générique" },

  // ── Savoie ───────────────────────────────────────────────────────────────────
  { appellation: ["roussette de savoie", "chignin-bergeron", "bergeron"], min: 2, max: 8, note: "Savoie blanc garde" },
  { appellation: ["mondeuse"], min: 3, max: 10, note: "Mondeuse — rouge de garde de Savoie" },
  { region: ["savoie"], min: 0, max: 4, note: "Savoie — boire assez jeune" },

  // ── Corse ────────────────────────────────────────────────────────────────────
  { appellation: ["patrimonio"], color: ["rouge"], min: 3, max: 15, note: "Patrimonio rouge — Nielluccio, belle garde" },
  { appellation: ["ajaccio"], color: ["rouge"], min: 3, max: 12, note: "Ajaccio rouge — Sciacarello" },
  { region: ["corse"], color: ["rouge"], min: 2, max: 8, note: "Corse rouge" },
  { region: ["corse"], color: ["blanc", "rosé"], min: 0, max: 3, note: "Corse blanc/rosé" },

  // ── Italie ───────────────────────────────────────────────────────────────────
  { appellation: ["barolo", "barbaresco"], min: 8, max: 30, note: "Barolo/Barbaresco — Nebbiolo, garde exceptionnelle" },
  { appellation: ["brunello di montalcino", "brunello"], min: 8, max: 30, note: "Brunello — Sangiovese, très grande garde" },
  { appellation: ["amarone"], min: 8, max: 25, note: "Amarone — puissant, concentration exceptionnelle" },
  { appellation: ["valpolicella ripasso"], min: 3, max: 12, note: "Ripasso — entre valpolicella et amarone" },
  { appellation: ["chianti classico riserva", "chianti riserva"], min: 4, max: 15, note: "Chianti Classico Riserva" },
  { appellation: ["chianti classico"], min: 3, max: 10, note: "Chianti Classico" },
  { appellation: ["chianti"], min: 1, max: 6, note: "Chianti générique" },
  { appellation: ["super toscan", "bolgheri"], min: 5, max: 20, note: "Super Toscan / Bolgheri" },
  { appellation: ["sforzato", "sfursat"], min: 5, max: 20, note: "Sforzato — Valtellina passerillé" },

  // ── Espagne ──────────────────────────────────────────────────────────────────
  { appellation: ["rioja gran reserva"], min: 5, max: 20, note: "Rioja Gran Reserva — déjà évolué en cave" },
  { appellation: ["rioja reserva"], min: 3, max: 15, note: "Rioja Reserva" },
  { appellation: ["rioja"], min: 1, max: 8, note: "Rioja Crianza/générique" },
  { appellation: ["ribera del duero"], min: 4, max: 18, note: "Ribera del Duero — Tempranillo, grande garde" },
  { appellation: ["priorat", "priorato"], min: 5, max: 20, note: "Priorat — Garnacha/Carignan, concentré, garde" },
  { appellation: ["toro"], min: 4, max: 15, note: "Toro — Tempranillo puissant" },
  { appellation: ["bierzo"], min: 3, max: 12, note: "Bierzo — Mencía, élégance" },
  { appellation: ["albariño", "albarino", "rías baixas", "rias baixas"], min: 0, max: 4, note: "Albariño — aromatique, boire jeune" },
  { appellation: ["cava"], min: 0, max: 5, note: "Cava" },

  // ── Portugal ─────────────────────────────────────────────────────────────────
  { appellation: ["vintage port", "port"], min: 10, max: 50, note: "Porto Vintage — garde légendaire" },
  { appellation: ["douro"], color: ["rouge"], min: 4, max: 18, note: "Douro rouge — Touriga Nacional, belle garde" },
  { appellation: ["dão", "dao"], min: 4, max: 15, note: "Dão rouge" },
  { appellation: ["alentejo"], color: ["rouge"], min: 3, max: 12, note: "Alentejo rouge" },
  { appellation: ["vinho verde"], min: 0, max: 2, note: "Vinho Verde — fraîcheur, boire très jeune" },

  // ── Allemagne ────────────────────────────────────────────────────────────────
  { appellation: ["trockenbeerenauslese", "beerenauslese", "eiswein"], min: 5, max: 40, note: "Grands liquoreux allemands — garde exceptionnelle" },
  { appellation: ["spätlese", "auslese"], min: 3, max: 20, note: "Riesling de garde allemand" },
  { appellation: ["kabinett", "spätburgunder"], min: 2, max: 10, note: "Allemagne classique" },

  // ── Nouveau Monde ────────────────────────────────────────────────────────────
  { region: ["mendoza", "patagonie"], appellation: ["gran reserva", "reserva", "malbec"], min: 3, max: 15, note: "Malbec argentin haut de gamme" },
  { region: ["mendoza", "patagonie"], min: 1, max: 7, note: "Argentine générique" },
  { appellation: ["napa valley", "napa"], color: ["rouge"], min: 5, max: 20, note: "Napa Valley Cabernet — garde impressionnante" },
  { appellation: ["sonoma", "willamette"], color: ["rouge"], min: 3, max: 15, note: "Oregon/Sonoma Pinot Noir" },
  { appellation: ["barossa", "mcclaren vale", "coonawarra"], min: 3, max: 15, note: "Australie du Sud — Shiraz de garde" },
  { appellation: ["marlborough"], color: ["blanc"], min: 0, max: 4, note: "Marlborough Sauvignon — aromatique, boire jeune" },

  // ── Arménie ──────────────────────────────────────────────────────────────────
  { region: ["arménie", "armenie", "armenia"], min: 2, max: 10, note: "Arménie — cépage indigène, garde appréciable" },

  // ── Fallbacks par couleur ─────────────────────────────────────────────────────
  { color: ["rouge"], min: 3, max: 10, note: "Vin rouge — garde estimée générique" },
  { color: ["blanc"], min: 1, max: 5,  note: "Vin blanc — garde estimée générique" },
  { color: ["rosé"],  min: 0, max: 2,  note: "Rosé — boire dans les 2 ans" },
];

function normalize(s: string | null | undefined): string {
  return (s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function keywords(arr: string[]): string[] {
  return arr.map((k) => normalize(k));
}

function matchesKeywords(value: string, kw: string[]): boolean {
  const v = normalize(value);
  return kw.some((k) => v.includes(k));
}

export function estimateMaturity(wine: {
  region?: string | null;
  appellation?: string | null;
  color?: string | null;
  vintage?: number | null;
}): { drinkFrom: number; drinkUntil: number; note: string } | null {
  if (!wine.vintage) return null;

  const region = wine.region ?? "";
  const appellation = wine.appellation ?? "";
  const color = wine.color ?? "";

  for (const rule of RULES) {
    const appMatch = !rule.appellation || matchesKeywords(appellation, keywords(rule.appellation));
    const regionMatch = !rule.region || matchesKeywords(region, keywords(rule.region));
    const colorMatch = !rule.color || keywords(rule.color).includes(normalize(color));

    if (appMatch && regionMatch && colorMatch) {
      return {
        drinkFrom: wine.vintage + rule.min,
        drinkUntil: wine.vintage + rule.max,
        note: rule.note,
      };
    }
  }

  return null;
}
