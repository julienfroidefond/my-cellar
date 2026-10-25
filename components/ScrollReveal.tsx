"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const REVEAL_SELECTOR = "[data-reveal]";

/**
 * Reveals elements marked with `data-reveal` as they enter the viewport.
 *
 * The hidden state is only added to elements that are already below the fold,
 * so content above the fold stays instantly readable and no-JS users always
 * get the full page. Elements added later (filters, client-side lists) are
 * picked up by a MutationObserver.
 *
 * The scroll fallback matters for fast scrolls and scrollbar jumps: an element
 * can travel from below the fold to above it between two observer frames.
 * Those elements are shown immediately so scrolling back up never reveals
 * blank sections.
 */
export default function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.querySelector("main");
    if (!root || typeof IntersectionObserver === "undefined") return;

    const tracked = new WeakSet<Element>();
    const revealed = new WeakSet<Element>();
    const pending = new Set<HTMLElement>();
    const timers = new Set<number>();

    function reveal(element: HTMLElement) {
      if (revealed.has(element)) return;

      revealed.add(element);
      pending.delete(element);
      observer.unobserve(element);
      element.classList.add("is-revealed");

      // Elements that were already in view when registered do not transition;
      // they just need to be visible. No listener or timer is required.
      if (!element.classList.contains("reveal-ready")) return;

      let timer = 0;

      function cleanup() {
        element.classList.remove("reveal-ready", "is-revealed");
        element.removeEventListener("transitionend", onTransitionEnd);
        window.clearTimeout(timer);
        timers.delete(timer);
      }

      const onTransitionEnd = (event: TransitionEvent) => {
        if (event.target !== element) return;
        if (event.propertyName !== "opacity" && event.propertyName !== "transform") return;
        cleanup();
      };

      element.addEventListener("transitionend", onTransitionEnd);
      timer = window.setTimeout(cleanup, 2200);
      timers.add(timer);
    }

    /** Shows an element that the user has already scrolled past. */
    function skip(element: HTMLElement) {
      if (revealed.has(element)) return;
      revealed.add(element);
      pending.delete(element);
      observer.unobserve(element);
      element.classList.remove("reveal-ready");
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          reveal(entry.target as HTMLElement);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.06 },
    );

    const register = (element: Element) => {
      if (!(element instanceof HTMLElement)) return;
      if (!element.matches(REVEAL_SELECTOR) || tracked.has(element)) return;

      tracked.add(element);
      const rect = element.getBoundingClientRect();

      if (rect.top < window.innerHeight) {
        if (rect.bottom < 0) {
          revealed.add(element);
        } else {
          element.classList.add("is-revealed");
          revealed.add(element);
        }
        return;
      }

      element.classList.add("reveal-ready");
      pending.add(element);
      observer.observe(element);
    };

    root.querySelectorAll(REVEAL_SELECTOR).forEach(register);

    const mutations = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (!(node instanceof Element)) continue;
          if (node.matches(REVEAL_SELECTOR)) register(node);
          node.querySelectorAll(REVEAL_SELECTOR).forEach(register);
        }
      }
    });
    mutations.observe(root, { childList: true, subtree: true });

    // Safety net for fast scrolls and jumps. Only runs for elements that are
    // still hidden, so it stays cheap once the page has been discovered.
    let frame = 0;
    const checkPending = () => {
      frame = 0;
      for (const element of pending) {
        if (!element.isConnected) {
          pending.delete(element);
          observer.unobserve(element);
          continue;
        }

        const rect = element.getBoundingClientRect();
        if (rect.bottom < 0) {
          skip(element);
        } else if (rect.top < window.innerHeight) {
          reveal(element);
        }
      }
    };
    const scheduleCheck = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(checkPending);
    };

    window.addEventListener("scroll", scheduleCheck, { passive: true });
    window.addEventListener("resize", scheduleCheck, { passive: true });

    return () => {
      observer.disconnect();
      mutations.disconnect();
      window.removeEventListener("scroll", scheduleCheck);
      window.removeEventListener("resize", scheduleCheck);
      if (frame) window.cancelAnimationFrame(frame);
      for (const timer of timers) window.clearTimeout(timer);
    };
  }, [pathname]);

  return null;
}
