'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
export default function SignUpPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

async function handleSignUp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    await fetch('/api/register/', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, email, password }),
    });

    router.push('/sign-in');
  }

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-slate-950">
      <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-8 sm:px-10 lg:px-12">
        <header className="flex items-center justify-between">
          <Link className="text-xl font-bold tracking-normal" href="/">
            QuizPlatform
          </Link>
          <Link
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-slate-900 hover:bg-white"
            href="/"
          >
            Back home
          </Link>
        </header>

        <div className="flex flex-1 items-center justify-center py-10 sm:py-12">
          <form
            className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
            onSubmit={handleSignUp}
          >

            <div className="space-y-5">
                <div>
                    <label
                        htmlFor="username"
                        className="mb-2 block text-sm font-semibold text-slate-700"
                    >           
            Username
                    </label>
                    <input
                        type="text"
                        id="username"
                        value={username}    
                    onChange={(e) => setUsername(e.target.value)}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:ring focus:ring-teal-700 focus:ring-opacity-30"
                        required
                    />
                </div>      
                <div>
                    <label
                        htmlFor="email"
                        className="mb-2 block text-sm font-semibold text-slate-700"
                    >
            Email
                    </label>
                    <input

                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}

                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:ring focus:ring-teal-700 focus:ring-opacity-30"
                        required
                    />
                </div>
                <div>
                    <label
                        htmlFor="password"  
                        className="mb-2 block text-sm font-semibold text-slate-700"
                    >
            Password

                    </label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:ring focus:ring-teal-700 focus:ring-opacity-30"
                        required
                    />
                </div>  
                {error && (
                    <p className="rounded-md bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">

                        {error}
                    </p>
                )}
                <button
                    type="submit"
                    className="w-full rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
            Sign Up 
                </button>
            </div>
          </form>
        </div>
       </section> </main>
        )}
