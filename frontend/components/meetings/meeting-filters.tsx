'use client';

/**
 * Meeting Filters
 * ---------------
 * Filter bar for meetings list: search + archive toggle + date range.
 */

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MeetingFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  showArchived: boolean;
  onArchivedChange: (value: boolean) => void;
}

export function MeetingFilters({
  search,
  onSearchChange,
  showArchived,
  onArchivedChange,
}: MeetingFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          placeholder="Rechercher une réunion..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
          aria-label="Rechercher une réunion"
        />
      </div>

      {/* Archive toggle */}
      <Tabs
        value={showArchived ? 'archived' : 'active'}
        onValueChange={(v) => onArchivedChange(v === 'archived')}
      >
        <TabsList className="bg-transparent p-0 gap-1">
          <TabsTrigger
            value="active"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-4 py-1.5 text-sm"
          >
            Actives
          </TabsTrigger>
          <TabsTrigger
            value="archived"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-4 py-1.5 text-sm"
          >
            Archivées
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
