import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type PaletteId = "midnight" | "paper" | "graphite";
export type ColorMode = "light" | "dark";

export const PALETTES: Array<{
  id: PaletteId;
  label: string;
  description: string;
  colors: string[];
}> = [
  {
    id: "midnight",
    label: "Midnight",
    description: "Deep navy with electric blue accents.",
    colors: ["#1B2A4A", "#3D5AFE", "#F8FAFC"],
  },
  {
    id: "paper",
    label: "Paper",
    description: "Clean, editorial white on ink.",
    colors: ["#F8F7F4", "#1A1A1A", "#B45309"],
  },
  {
    id: "graphite",
    label: "Graphite",
    description: "Dark, monospaced-friendly for engineers.",
    colors: ["#0F1115", "#22C55E", "#F1F5F9"],
  },
];

type ThemeContextValue = {
  palette: PaletteId;
  mode: ColorMode;
  setPalette: (p: PaletteId) => void;
  setMode: (m: ColorMode) => void;
  toggleMode: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const PALETTE_KEY = "portra:palette";
const MODE_KEY = "portra:mode";

function isPalette(v: string | null): v is PaletteId {
  return v === "midnight" || v === "paper" || v === "graphite";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [palette, setPaletteState] = useState<PaletteId>("midnight");
  const [mode, setModeState] = useState<ColorMode>("light");

  // Hydrate from storage / system preference after mount (SSR safe).
  useEffect(() => {
    const storedPalette = window.localStorage.getItem(PALETTE_KEY);
    if (isPalette(storedPalette)) setPaletteState(storedPalette);
    const storedMode = window.localStorage.getItem(MODE_KEY);
    if (storedMode === "light" || storedMode === "dark") {
      setModeState(storedMode);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setModeState("dark");
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = palette;
    root.classList.toggle("dark", mode === "dark");
    root.style.colorScheme = mode;
  }, [palette, mode]);

  const setPalette = useCallback((p: PaletteId) => {
    setPaletteState(p);
    window.localStorage.setItem(PALETTE_KEY, p);
  }, []);

  const setMode = useCallback((m: ColorMode) => {
    setModeState(m);
    window.localStorage.setItem(MODE_KEY, m);
  }, []);

  const value = useMemo(
    () => ({
      palette,
      mode,
      setPalette,
      setMode,
      toggleMode: () => setMode(mode === "dark" ? "light" : "dark"),
    }),
    [palette, mode, setPalette, setMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
