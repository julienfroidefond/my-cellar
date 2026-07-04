export type AppellationCoord = { lat: number; lng: number };

export const APPELLATION_COORDS: Record<string, AppellationCoord> = {
  // ── Bordeaux ─────────────────────────────────────────────────────────────
  "Bordeaux":                       { lat: 44.84, lng: -0.58 },
  "Bordeaux Supérieur":             { lat: 44.84, lng: -0.58 },
  "Médoc":                          { lat: 45.38, lng: -0.9 },
  "Haut-Médoc":                     { lat: 45.1,  lng: -0.70 },
  "Margaux":                        { lat: 45.04, lng: -0.67 },
  "Saint-Julien":                   { lat: 45.15, lng: -0.77 },
  "Pauillac":                       { lat: 45.19, lng: -0.74 },
  "Saint-Estèphe":                  { lat: 45.26, lng: -0.77 },
  "Listrac-Médoc":                  { lat: 45.06, lng: -0.72 },
  "Moulis-en-Médoc":                { lat: 45.07, lng: -0.71 },
  "Graves":                         { lat: 44.55, lng: -0.45 },
  "Pessac-Léognan":                 { lat: 44.75, lng: -0.63 },
  "Sauternes":                      { lat: 44.55, lng: -0.34 },
  "Barsac":                         { lat: 44.57, lng: -0.33 },
  "Saint-Émilion":                  { lat: 44.89, lng: -0.15 },
  "Pomerol":                        { lat: 44.93, lng: -0.19 },
  "Fronsac":                        { lat: 44.97, lng: -0.27 },
  "Canon-Fronsac":                  { lat: 44.97, lng: -0.25 },
  "Puisseguin-Saint-Émilion":       { lat: 44.93, lng: -0.10 },
  "Lussac-Saint-Émilion":           { lat: 44.95, lng: -0.10 },
  "Montagne-Saint-Émilion":         { lat: 44.97, lng: -0.12 },
  "Entre-deux-Mers":                { lat: 44.73, lng: -0.33 },
  "Blaye Côtes de Bordeaux":        { lat: 45.12, lng: -0.65 },
  "Castillon Côtes de Bordeaux":    { lat: 44.87, lng: -0.08 },
  "Côtes de Bordeaux":              { lat: 44.70, lng: -0.25 },
  "Bordeaux / Graves":              { lat: 44.55, lng: -0.45 },
  "Bordeaux / Médoc":               { lat: 45.1,  lng: -0.70 },

  // ── Rhône ────────────────────────────────────────────────────────────────
  "Côtes du Rhône":                 { lat: 44.10, lng: 4.70 },
  "Côtes du Rhône Villages":        { lat: 44.20, lng: 4.85 },
  "Vallée du Rhône":                { lat: 44.50, lng: 4.80 },
  "Châteauneuf-du-Pape":            { lat: 44.06, lng: 4.83 },
  "Gigondas":                       { lat: 44.16, lng: 5.01 },
  "Vacqueyras":                     { lat: 44.11, lng: 5.00 },
  "Beaumes-de-Venise":              { lat: 44.12, lng: 5.03 },
  "Saint-Joseph":                   { lat: 45.10, lng: 4.78 },
  "Crozes-Hermitage":               { lat: 45.11, lng: 4.90 },
  "Hermitage":                      { lat: 45.08, lng: 4.87 },
  "Cornas":                         { lat: 44.96, lng: 4.84 },
  "Condrieu":                       { lat: 45.46, lng: 4.75 },
  "Côte-Rôtie":                     { lat: 45.47, lng: 4.74 },
  "Lirac":                          { lat: 44.01, lng: 4.65 },
  "Tavel":                          { lat: 44.01, lng: 4.67 },
  "IGP Collines Rhodaniennes":      { lat: 45.30, lng: 4.90 },

  // ── Bourgogne ────────────────────────────────────────────────────────────
  "Bourgogne":                      { lat: 47.00, lng: 4.80 },
  "Chablis":                        { lat: 47.81, lng: 3.80 },
  "Nuits-Saint-Georges":            { lat: 47.14, lng: 4.97 },
  "Gevrey-Chambertin":              { lat: 47.23, lng: 4.99 },
  "Vosne-Romanée":                  { lat: 47.17, lng: 4.96 },
  "Chambolle-Musigny":              { lat: 47.20, lng: 4.97 },
  "Beaune":                         { lat: 47.02, lng: 4.84 },
  "Pommard":                        { lat: 47.00, lng: 4.79 },
  "Volnay":                         { lat: 46.98, lng: 4.77 },
  "Meursault":                      { lat: 46.97, lng: 4.77 },
  "Puligny-Montrachet":             { lat: 46.95, lng: 4.76 },
  "Chassagne-Montrachet":           { lat: 46.93, lng: 4.75 },
  "Mâcon":                          { lat: 46.31, lng: 4.83 },
  "Pouilly-Fuissé":                 { lat: 46.28, lng: 4.75 },

  // ── Champagne ────────────────────────────────────────────────────────────
  "Champagne":                      { lat: 49.04, lng: 3.95 },

  // ── Alsace ───────────────────────────────────────────────────────────────
  "Alsace":                         { lat: 48.30, lng: 7.50 },
  "Alsace Grand Cru":               { lat: 48.20, lng: 7.45 },

  // ── Loire ────────────────────────────────────────────────────────────────
  "Loire":                          { lat: 47.50, lng: 0.50 },
  "Sancerre":                       { lat: 47.33, lng: 2.84 },
  "Pouilly-Fumé":                   { lat: 47.29, lng: 2.95 },
  "Vouvray":                        { lat: 47.37, lng: 0.80 },
  "Chinon":                         { lat: 47.17, lng: 0.24 },
  "Bourgueil":                      { lat: 47.28, lng: 0.17 },
  "Saint-Nicolas-de-Bourgueil":     { lat: 47.27, lng: 0.15 },
  "Muscadet":                       { lat: 47.20, lng: -1.50 },
  "Anjou":                          { lat: 47.47, lng: -0.55 },
  "Touraine":                       { lat: 47.40, lng: 0.70 },
  "Menetou-Salon":                  { lat: 47.21, lng: 2.55 },

  // ── Languedoc ────────────────────────────────────────────────────────────
  "Languedoc":                      { lat: 43.50, lng: 3.50 },
  "Faugères":                       { lat: 43.65, lng: 3.38 },
  "Saint-Chinian":                  { lat: 43.57, lng: 3.05 },
  "Pic Saint Loup":                 { lat: 43.87, lng: 3.77 },
  "Minervois":                      { lat: 43.45, lng: 2.70 },
  "Corbières":                      { lat: 43.10, lng: 2.50 },
  "Fitou":                          { lat: 42.90, lng: 2.93 },
  "Terrasses du Larzac":            { lat: 43.70, lng: 3.50 },
  "IGP Pays d'Oc":                  { lat: 43.50, lng: 3.50 },
  "IGP Hérault":                    { lat: 43.55, lng: 3.20 },

  // ── Roussillon ───────────────────────────────────────────────────────────
  "Roussillon":                     { lat: 42.70, lng: 2.80 },
  "Côtes Catalanes":                { lat: 42.60, lng: 2.70 },
  "Collioure":                      { lat: 42.52, lng: 3.08 },
  "Banyuls":                        { lat: 42.47, lng: 3.12 },
  "Maury":                          { lat: 42.80, lng: 2.65 },

  // ── Provence ─────────────────────────────────────────────────────────────
  "Provence":                       { lat: 43.50, lng: 6.20 },
  "Côtes de Provence":              { lat: 43.50, lng: 6.20 },
  "Bandol":                         { lat: 43.14, lng: 5.73 },
  "Cassis":                         { lat: 43.21, lng: 5.54 },
  "Les Baux de Provence":           { lat: 43.74, lng: 4.80 },
  "Coteaux d'Aix-en-Provence":      { lat: 43.55, lng: 5.20 },

  // ── Sud-Ouest ────────────────────────────────────────────────────────────
  "Sud-Ouest":                      { lat: 44.00, lng: 0.50 },
  "Cahors":                         { lat: 44.45, lng: 1.44 },
  "Gaillac":                        { lat: 43.90, lng: 1.90 },
  "Bergerac":                       { lat: 44.85, lng: 0.48 },
  "Pécharmant":                     { lat: 44.87, lng: 0.52 },
  "Madiran":                        { lat: 43.52, lng: 0.00 },
  "Irouléguy":                      { lat: 43.10, lng: -1.30 },
  "Jurançon":                       { lat: 43.29, lng: -0.42 },

  // ── Beaujolais ───────────────────────────────────────────────────────────
  "Beaujolais":                     { lat: 46.20, lng: 4.70 },
  "Moulin-à-Vent":                  { lat: 46.24, lng: 4.70 },
  "Fleurie":                        { lat: 46.20, lng: 4.69 },
  "Juliénas":                       { lat: 46.25, lng: 4.71 },
  "Brouilly":                       { lat: 46.10, lng: 4.69 },
  "Morgon":                         { lat: 46.22, lng: 4.65 },

  // ── Corse ────────────────────────────────────────────────────────────────
  "Corse":                          { lat: 42.00, lng: 9.00 },
  "Ajaccio":                        { lat: 41.93, lng: 8.74 },
  "Patrimonio":                     { lat: 42.67, lng: 9.35 },

  // ── Jura ─────────────────────────────────────────────────────────────────
  "Jura":                           { lat: 46.80, lng: 5.60 },
  "Arbois":                         { lat: 46.90, lng: 5.78 },

  // ── Savoie ───────────────────────────────────────────────────────────────
  "Savoie":                         { lat: 45.70, lng: 6.20 },
};
