import { useState } from "react";
import { Sparkles, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Props = {
  /** Called with the user's optional instructions when Generate is clicked. */
  onGenerate: (prompt: string) => void | Promise<void>;
  isGenerating?: boolean;
  label?: string;
  placeholder?: string;
  /** Start expanded instead of behind a toggle button. */
  defaultOpen?: boolean;
  className?: string;
};

/**
 * A small "AI draft" affordance: a toggleable prompt box with a Generate
 * button. Used to let the user steer AI drafting (project summaries, blog
 * posts, experience descriptions) with optional freeform instructions.
 */
export function AIDraftBox({
  onGenerate,
  isGenerating = false,
  label = "Draft with AI",
  placeholder = "Optional: give the AI some direction, e.g. tone, key points to hit, audience…",
  defaultOpen = false,
  className,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const [prompt, setPrompt] = useState("");

  return (
    <div className={cn("rounded-xl border border-dashed border-accent/40 bg-accent/5", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-accent">
          <Sparkles className="h-4 w-4" />
          {label}
        </span>
        <ChevronDown
          className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>
      {open && (
        <div className="space-y-3 border-t border-accent/20 px-4 py-3">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={placeholder}
            rows={2}
            className="bg-background text-sm"
          />
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              Review anything the AI drafts before saving.
            </p>
            <Button
              type="button"
              size="sm"
              onClick={() => onGenerate(prompt.trim())}
              disabled={isGenerating}
              className="gap-1.5"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Generate
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
