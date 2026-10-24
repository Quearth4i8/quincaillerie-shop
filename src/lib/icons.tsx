import {
  Bolt, Cable, Construction, Drill, Droplets, Hammer, HardHat, Leaf, Lightbulb,
  Package, PaintRoller, Plug, Shovel, ShowerHead, Wrench, type LucideIcon,
} from "lucide-react";

/** Icons a category can use (stored by key in categories.icon) */
export const CATEGORY_ICONS: Record<string, { icon: LucideIcon; label: string }> = {
  drill: { icon: Drill, label: "Perceuse" },
  wrench: { icon: Wrench, label: "Clé" },
  hammer: { icon: Hammer, label: "Marteau" },
  faucet: { icon: ShowerHead, label: "Plomberie" },
  droplets: { icon: Droplets, label: "Eau" },
  bulb: { icon: Lightbulb, label: "Ampoule" },
  plug: { icon: Plug, label: "Prise" },
  cable: { icon: Cable, label: "Câble" },
  roller: { icon: PaintRoller, label: "Peinture" },
  screw: { icon: Bolt, label: "Visserie" },
  leaf: { icon: Leaf, label: "Jardin" },
  shovel: { icon: Shovel, label: "Pelle" },
  helmet: { icon: HardHat, label: "Sécurité" },
  construction: { icon: Construction, label: "Chantier" },
  package: { icon: Package, label: "Divers" },
};

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = CATEGORY_ICONS[name]?.icon ?? Package;
  return <Icon className={className} aria-hidden="true" strokeWidth={1.7} />;
}
