'use client';

/**
 * Document Filters
 * ----------------
 * Accessible filter bar for documents list.
 * Tab-based type filter + search input.
 */

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DOCUMENT_TYPES } from '@/lib/validations/documents';
import type { DocumentType } from '@/lib/api/types';

interface DocumentFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  type: DocumentType | undefined;
  onTypeChange: (value: DocumentType | undefined) => void;
  showArchived: boolean;
  onArchivedChange: (value: boolean) => void;
}

export function DocumentFilters({
  search,
  onSearchChange,
  type,
  onTypeChange,
  showArchived,
  onArchivedChange,
}: DocumentFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          placeholder="Rechercher un document..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
          aria-label="Rechercher un document"
        />
      </div>

      {/* Type tabs */}
      <Tabs
        value={type || 'all'}
        onValueChange={(v) =>
          onTypeChange(v === 'all' ? undefined : (v as DocumentType))
        }
      >
        <TabsList className="w-full justify-start flex-wrap h-auto gap-1 bg-transparent p-0">
          <TabsTrigger
            value="all"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-4 py-1.5 text-sm"
          >
            Tous
          </TabsTrigger>
          {DOCUMENT_TYPES.map((dt) => (
            <TabsTrigger
              key={dt.value}
              value={dt.value}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-4 py-1.5 text-sm"
            >
              {dt.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Archive toggle */}
      <Tabs
        value={showArchived ? 'archived' : 'active'}
        onValueChange={(v) => onArchivedChange(v === 'archived')}
      >
        <TabsList className="bg-transparent p-0 gap-1">
          <TabsTrigger
            value="active"
            className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-800 dark:data-[state=active]:bg-emerald-900 dark:data-[state=active]:text-emerald-200 rounded-full px-4 py-1.5 text-sm"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2" aria-hidden="true" />
            Actifs
          </TabsTrigger>
          <TabsTrigger
            value="archived"
            className="data-[state=active]:bg-red-100 data-[state=active]:text-red-800 dark:data-[state=active]:bg-red-900 dark:data-[state=active]:text-red-200 rounded-full px-4 py-1.5 text-sm"
          >
            <span className="w-2 h-2 rounded-full bg-red-500 mr-2" aria-hidden="true" />
            Archivés
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
