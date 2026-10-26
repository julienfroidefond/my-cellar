"use client";

import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { motion, prefersReducedMotion } from "@/lib/motion";

const ENTER_SELECTOR = "[data-enter]";
const REVEAL_SELECTOR = "[data-reveal], [data-reveal-stagger] > *";
const GROW_SELECTOR = "[data-grow]";
const COUNT_SELECTOR = "[data-count]";
const FLOAT_SELECTOR = "[data-float]";

/** Coupe diagonale de la marque : départ replié au bord droit, arrivée pleine. */
const WIPE_FROM = "polygon(130% 0%, 130% 0%, 100% 100%, 100% 100%)";
const WIPE_TO = "polygon(0% 0%, 130% 0%, 100% 100%, -30% 100%)";

/**
 * Orchestre toutes les animations du site avec GSAP.
 *
 * - `[data-enter]` : entrée au montage de la page, en cascade dans l'ordre
 *   du DOM. Variantes :
 *   - `title` : titre révélé ligne par ligne derrière un masque (SplitText) ;
 *   - `scale` : bouteille qui monte et se pose avec une légère rotation ;
 *   - `wipe`  : pan coloré qui entre en balayage diagonal (motif de la marque).
 * - `[data-reveal]` : bloc de contenu qui apparaît en glissant. Ce qui est à
 *   l'écran au chargement entre en cascade juste après l'en-tête, le reste au
 *   fil du défilement, par vagues.
 * - `[data-reveal-stagger]` : conteneur dont chaque enfant direct se révèle
 *   individuellement, en cascade (listes, grilles).
 * - `[data-float]` : à l'intérieur d'un bloc révélé (bouteilles des cartes),
 *   monte un peu après son bloc.
 * - `[data-grow="x" | "y"]` : barre de graphique qui pousse depuis sa base
 *   quand elle entre à l'écran.
 * - `[data-count]` : statistique numérique qui compte jusqu'à sa valeur.
 *
 * L'état initial (masqué) est posé par la CSS dès le rendu serveur, donc rien
 * ne clignote ; sans JS ou avec « réduire les animations », rien n'est masqué.
 * Un bloc déjà révélé est marqué `data-revealed` et n'est plus jamais masqué. Le démarrage attend la fin de l'hydratation : GSAP
 * ne modifie jamais le HTML rendu par le serveur avant que React ne l'ait
 * repris. Le contenu injecté ou re-rendu après coup (filtres, server actions)
 * est pris en charge par un MutationObserver. Si l'utilisateur préfère
 * réduire les animations, rien n'est appliqué : tout est visible tout de suite.
 */
export default function MotionEffects({ children }: { children: ReactNode }) {
  const scopeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;

    // Chaque page a sa propre instance (voir app/template.tsx) et n'anime que
    // son propre contenu : en navigation côté client, l'instance de la page
    // quittée vit encore un instant et ne doit pas toucher à la nouvelle page.
    const root = scopeRef.current;
    if (!root) return;

    let active = true;
    let started = false;
    let mutations: MutationObserver | undefined;
    let refreshTimer = 0;
    let frameA = 0;
    let frameB = 0;
    const triggers: ScrollTrigger[] = [];
    const splits: SplitText[] = [];
    const timelines: gsap.core.Timeline[] = [];
    const tracked = new WeakSet<Element>();
    const touched = new Set<Element>();
    const counters = new Map<Text, string>();

    const scheduleRefresh = () => {
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => {
        if (active) ScrollTrigger.refresh();
      }, 120);
    };

    const isBelowFold = (element: Element) =>
      element.getBoundingClientRect().top >= window.innerHeight;

    // ── Entrées de page ─────────────────────────────────────────────────────

    const enterTween = (element: HTMLElement, timeline: gsap.core.Timeline, position: number) => {
      touched.add(element);
      const done = () => {
        element.removeAttribute("data-enter");
        gsap.set(element, { clearProps: "opacity,visibility,transform,clipPath" });
      };

      switch (element.dataset.enter) {
        case "wipe":
          timeline.fromTo(
            element,
            { autoAlpha: 1, clipPath: WIPE_FROM },
            { clipPath: WIPE_TO, duration: motion.duration.wipe, ease: "expo.inOut", onComplete: done },
            position,
          );
          return;

        case "scale":
          timeline.fromTo(
            element,
            { autoAlpha: 0, y: 48, rotate: -6, scale: 0.94 },
            {
              autoAlpha: 1,
              y: 0,
              rotate: 0,
              scale: 1,
              duration: motion.duration.bottle,
              ease: motion.easeSettle,
              onComplete: done,
            },
            position + 0.25,
          );
          return;

        case "title": {
          const split = SplitText.create(element, { type: "lines", mask: "lines" });
          splits.push(split);
          gsap.set(element, { autoAlpha: 1 });
          timeline.fromTo(
            split.lines,
            { yPercent: 105 },
            {
              yPercent: 0,
              duration: motion.duration.slow,
              stagger: 0.08,
              onComplete: () => {
                split.revert();
                done();
              },
            },
            position,
          );
          return;
        }

        default:
          timeline.fromTo(
            element,
            { autoAlpha: 0, y: motion.enterDistance },
            { autoAlpha: 1, y: 0, duration: motion.duration.base, onComplete: done },
            position,
          );
      }
    };

    const playEnter = (enters: HTMLElement[]) => {
      if (enters.length === 0) return;
      const timeline = gsap.timeline({ defaults: { ease: motion.ease } });
      timelines.push(timeline);
      enters.forEach((element, index) => enterTween(element, timeline, index * motion.stagger));
    };

    // ── Révélations du contenu ──────────────────────────────────────────────

    // Anime l'apparition d'éléments puis les marque `data-revealed` : la CSS
    // cesse alors de les masquer, même si React re-rend la page ensuite.
    const revealTo = (elements: HTMLElement[], options: { delay?: number; stagger: number }) => {
      if (elements.length === 0) return;
      gsap.fromTo(
        elements,
        { autoAlpha: 0, y: motion.revealDistance },
        {
          autoAlpha: 1,
          y: 0,
          duration: motion.duration.slow,
          ease: motion.ease,
          delay: options.delay ?? 0,
          stagger: options.stagger,
          overwrite: "auto",
          onComplete: () => {
            for (const element of elements) {
              element.setAttribute("data-revealed", "");
              element.style.removeProperty("transition");
            }
            gsap.set(elements, { clearProps: "opacity,visibility,transform" });
          },
        },
      );
      const floats = elements.flatMap((element) => [...element.querySelectorAll<HTMLElement>(FLOAT_SELECTOR)]);
      if (floats.length > 0) {
        gsap.to(floats, {
          y: 0,
          autoAlpha: 1,
          duration: motion.duration.slow,
          ease: motion.ease,
          delay: (options.delay ?? 0) + 0.15,
          stagger: Math.min(0.04, options.stagger),
          clearProps: "opacity,visibility,transform",
        });
      }
    };

    /**
     * Révèle le contenu : ce qui est déjà à l'écran entre en cascade (juste
     * après l'en-tête au chargement), le reste au fil du défilement.
     */
    const reveal = (candidates: HTMLElement[], delay = 0) => {
      const fresh = [...new Set(candidates)].filter(
        (element) => !element.hasAttribute("data-revealed") && !tracked.has(element),
      );
      if (fresh.length === 0) return;
      for (const element of fresh) {
        tracked.add(element);
        touched.add(element);
        // Les cartes portent une transition CSS sur `transform` pour leur
        // survol : elle s'interposerait entre chaque frame GSAP et donnerait
        // une impression de lévitation. On la neutralise pendant la révélation.
        element.style.transition = "none";
        const floats = element.querySelectorAll(FLOAT_SELECTOR);
        if (floats.length > 0) gsap.set(floats, { y: 14, autoAlpha: 0 });
      }

      const now = fresh.filter((element) => !isBelowFold(element));
      // Cascade plafonnée : une longue liste à l'écran n'attend pas des secondes.
      revealTo(now, { delay, stagger: Math.min(motion.revealStagger, 0.5 / Math.max(1, now.length)) });

      const later = fresh.filter(isBelowFold);
      if (later.length === 0) return;
      gsap.set(later, { autoAlpha: 0, y: motion.revealDistance });
      triggers.push(
        ...ScrollTrigger.batch(later, {
          start: "top bottom-=40",
          once: true,
          onEnter: (batch) => revealTo(batch as HTMLElement[], { stagger: motion.revealStagger }),
        }),
      );
      scheduleRefresh();
    };

    // ── Barres de graphiques ────────────────────────────────────────────────

    const growTween = (elements: HTMLElement[], delay = 0) => {
      if (elements.length === 0) return;
      const vertical = (element: HTMLElement) => element.dataset.grow === "y";
      gsap.fromTo(
        elements,
        {
          scaleX: (_: number, element: HTMLElement) => (vertical(element) ? 1 : 0),
          scaleY: (_: number, element: HTMLElement) => (vertical(element) ? 0 : 1),
        },
        {
          scaleX: 1,
          scaleY: 1,
          duration: motion.duration.grow,
          ease: motion.ease,
          delay,
          stagger: 0.035,
          overwrite: "auto",
          onComplete: () => {
            for (const element of elements) element.removeAttribute("data-grow");
            gsap.set(elements, { clearProps: "transform" });
          },
        },
      );
    };

    const playGrow = (elements: HTMLElement[]) => {
      const fresh = elements.filter((element) => !gsap.isTweening(element));
      fresh.forEach((element) => touched.add(element));
      // Les barres déjà à l'écran poussent pendant que leur carte apparaît.
      growTween(fresh.filter((element) => !isBelowFold(element)), 0.35);
      const later = fresh.filter(isBelowFold);
      if (later.length > 0) {
        triggers.push(
          ...ScrollTrigger.batch(later, {
            start: "top bottom-=40",
            once: true,
            onEnter: (batch) => growTween(batch as HTMLElement[]),
          }),
        );
      }
    };

    // ── Compteurs ───────────────────────────────────────────────────────────

    const countTween = (element: HTMLElement) => {
      // On n'anime que le nœud texte existant (jamais le DOM géré par React),
      // et seulement un entier suivi d'un éventuel suffixe (« 1 644 € », « 59 % »).
      const node = element.firstChild;
      if (!(node instanceof Text) || element.childNodes.length !== 1 || counters.has(node)) return;
      const original = node.nodeValue ?? "";
      const match = original.trim().match(/^(\d[\d\s  ]*)(.*)$/);
      if (!match || /^[.,]\d/.test(match[2])) return;
      const target = Number(match[1].replace(/\D/g, ""));
      // Rien à compter, ou une année (« 2010 ») qui n'a pas de sens depuis 0.
      if (target < 3 || (target >= 1900 && target <= 2100 && match[2].trim() === "")) return;

      const grouped = /\d[\s  ]\d/.test(match[1]);
      const suffix = match[1].match(/[\s  ]*$/)?.[0] + match[2];
      const format = (value: number) =>
        (grouped ? Math.round(value).toLocaleString("fr-FR") : String(Math.round(value))) + suffix;

      counters.set(node, original);
      const state = { value: 0 };
      node.nodeValue = format(0);
      gsap.to(state, {
        value: target,
        duration: motion.duration.count,
        ease: "power3.out",
        onUpdate: () => {
          node.nodeValue = format(state.value);
        },
        onComplete: () => {
          node.nodeValue = original;
          counters.delete(node);
        },
      });
    };

    const playCount = (elements: HTMLElement[]) => {
      for (const element of elements) {
        if (!isBelowFold(element)) {
          countTween(element);
        } else {
          triggers.push(
            ScrollTrigger.create({
              trigger: element,
              start: "top bottom-=40",
              once: true,
              onEnter: () => countTween(element),
            }),
          );
        }
      }
    };

    // ── Démarrage ───────────────────────────────────────────────────────────

    const collect = (node: Element, selector: string) => [
      ...(node.matches(selector) && node instanceof HTMLElement ? [node] : []),
      ...node.querySelectorAll<HTMLElement>(selector),
    ];

    const start = () => {
      if (!active || started) return;
      started = true;

      gsap.registerPlugin(ScrollTrigger, SplitText);

      playEnter(Array.from(root.querySelectorAll<HTMLElement>(ENTER_SELECTOR)));
      playGrow(Array.from(root.querySelectorAll<HTMLElement>(GROW_SELECTOR)));
      playCount(Array.from(root.querySelectorAll<HTMLElement>(COUNT_SELECTOR)));

      // Le contenu suit l'en-tête de près, sans attendre la fin de sa cascade.
      reveal(Array.from(root.querySelectorAll<HTMLElement>(REVEAL_SELECTOR)), 0.25);

      // Contenu ajouté ou re-rendu après le montage. Une server action qui
      // redirige vers la même route (ex. erreur de connexion → /login?error=1)
      // re-rend la page sans remonter ce composant : React remet alors
      // `data-enter` / `data-grow` sur des éléments que la CSS masque. On
      // rejoue leur animation pour qu'ils ne restent pas invisibles.
      mutations = new MutationObserver((records) => {
        const revealing: HTMLElement[] = [];
        const entering = new Set<HTMLElement>();
        const growing = new Set<HTMLElement>();
        for (const record of records) {
          if (record.type === "attributes") {
            const target = record.target;
            if (!(target instanceof HTMLElement)) continue;
            if (target.hasAttribute("data-enter")) entering.add(target);
            if (target.hasAttribute("data-grow")) growing.add(target);
            continue;
          }
          for (const node of record.addedNodes) {
            if (!(node instanceof Element)) continue;
            collect(node, ENTER_SELECTOR).forEach((element) => entering.add(element));
            collect(node, GROW_SELECTOR).forEach((element) => growing.add(element));
            revealing.push(...collect(node, REVEAL_SELECTOR));
          }
        }
        playEnter([...entering].filter((element) => !gsap.isTweening(element)));
        playGrow([...growing]);
        reveal(revealing);
      });
      mutations.observe(root, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["data-enter", "data-grow"],
      });

      scheduleRefresh();
    };

    // Deux frames après le chargement, puis au premier moment d'inactivité :
    // React a alors terminé d'hydrater la page et ses frontières Suspense. On
    // attend aussi les polices (brièvement) pour que SplitText mesure les
    // lignes dans la bonne fonte.
    const kickoff = () => {
      frameA = window.requestAnimationFrame(() => {
        frameB = window.requestAnimationFrame(() => {
          if (!active) return;
          const fonts = document.fonts?.ready ?? Promise.resolve();
          Promise.race([fonts, new Promise((resolve) => window.setTimeout(resolve, 400))]).then(() => {
            if (!active) return;
            if (typeof window.requestIdleCallback === "function") {
              window.requestIdleCallback(start, { timeout: 200 });
            } else {
              window.setTimeout(start, 50);
            }
          });
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
      timelines.forEach((timeline) => timeline.kill());
      splits.forEach((split) => split.revert());
      for (const [node, original] of counters) node.nodeValue = original;

      // En navigation côté client, la nouvelle page est insérée avant que ce
      // composant (celui de l'ancienne page) ne soit démonté : l'observateur a
      // donc pu commencer à animer des éléments de la nouvelle page. On coupe
      // ces animations et on les remet dans leur état CSS de départ, mais on
      // garde `data-enter` / `data-grow` : l'instance de la nouvelle page les
      // jouera à son tour.
      const connected = [...touched].filter(
        (element): element is HTMLElement => element instanceof HTMLElement && element.isConnected,
      );
      if (connected.length > 0) {
        gsap.killTweensOf(connected);
        const floats = connected.flatMap((element) => [...element.querySelectorAll(FLOAT_SELECTOR)]);
        if (floats.length > 0) {
          gsap.killTweensOf(floats);
          gsap.set(floats, { clearProps: "opacity,visibility,transform" });
        }
        gsap.set(connected, { clearProps: "opacity,visibility,transform,clipPath" });
        for (const element of connected) element.style.removeProperty("transition");
      }
    };
  }, []);

  return (
    <div ref={scopeRef} className="contents">
      {children}
    </div>
  );
}
