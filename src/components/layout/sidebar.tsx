import React from 'react';
import Link from 'next/link';
import { Home, Search, Library, Plus } from 'lucide-react';
import { LogoWide } from '@/components/logo';
import { useLibraryStore } from '@/stores/library-store';

export function Sidebar() {
  const { playlists, createPlaylist } = useLibraryStore();

  const handleCreatePlaylist = () => {
    const name = prompt('Enter playlist name:');
    if (name) createPlaylist(name);
  };

  return (
    <aside className="w-64 bg-black flex-col hidden md:flex border-r border-white/5 h-full">
      <div className="p-6">
        <Link href="/" aria-label="Go to Peak Studio home">
          <LogoWide />
        </Link>
      </div>

      <nav className="flex flex-col gap-2 px-4 mb-8">
        <button className="flex items-center gap-4 text-white/70 hover:text-white px-2 py-2 transition-colors font-medium text-sm cursor-pointer">
          <Home className="w-5 h-5" />
          Home
        </button>
        <button className="flex items-center gap-4 text-white/70 hover:text-white px-2 py-2 transition-colors font-medium text-sm cursor-pointer">
          <Search className="w-5 h-5" />
          Search
        </button>
      </nav>

      <div className="flex-1 overflow-y-auto px-4 flex flex-col gap-2">
        <div className="flex items-center justify-between text-white/50 px-2 py-3">
          <button className="flex items-center gap-2 hover:text-white transition-colors uppercase tracking-wider font-semibold text-xs cursor-pointer">
            <Library className="w-4 h-4" />
            Your Library
          </button>
          <button onClick={handleCreatePlaylist} className="hover:text-white transition-colors cursor-pointer" aria-label="Create playlist">
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col mt-2">
          {playlists.map((pl) => (
            <button
              key={pl.id}
              className="text-left px-2 py-2 text-sm text-white/70 hover:text-white truncate transition-colors cursor-pointer"
            >
              {pl.name}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}