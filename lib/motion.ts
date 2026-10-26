/**
 * Tokens partagés par toutes les animations GSAP du site.
 *
 * Une seule source de vérité pour les durées, les courbes et les distances :
 * les entrées de page, les révélations au scroll et les transitions de
 * composants gardent ainsi le même rythme. C'est une application qu'on
 * manipule au quotidien : des mouvements courts et nets, jamais bloquants.
 */
export const motion = {
  /** Courbe principale : départ vif, arrivée très douce. */
  ease: "expo.out",
  /** Courbe secondaire pour les petites transitions de composants. */
  easeSoft: "power3.out",
  /** Pose d'un objet (bouteille) : léger dépassement puis stabilisation. */
  easeSettle: "back.out(1.3)",
  duration: {
    fast: 0.35,
    base: 0.7,
    slow: 0.9,
    bottle: 1.2,
    wipe: 1.1,
    count: 1.4,
    grow: 1.1,
  },
  /** Décalage entre deux éléments d'une même cascade. */
  stagger: 0.06,
  revealStagger: 0.06,
  enterDistance: 16,
  revealDistance: 24,
} as const;

/** Vrai si le système demande de réduire les animations. */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}
