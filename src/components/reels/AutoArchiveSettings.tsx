import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Settings, Archive, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AutoArchiveSettingsProps {
  onArchiveComplete?: () => void;
}

export function AutoArchiveSettings({ onArchiveComplete }: AutoArchiveSettingsProps) {
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [daysOld, setDaysOld] = useState(90);
  const [minViews, setMinViews] = useState(10);
  const [minLikes, setMinLikes] = useState(5);
  const [dryRun, setDryRun] = useState(true);
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();

  const handleRunAutoArchive = async () => {
    setRunning(true);
    setResults(null);

    try {
      const { data, error } = await supabase.functions.invoke('auto-archive-reels', {
        body: {
          days_old: daysOld,
          min_views_threshold: minViews,
          min_likes_threshold: minLikes,
          dry_run: dryRun,
        },
      });

      if (error) throw error;

      setResults(data);

      if (dryRun) {
        toast({
          title: "Preview Complete",
          description: `Found ${data.reels_to_archive || 0} reels that would be archived.`,
        });
      } else {
        toast({
          title: "Auto-Archive Complete",
          description: `Successfully archived ${data.archived_count || 0} reels.`,
        });
        onArchiveComplete?.();
      }
    } catch (error: any) {
      console.error('Auto-archive error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to run auto-archive",
        variant: "destructive",
      });
    } finally {
      setRunning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          Auto-Archive
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Auto-Archive Settings
          </DialogTitle>
          <DialogDescription>
            Configure rules to automatically archive old or low-performing reels.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Archive Rules</CardTitle>
              <CardDescription className="text-xs">
                Reels will be archived if they are very old (180+ days) OR if they meet both age and engagement criteria.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="days-old">Days Old Threshold</Label>
                <Input
                  id="days-old"
                  type="number"
                  min={30}
                  max={365}
                  value={daysOld}
                  onChange={(e) => setDaysOld(Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Archive reels older than this if they have low engagement
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min-views">Min Views</Label>
                  <Input
                    id="min-views"
                    type="number"
                    min={0}
                    value={minViews}
                    onChange={(e) => setMinViews(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min-likes">Min Likes</Label>
                  <Input
                    id="min-likes"
                    type="number"
                    min={0}
                    value={minLikes}
                    onChange={(e) => setMinLikes(Number(e.target.value))}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Reels with less than both thresholds will be archived
              </p>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div>
              <Label htmlFor="dry-run" className="font-medium">Preview Mode</Label>
              <p className="text-xs text-muted-foreground">
                Preview which reels would be archived without making changes
              </p>
            </div>
            <Switch
              id="dry-run"
              checked={dryRun}
              onCheckedChange={setDryRun}
            />
          </div>

          {results && (
            <Card className="border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  {results.dry_run ? 'Preview Results' : 'Archive Results'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">
                  {results.reels_to_archive ?? results.archived_count ?? 0}
                </p>
                <p className="text-sm text-muted-foreground">
                  {results.dry_run ? 'reels would be archived' : 'reels archived'}
                </p>
                {results.reels && results.reels.length > 0 && (
                  <div className="mt-3 max-h-32 overflow-y-auto space-y-1">
                    {results.reels.slice(0, 5).map((reel: any) => (
                      <div key={reel.id} className="text-xs p-2 bg-muted rounded">
                        <span className="font-medium">{reel.caption || 'Untitled'}</span>
                        <span className="text-muted-foreground ml-2">
                          {reel.views} views, {reel.likes} likes
                        </span>
                      </div>
                    ))}
                    {results.reels.length > 5 && (
                      <p className="text-xs text-muted-foreground">
                        +{results.reels.length - 5} more reels
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Button
            onClick={handleRunAutoArchive}
            disabled={running}
            className="w-full gap-2"
            variant={dryRun ? "outline" : "default"}
          >
            {running ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {dryRun ? 'Previewing...' : 'Archiving...'}
              </>
            ) : (
              <>
                <Archive className="h-4 w-4" />
                {dryRun ? 'Preview Archive' : 'Run Auto-Archive'}
              </>
            )}
          </Button>

          {!dryRun && (
            <p className="text-xs text-center text-destructive">
              Warning: This will permanently archive the matching reels.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
