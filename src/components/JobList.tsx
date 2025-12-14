import { useState, useEffect } from 'react';
import { FileJob, FileStatus } from '@/types';
import { useFileQueueStore } from '@/store/useFileQueueStore';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { X, RefreshCw, FileText, Music, Video } from 'lucide-react';

export function JobList() {
  const jobs = useFileQueueStore((state) => state.jobs);

  if (jobs.length === 0) {
    return <div className="text-center text-muted-foreground mt-4">No files in queue</div>;
  }

  return (
    <div className="space-y-4 mt-6">
      {jobs.map((job) => (
        <JobItem key={job.id} job={job} />
      ))}
    </div>
  );
}

function JobItem({ job }: { job: FileJob }) {
  const removeJob = useFileQueueStore((state) => state.removeJob);
  const retryJob = useFileQueueStore((state) => state.retryJob);

  const statusColor = (status: FileStatus) => {
    switch (status) {
      case 'completed': return 'default'; // primary
      case 'error': return 'destructive';
      case 'processing': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="border rounded-lg p-4 flex gap-4 items-start bg-card text-card-foreground shadow-sm">
        <FilePreview job={job} />
        
        <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
                <div>
                    <h4 className="font-semibold truncate" title={job.name}>{job.name}</h4>
                    <p className="text-sm text-muted-foreground">{(job.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant={statusColor(job.status)} className="capitalize">
                        {job.status}
                    </Badge>
                    {job.status === 'error' && (
                        <button onClick={() => retryJob(job.id)} className="text-muted-foreground hover:text-primary">
                            <RefreshCw className="h-4 w-4" />
                        </button>
                    )}
                    <button onClick={() => removeJob(job.id)} className="text-muted-foreground hover:text-destructive">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>
            
            {(job.status === 'processing' || job.status === 'queued') && (
                <div className="mt-2">
                    <Progress value={job.progress} className="h-2" />
                </div>
            )}
            
            {job.error && (
                <p className="text-sm text-destructive mt-1">{job.error}</p>
            )}
        </div>
    </div>
  );
}

function FilePreview({ job }: { job: FileJob }) {
    const [textSnippet, setTextSnippet] = useState<string | null>(null);

    useEffect(() => {
        if (job.file && (job.type.startsWith('text/') || job.name.endsWith('.txt') || job.name.endsWith('.md'))) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result as string;
                setTextSnippet(text.slice(0, 100));
            };
            reader.readAsText(job.file.slice(0, 200)); 
        }
    }, [job.file, job.type, job.name]);

    if (!job.file && !job.previewUrl) {
         return (
             <div className="h-16 w-16 bg-muted rounded flex items-center justify-center shrink-0">
                 <FileText className="h-8 w-8 text-muted-foreground" />
             </div>
         )
    }

    const type = job.type;
    const url = job.previewUrl;

    if (type.startsWith('image/') && url) {
        return (
            <div className="h-16 w-16 bg-muted rounded overflow-hidden shrink-0 relative border">
                <img src={url} alt={job.name} className="h-full w-full object-cover" />
            </div>
        )
    }

    if (type.startsWith('video/') && url) {
         return (
            <div className="h-16 w-16 bg-muted rounded overflow-hidden shrink-0 relative border flex items-center justify-center">
                <Video className="h-8 w-8 text-muted-foreground" />
            </div>
        )
    }

    if (type.startsWith('audio/')) {
        return (
             <div className="h-16 w-16 bg-muted rounded shrink-0 flex items-center justify-center border">
                <Music className="h-8 w-8 text-muted-foreground" />
             </div>
        )
    }

    if (textSnippet) {
         return (
             <div className="h-16 w-16 bg-muted rounded shrink-0 p-1 text-[0.5rem] overflow-hidden border leading-tight bg-background text-foreground font-mono select-none">
                {textSnippet}
             </div>
         )
    }

    return (
        <div className="h-16 w-16 bg-muted rounded shrink-0 flex items-center justify-center border">
            <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
    )
}
