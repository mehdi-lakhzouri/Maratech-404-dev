"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

// ✅ FIX: Allow both 'id' and '_id' to prevent the "Select All" bug
interface UserOption {
  id?: string;
  _id?: string;
  email: string;
  fullName: string;
}

interface UserSelectorProps {
  users: UserOption[];
  selectedUserIds: string[];
  onChange: (ids: string[]) => void;
  isLoading?: boolean;
}

export function UserSelector({
  users,
  selectedUserIds = [],
  onChange,
  isLoading,
}: UserSelectorProps) {
  const [open, setOpen] = useState(false);

  // Ensure arrays are safe
  const safeSelectedIds = Array.isArray(selectedUserIds) ? selectedUserIds : [];

  const handleSelect = (userId: string) => {
    if (!userId) return; // Guard against undefined IDs

    if (safeSelectedIds.includes(userId)) {
      onChange(safeSelectedIds.filter((id) => id !== userId));
    } else {
      onChange([...safeSelectedIds, userId]);
    }
  };

  // Helper to safely get the ID
  const getUserId = (user: UserOption) => user.id || user._id || "";

  // Filter selected users for display
  const selectedUsers = users.filter((user) =>
    safeSelectedIds.includes(getUserId(user)),
  );

  return (
    <div className="flex flex-col gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto min-h-[40px] px-3 py-2 text-left"
          >
            {safeSelectedIds.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {selectedUsers.map((user) => (
                  <Badge
                    key={getUserId(user)}
                    variant="secondary"
                    className="mr-1"
                  >
                    {user.fullName}
                  </Badge>
                ))}
              </div>
            ) : (
              <span className="text-muted-foreground">
                Sélectionner des participants...
              </span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
        >
          <Command>
            <CommandInput placeholder="Rechercher un utilisateur..." />
            <CommandList>
              <CommandEmpty>Aucun utilisateur trouvé.</CommandEmpty>
              <CommandGroup>
                {isLoading ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    Chargement...
                  </div>
                ) : (
                  users.map((user) => {
                    const userId = getUserId(user);
                    return (
                      <CommandItem
                        key={userId}
                        value={user.fullName}
                        onSelect={() => handleSelect(userId)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            safeSelectedIds.includes(userId)
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                        <div className="flex flex-col">
                          <span>{user.fullName}</span>
                          <span className="text-xs text-muted-foreground">
                            {user.email}
                          </span>
                        </div>
                      </CommandItem>
                    );
                  })
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
