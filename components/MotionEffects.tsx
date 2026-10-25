"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion, prefersReducedMotion } from "@/lib/motion";

const ENTER_SELECTOR = "[data-enter]";
const REVEAL_SELECTOR = "[data-reveal]";

/**
 * Orchestre toutes les animations d'entrée du site avec GSAP.
 *
 * - `[data-enter]` : entrée au montage de la page, en cascade dans l'ordre
 *   du DOM. `data-enter="scale"` réserve un fondu + léger zoom (visuel fort,
 *   comme la bouteille du hero).
 * - `[data-reveal]` : apparition au scroll, groupée par vagues pour que les
 *   voisins d'une même grille se révèlent en cascade. Seuls les éléments qui
 *   démarrent sous la ligne de flottaison sont masqués, donc rien ne clignote
 *   au-dessus et le contenu reste lisible si JS ne s'exécute pas.
 *
 * Le démarrage attend la fin de l'hydratation : GSAP ne modifie jamais le HTML
 * rendu par le serveur avant que React ne l'ait repris (sinon React signale
 * une divergence d'hydratation sur les styles inline).
 *
 * Le contenu injecté après le montage (filtres, listes client) est pris en
 * charge par un MutationObserver. Si l'utilisateur préfère réduire les
 * animations, aucun style n'est appliqué : tout est visible immédiatement.
 */
export default function MotionEffects() {
  useEffect(() => {
    if (prefersReducedMotion()) return;

    const root = document.querySelector("main");
    if (!root) return;

    let active = true;
    let started = false;
    let mutations: MutationObserver | undefined;
    let refreshTimer = 0;
    let frameA = 0;
    let frameB = 0;
    const triggers: ScrollTrigger[] = [];
    const tracked = new WeakSet<Element>();
    const touched = new Set<Element>();

    const scheduleRefresh = () => {
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => {
        if (active) ScrollTrigger.refresh();
      }, 120);
    };

    const batchReveal = (elements: HTMLElement[]) => {
      if (elements.length === 0) return;
      triggers.push(
        ...ScrollTrigger.batch(elements, {
          start: "top bottom-=40",
          once: true,
          onEnter: (batch) => {
            if (batch.length === 0) return;
            gsap.to(batch, {
              autoAlpha: 1,
              y: 0,
              duration: motion.duration.slow,
              ease: motion.ease,
              stagger: motion.revealStagger,
              overwrite: "auto",
              onComplete: () => {
                gsap.set(batch, { clearProps: "opacity,visibility,transform" });
                for (const element of batch) {
                  if (element instanceof HTMLElement) element.style.removeProperty("transition");
                }
              },
            });
          },
        }),
      );
    };

    const prepare = (element: Element) => {
      if (!(element instanceof HTMLElement) || tracked.has(element)) return;
      tracked.add(element);

      // Déjà à l'écran (ou au-dessus) : on ne touche à rien. La révélation
      // ne concerne que ce qui arrive par le bas du viewport.
      if (element.getBoundingClientRect().top < window.innerHeight) return;

      touched.add(element);
      // Les cartes portent une transition CSS sur `transform` pour leur
      // survol : elle s'interposerait entre chaque frame GSAP et donnerait
      // une impression de lévitation. On la neutralise pendant la révélation.
      element.style.transition = "none";
      gsap.set(element, { autoAlpha: 0, y: motion.revealDistance });
    };

    const start = () => {
      if (!active || started) return;
      started = true;

      gsap.registerPlugin(ScrollTrigger);

      // ── Entrées de page ─────────────────────────────────────────────────
      const enters = Array.from(root.querySelectorAll<HTMLElement>(ENTER_SELECTOR));
      if (enters.length > 0) {
        const timeline = gsap.timeline({ defaults: { ease: motion.ease } });
        enters.forEach((element, index) => {
          const isBottle = element.dataset.enter === "scale";
          touched.add(element);
          timeline.fromTo(
            element,
            isBottle
              ? { autoAlpha: 0, scale: 0.94 }
              : { autoAlpha: 0, y: motion.enterDistance },
            {
              autoAlpha: 1,
              scale: 1,
              y: 0,
              duration: isBottle ? motion.duration.bottle : motion.duration.base,
              onComplete: () => {
                element.removeAttribute("data-enter");
                gsap.set(element, { clearProps: "opacity,visibility,transform" });
              },
            },
            index * motion.stagger,
          );
        });
      }

      // ── Révélations au scroll ───────────────────────────────────────────
      const initial = Array.from(root.querySelectorAll<HTMLElement>(REVEAL_SELECTOR));
      initial.forEach(prepare);
      batchReveal(initial.filter((element) => touched.has(element)));

      // ── Contenu ajouté après le montage ─────────────────────────────────
      mutations = new MutationObserver((records) => {
        const added: HTMLElement[] = [];
        for (const record of records) {
          for (const node of record.addedNodes) {
            if (!(node instanceof Element)) continue;
            const candidates = [
              ...(node.matches(REVEAL_SELECTOR) ? [node] : []),
              ...node.querySelectorAll<HTMLElement>(REVEAL_SELECTOR),
            ];
            for (const candidate of candidates) {
              if (!(candidate instanceof HTMLElement) || tracked.has(candidate)) continue;
              prepare(candidate);
              if (touched.has(candidate)) added.push(candidate);
            }
          }
        }
        if (added.length > 0) {
          batchReveal(added);
          scheduleRefresh();
        }
      });
      mutations.observe(root, { childList: true, subtree: true });

      document.fonts?.ready
        .then(() => {
          if (active) scheduleRefresh();
        })
        .catch(() => {});
    };

    // Deux frames après le chargement, puis au premier moment d'inactivité :
    // React a alors terminé d'hydrater la page et ses frontières Suspense.
    const kickoff = () => {
      frameA = window.requestAnimationFrame(() => {
        frameB = window.requestAnimationFrame(() => {
          if (!active) return;
          if (typeof window.requestIdleCallback === "function") {
            window.requestIdleCallback(start, { timeout: 250 });
          } else {
            window.setTimeout(start, 60);
          }
        });
      });
    };

    if (document.readyState === "complete") {
      kickoff();
    } else {
      window.addEventListener("load", kickoff, { once: true });
    }

    return () => {
      active = false;
      window.removeEventListener("load", kickoff);
      window.cancelAnimationFrame(frameA);
      window.cancelAnimationFrame(frameB);
      mutations?.disconnect();
      window.clearTimeout(refreshTimer);
      triggers.forEach((trigger) => trigger.kill());

      const connected = [...touched].filter(
        (element): element is HTMLElement => element instanceof HTMLElement && element.isConnected,
      );
      if (connected.length > 0) {
        gsap.killTweensOf(connected);
        gsap.set(connected, { clearProps: "opacity,visibility,transform" });
        for (const element of connected) element.style.removeProperty("transition");
      }
    };
  }, []);

  return null;
}
