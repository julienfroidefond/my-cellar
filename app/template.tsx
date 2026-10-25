import MotionEffects from "@/components/MotionEffects";

/**
 * `template.tsx` remonte à chaque navigation (contrairement à `layout.tsx`).
 * C'est l'endroit idéal pour relancer les animations d'entrée sans écouter
 * `usePathname` : le composant est hydraté avec la page, donc GSAP ne touche
 * jamais au HTML rendu par le serveur avant qu'il ne soit repris par React.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <MotionEffects />
    </>
  );
}
