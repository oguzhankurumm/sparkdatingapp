'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MagnifyingGlass, X } from '@phosphor-icons/react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '@/lib/api-client'

interface GiphyGif {
  id: string
  url: string
  previewUrl: string
  width: number
  height: number
  title: string
}

interface GiphyResponse {
  gifs: GiphyGif[]
}

interface GifPickerProps {
  open: boolean
  onClose: () => void
  onSelect: (gif: GiphyGif) => void
}

function useGiphySearch(query: string) {
  return useQuery({
    queryKey: ['giphy', 'search', query],
    queryFn: () => api.get<GiphyResponse>(`/giphy/search?q=${encodeURIComponent(query)}&limit=20`),
    enabled: query.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 min cache
  })
}

function useGiphyTrending() {
  return useQuery({
    queryKey: ['giphy', 'trending'],
    queryFn: () => api.get<GiphyResponse>('/giphy/trending?limit=20'),
    staleTime: 5 * 60 * 1000,
  })
}

export function GifPicker({ open, onClose, onSelect }: GifPickerProps) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const [debouncedQuery, setDebouncedQuery] = useState('')

  // Debounce search input
  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(query.trim())
    }, 300)
    return () => clearTimeout(debounceRef.current)
  }, [query])

  // Focus search input when picker opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      setQuery('')
      setDebouncedQuery('')
    }
  }, [open])

  const searchResults = useGiphySearch(debouncedQuery)
  const trendingResults = useGiphyTrending()

  const isSearching = debouncedQuery.length >= 2
  const { data, isLoading } = isSearching ? searchResults : trendingResults
  const gifs = data?.gifs ?? []

  const handleSelect = useCallback(
    (gif: GiphyGif) => {
      onSelect(gif)
      onClose()
    },
    [onSelect, onClose],
  )

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 16, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 320 }}
          exit={{ opacity: 0, y: 16, height: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="border-border-subtle overflow-hidden border-t bg-[var(--surface-glass)] backdrop-blur-xl"
        >
          {/* Search bar */}
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="border-border bg-surface-elevated flex flex-1 items-center gap-2 rounded-xl border px-3 py-2">
              <MagnifyingGlass size={16} className="text-text-muted shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search GIFs..."
                className="text-text-primary placeholder:text-text-muted w-full bg-transparent text-sm outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="text-text-muted hover:text-text-secondary"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-text-muted hover:text-text-secondary text-sm font-medium"
            >
              Cancel
            </button>
          </div>

          {/* GIF grid */}
          <div className="h-[260px] overflow-y-auto px-2 pb-2">
            {isLoading ? (
              <div className="grid grid-cols-2 gap-1.5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-surface-elevated animate-pulse rounded-lg"
                    style={{ height: 120 }}
                  />
                ))}
              </div>
            ) : gifs.length === 0 ? (
              <div className="text-text-muted flex h-full items-center justify-center text-sm">
                {isSearching ? 'No GIFs found' : 'Loading trending GIFs...'}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1.5">
                {gifs.map((gif) => (
                  <button
                    key={gif.id}
                    type="button"
                    onClick={() => handleSelect(gif)}
                    className="hover:ring-primary/50 group relative overflow-hidden rounded-lg transition-all hover:ring-2"
                  >
                    <img
                      src={gif.previewUrl}
                      alt={gif.title}
                      loading="lazy"
                      className="h-[120px] w-full object-cover transition-transform group-hover:scale-105"
                    />
                    {/* Hover overlay with animated GIF preview */}
                    <img
                      src={gif.url}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity group-hover:opacity-100"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* GIPHY attribution */}
          <div className="text-text-muted px-3 py-1 text-center text-[10px]">Powered by GIPHY</div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
