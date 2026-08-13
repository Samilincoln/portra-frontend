import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Sparkles, Wand2, FileText, Linkedin, Twitter, Copy, Check, FolderKanban } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
import { useAuth } from "@/lib/auth";
import type { Project } from "@/lib/projects";

type Props = {
  title: string;
  content: string;
  projectId?: string;
  projects?: Project[];
  onApply: (draft: { title: string; content: string }) => void;
};

export function AiBlogAssistant({ title, content, projectId, projects, onApply }: Props) {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [context, setContext] = useState("");
  const [tone, setTone] = useState("");
  const [platform, setPlatform] = useState<"blog" | "linkedin" | "twitter">("blog");
  const [copied, setCopied] = useState(false);
  const run = useServerFn(draftBlogPost);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [content]);

  const mutation = useMutation({
    mutationFn: (mode: "draft" | "redraft") =>
      run({
        data: {
          mode,
          projectId: projectId || undefined,
          context,
          title: title || undefined,
          existingContent: content || undefined,
          tone: tone || undefined,
          platform,
          token,
        },
      }),
    onSuccess: (draft) => {
      onApply({ title: draft.title, content: draft.content });
      toast.success("Draft ready — review and edit before publishing");
      if (platform === "blog") setOpen(false);
    },
    onError: (err: { message?: string }) =>
      toast.error(err?.message ?? "The assistant couldn't finish that draft"),
  });

  const canRun = context.trim().length > 2 && !mutation.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-1.5 border-amber-400/40 bg-amber-400/10 text-amber-600 hover:bg-amber-400/20 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300">
          <Sparkles className="h-4 w-4" /> AI assistant
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" /> AI writing assistant
          </DialogTitle>
          <DialogDescription>
            {platform === "blog"
              ? "Describe what the post should cover. The assistant can write a fresh draft or rewrite what's already in the editor."
              : platform === "linkedin"
                ? "Describe your post topic. The assistant will write a LinkedIn-optimized post (hook-first, 1300 char max)."
                : "Describe your thread topic. The assistant will write a Twitter/X thread (5-8 tweets)."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Platform</Label>
            <ToggleGroup
              type="single"
              value={platform}
              onValueChange={(v) => { if (v) setPlatform(v as typeof platform); }}
              className="justify-start"
            >
              <ToggleGroupItem value="blog">
                <FileText className="h-4 w-4 mr-1.5" /> Blog
              </ToggleGroupItem>
              <ToggleGroupItem value="linkedin">
                <Linkedin className="h-4 w-4 mr-1.5" /> LinkedIn
              </ToggleGroupItem>
              <ToggleGroupItem value="twitter">
                <Twitter className="h-4 w-4 mr-1.5" /> Twitter
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm">
            <FolderKanban className="h-4 w-4 shrink-0 text-muted-foreground" />
            {projectId && projects ? (
              <span className="text-foreground">
                Project — {projects.find((p) => p.id === projectId)?.title ?? "Unknown"}
              </span>
            ) : (
              <span className="text-muted-foreground">No project selected</span>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Context / instructions</Label>
            <Textarea
              rows={6}
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder={
                platform === "blog"
                  ? "e.g. A walkthrough of how I cut RAG latency 4x with hybrid search and a Redis cache. Audience: senior backend engineers. Include benchmarks and gotchas."
                  : platform === "linkedin"
                    ? "e.g. Key lessons from scaling our API to 10M requests/day..."
                    : "e.g. Thread on why I switched from PostgreSQL to SQLite..."
              }
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
          {platform === "blog" && content.trim() ? (
            <p className="text-xs text-muted-foreground">
              Redrafting will replace the current editor content.
            </p>
          ) : null}
        </div>

        <DialogFooter className="gap-2">
          {platform === "blog" && (
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
          )}
          {platform !== "blog" && mutation.data && (
            <Button
              variant="outline"
              className="gap-1.5"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? "Copied!" : "Copy to clipboard"}
            </Button>
          )}
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
