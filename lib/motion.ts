/**
 * Tokens partagés par toutes les animations GSAP du site.
 *
 * Une seule source de vérité pour les durées, les courbes et les distances :
 * les entrées de page, les révélations au scroll et les transitions de
 * composants gardent ainsi le même rythme.
 */
export const motion = {
  ease: "power3.out",
  easeSoft: "power2.out",
  duration: {
    fast: 0.3,
    base: 0.55,
    slow: 1,
    bottle: 1,
  },
  stagger: 0.07,
  revealStagger: 0.08,
  enterDistance: 18,
  revealDistance: 64,
} as const;

/** Vrai si le système demande de réduire les animations. */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}
