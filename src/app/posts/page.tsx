'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Trash2, Plus, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

type Post = {
  id: string;
  title: string;
  body: string;
  author: string;
  published: number;
  created_at: string;
};

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', author: 'Admin', published: false });

  async function load() {
    const res = await fetch('/api/posts');
    if (res.ok) setPosts(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast.success('Post created');
      setOpen(false);
      setForm({ title: '', body: '', author: 'Admin', published: false });
      load();
    } else {
      const err = await res.json();
      toast.error(err.error || 'Failed');
    }
  }

  async function togglePublished(post: Post) {
    const res = await fetch(`/api/posts/${post.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !post.published }),
    });
    if (res.ok) {
      const updated = await res.json();
      setPosts(p => p.map(x => x.id === post.id ? updated : x));
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/posts/${id}`, { method: 'DELETE' });
    toast.success('Deleted');
    setPosts(p => p.filter(x => x.id !== id));
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Posts</h1>
          <p className="text-muted-foreground mt-1">{posts.length} entries</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="w-4 h-4 mr-2" /> New post
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New post</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="flex flex-col gap-4 mt-2">
              <div className="grid gap-1.5">
                <Label>Title *</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
              </div>
              <div className="grid gap-1.5">
                <Label>Body *</Label>
                <Textarea rows={5} value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} required />
              </div>
              <div className="grid gap-1.5">
                <Label>Author</Label>
                <Input value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} />
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.published} onChange={e => setForm(f => ({ ...f, published: e.target.checked }))} />
                Publish immediately
              </label>
              <Button type="submit" className="mt-1">Save post</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-muted-foreground">Loading…</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">No posts yet.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map(post => (
            <Card key={post.id} className="group">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-base">{post.title}</CardTitle>
                    <Badge variant={post.published ? 'default' : 'secondary'} className="text-xs">
                      {post.published ? 'Published' : 'Draft'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button onClick={() => togglePublished(post)} className="text-muted-foreground hover:text-foreground p-1">
                      {post.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button onClick={() => handleDelete(post.id)} className="text-muted-foreground hover:text-destructive p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">by {post.author} · {new Date(post.created_at).toLocaleDateString()}</p>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-line">{post.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
