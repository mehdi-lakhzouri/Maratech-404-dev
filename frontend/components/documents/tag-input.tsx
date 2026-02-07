'use client';

/**
 * Tag Input Component
 * -------------------
 * Allows typing tags, shows autocomplete from existing tags,
 * click to select existing or add new ones. Tags displayed as badges.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function TagInput({
  value,
  onChange,
  suggestions = [],
  placeholder = 'Ajouter un tag...',
  className,
  disabled = false,
}: TagInputProps) {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter suggestions: not already selected, matches input
  const filtered = suggestions.filter(
    (s) =>
      !value.includes(s) &&
      s.toLowerCase().includes(input.toLowerCase()),
  );

  // Check if input is a new tag (not in suggestions)
  const isNew =
    input.trim().length > 0 &&
    !suggestions.some((s) => s.toLowerCase() === input.trim().toLowerCase()) &&
    !value.some((v) => v.toLowerCase() === input.trim().toLowerCase());

  const addTag = useCallback(
    (tag: string) => {
      const trimmed = tag.trim();
      if (!trimmed) return;
      if (value.some((v) => v.toLowerCase() === trimmed.toLowerCase())) return;
      onChange([...value, trimmed]);
      setInput('');
      setShowSuggestions(false);
      setHighlightIndex(-1);
    },
    [value, onChange],
  );

  const removeTag = useCallback(
    (tag: string) => {
      onChange(value.filter((v) => v !== tag));
    },
    [value, onChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const totalItems = filtered.length + (isNew ? 1 : 0);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightIndex((prev) => (prev + 1) % totalItems);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightIndex((prev) => (prev - 1 + totalItems) % totalItems);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (highlightIndex >= 0 && highlightIndex < filtered.length) {
          addTag(filtered[highlightIndex]);
        } else if (highlightIndex === filtered.length && isNew) {
          addTag(input.trim());
        } else if (input.trim()) {
          addTag(input.trim());
        }
      } else if (e.key === 'Backspace' && !input && value.length > 0) {
        removeTag(value[value.length - 1]);
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
        setHighlightIndex(-1);
      }
    },
    [filtered, isNew, highlightIndex, input, value, addTag, removeTag],
  );

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div
        className={cn(
          'flex flex-wrap gap-1.5 p-2 rounded-md border bg-background min-h-10 cursor-text',
          'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
          disabled && 'opacity-50 pointer-events-none',
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="gap-1 pl-2 pr-1 py-0.5 text-xs"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
              className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
              aria-label={`Retirer le tag ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setShowSuggestions(true);
            setHighlightIndex(-1);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : ''}
          disabled={disabled}
          className="flex-1 min-w-30 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
          aria-label="Saisir un tag"
        />
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && (filtered.length > 0 || isNew) && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-y-auto">
          {filtered.map((tag, i) => (
            <button
              key={tag}
              type="button"
              onClick={() => addTag(tag)}
              className={cn(
                'w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors',
                highlightIndex === i && 'bg-accent',
              )}
            >
              {tag}
            </button>
          ))}
          {isNew && (
            <button
              type="button"
              onClick={() => addTag(input.trim())}
              className={cn(
                'w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors border-t',
                highlightIndex === filtered.length && 'bg-accent',
              )}
            >
              <span className="text-muted-foreground">Créer :</span>{' '}
              <span className="font-medium">{input.trim()}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
