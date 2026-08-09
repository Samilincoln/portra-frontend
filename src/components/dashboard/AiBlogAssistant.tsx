import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Sparkles, Wand2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { draftBlogPost } from "@/lib/ai.functions";

type Props = {
  title: string;
  content: string;
  onApply: (draft: { title: string; content: string }) => void;
};

export function AiBlogAssistant({ title, content, onApply }: Props) {
  const [open, setOpen] = useState(false);
  const [context, setContext] = useState("");
  const [tone, setTone] = useState("");
  const run = useServerFn(draftBlogPost);

  const mutation = useMutation({
    mutationFn: (mode: "draft" | "redraft") =>
      run({
        data: {
          mode,
          context,
          title: title || undefined,
          existingContent: content || undefined,
          tone: tone || undefined,
        },
      }),
    onSuccess: (draft) => {
      onApply({ title: draft.title, content: draft.content });
      toast.success("Draft ready — review and edit before publishing");
      setOpen(false);
    },
    onError: (err: { message?: string }) =>
      toast.error(err?.message ?? "The assistant couldn't finish that draft"),
  });

  const canRun = context.trim().length > 2 && !mutation.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-1.5">
          <Sparkles className="h-4 w-4" /> AI assistant
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" /> AI writing assistant
          </DialogTitle>
          <DialogDescription>
            Describe what the post should cover. The assistant can write a fresh
            draft or rewrite what's already in the editor.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Context / instructions</Label>
            <Textarea
              rows={6}
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="e.g. A walkthrough of how I cut RAG latency 4x with hybrid search and a Redis cache. Audience: senior backend engineers. Include benchmarks and gotchas."
            />
          </div>
          <div className="space-y-1.5">
            <Label>Tone (optional)</Label>
            <Input
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              placeholder="practical, technical, lightly opinionated"
            />
          </div>
          {content.trim() ? (
            <p className="text-xs text-muted-foreground">
              Redrafting will replace the current editor content.
            </p>
          ) : null}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            className="gap-1.5"
            disabled={!canRun || !content.trim()}
            onClick={() => mutation.mutate("redraft")}
          >
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="h-4 w-4" />
            )}
            Redraft current
          </Button>
          <Button
            className="gap-1.5"
            disabled={!canRun}
            onClick={() => mutation.mutate("draft")}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Writing…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Write new draft
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
