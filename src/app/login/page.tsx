'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

type User = { id: string; email: string; name: string; created_at: string };

export default function LoginPage() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => { setUser(data.user); setChecking(false); });
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    toast.success('Signed out');
  }

  if (checking) return <div className="flex items-center justify-center min-h-screen text-muted-foreground">Loading…</div>;

  if (user) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Signed in as {user.email}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-1">
              <span className="text-xs text-muted-foreground">Name</span>
              <span className="font-medium">{user.name}</span>
            </div>
            <div className="grid gap-1">
              <span className="text-xs text-muted-foreground">Email</span>
              <span className="font-medium">{user.email}</span>
            </div>
            <div className="grid gap-1">
              <span className="text-xs text-muted-foreground">Member since</span>
              <span className="font-medium">{new Date(user.created_at).toLocaleDateString()}</span>
            </div>
            <Button variant="outline" onClick={handleLogout} className="mt-2">Sign out</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <Tabs defaultValue="login" className="w-full max-w-sm">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Sign in</TabsTrigger>
          <TabsTrigger value="register">Create account</TabsTrigger>
        </TabsList>

        <TabsContent value="login">
          <LoginForm onSuccess={setUser} />
        </TabsContent>

        <TabsContent value="register">
          <RegisterForm onSuccess={setUser} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LoginForm({ onSuccess }: { onSuccess: (u: User) => void }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      const user = await res.json();
      toast.success(`Welcome back, ${user.name}!`);
      onSuccess(user);
    } else {
      const err = await res.json();
      toast.error(err.error || 'Sign in failed');
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Enter your credentials to continue</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-1.5">
            <Label>Email</Label>
            <Input type="email" autoComplete="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          </div>
          <div className="grid gap-1.5">
            <Label>Password</Label>
            <Input type="password" autoComplete="current-password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
          </div>
          <Button type="submit" disabled={loading} className="mt-2">{loading ? 'Signing in…' : 'Sign in'}</Button>
        </form>
      </CardContent>
    </Card>
  );
}

function RegisterForm({ onSuccess }: { onSuccess: (u: User) => void }) {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      const user = await res.json();
      toast.success(`Account created! Welcome, ${user.name}.`);
      onSuccess(user);
    } else {
      const err = await res.json();
      toast.error(err.error || 'Registration failed');
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create account</CardTitle>
        <CardDescription>Fill in the details below</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-1.5">
            <Label>Name</Label>
            <Input autoComplete="name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div className="grid gap-1.5">
            <Label>Email</Label>
            <Input type="email" autoComplete="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          </div>
          <div className="grid gap-1.5">
            <Label>Password</Label>
            <Input type="password" autoComplete="new-password" minLength={8} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
            <span className="text-xs text-muted-foreground">Minimum 8 characters</span>
          </div>
          <Button type="submit" disabled={loading} className="mt-2">{loading ? 'Creating…' : 'Create account'}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
