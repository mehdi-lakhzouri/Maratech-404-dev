# MEETINGS FEATURE - IMPLEMENTATION GUIDE

## Overview
This document explains the Meetings feature architecture following the strict vertical slice pattern you've defined.

---

## Backend Architecture (NestJS)

### Structure
```
src/features/meetings/
├── meetings.module.ts                 # Module exports
├── controllers/
│   └── meetings.controller.ts         # HTTP endpoints only (thin)
├── services/
│   └── meetings.service.ts            # Use-cases & business logic
├── repositories/
│   └── meetings.repository.ts         # Data access abstraction
├── dto/
│   └── index.ts                       # DTO validation classes
├── guards/                            # (Optional) Authorization
├── tests/                             # Unit & integration tests
└── README.md                          # Feature documentation
```

### Key Principles Applied

1. **Thin Controllers**
   - Only handle HTTP request/response mapping
   - All business logic in `service` layer
   - Example: `POST /meetings` → calls `meetingsService.createMeeting()`

2. **Service Layer (Use-Cases)**
   - All business logic: validation, authorization, state management
   - Uses repository for data access
   - Logs audit events for sensitive actions
   - Manages idempotency

3. **Repository Pattern**
   - Single point of access to database
   - Mongoose queries isolated here
   - Controllers/Services never call `Model.find()` directly

4. **DTOs with Validation**
   - Class-validator annotations (`@IsString`, `@IsDate`, etc.)
   - Automatic validation via pipes
   - Clear error messages for clients

5. **No Cross-Feature Imports**
   - Meetings doesn't import from Documents or Projects internally
   - Exception: Uses shared audit service (in src/shared/)
   - If need data from another feature → prefer events or shared types

### API Endpoints (Implemented)

```
POST   /api/v1/meetings                    # Create (idempotent)
GET    /api/v1/meetings                    # List with filters
GET    /api/v1/meetings/:id                # Get one
PATCH  /api/v1/meetings/:id                # Update
PATCH  /api/v1/meetings/:id/minutes        # Update minutes (final PV)
PATCH  /api/v1/meetings/:id/draft          # Update draft (auto-save)
POST   /api/v1/meetings/:id/attach-document # Attach doc (idempotent)
GET    /api/v1/meetings/:id/documents      # List attached docs
POST   /api/v1/meetings/:id/archive        # Soft-archive
POST   /api/v1/meetings/:id/restore        # Restore from archive
```

### Error Handling

Uses global exception filter (in src/shared/http/filters/):
```json
// Success
{
  "success": true,
  "data": { ... },
  "meta": { ... }
}

// Error
{
  "success": false,
  "error": {
    "code": "AUTH_FORBIDDEN",
    "message": "You can only edit meetings you created",
    "details": null
  }
}
```

### Audit Logging

Sensitive actions logged to `audit_logs` collection:
- `MEETING_CREATED` - new meeting
- `MEETING_UPDATED` - metadata updated
- `MEETING_MINUTES_UPDATED` - final PV saved
- `MEETING_ARCHIVED` - soft-deleted

```typescript
await this.auditService.log({
  actorId: userId,
  action: 'MEETING_CREATED',
  entityType: 'MEETING',
  entityId: meeting._id,
  summary: `Meeting "${meeting.subject}" created`,
});
```

### Idempotency

Implemented for safe retries:
- `POST /meetings` (create)
- `POST /meetings/:id/attach-document`

Requires `Idempotency-Key` header from client:
```
Idempotency-Key: "unique-string-per-request"
```

Service checks `idempotency_keys` collection:
- If key exists → return cached response
- If not → execute, cache response, return

---

## Frontend Architecture (Next.js)

### Structure
```
frontend/
├── app/meetings/
│   ├── layout.tsx                   # Shared layout
│   ├── page.tsx                     # List meetings
│   ├── new/
│   │   └── page.tsx                 # Create form
│   └── [id]/
│       └── page.tsx                 # Detail + editor
├── lib/api/
│   └── meetings.ts                  # TanStack Query hooks
└── components/features/meetings/
    └── (components as needed)
```

### Key Technologies

1. **TanStack Query (React Query)**
   - Declarative data fetching
   - Automatic caching & invalidation
   - Optimistic updates for smooth UX
   - Query keys organized per feature:
     ```typescript
     const MEETINGS_QUERY_KEYS = {
       all: ['meetings'],
       list: (filters) => [...MEETINGS_QUERY_KEYS.all, 'list', filters],
       detail: (id) => [...MEETINGS_QUERY_KEYS.all, 'detail', id],
       documents: (id) => [...MEETINGS_QUERY_KEYS.all, 'documents', id],
     };
     ```

2. **React Hook Form + Zod**
   - Client-side form validation
   - Type-safe with Zod schemas
   - Accessible error messages (aria-describedby)

3. **shadcn/ui Components**
   - Pre-built, accessible components
   - Tailwind CSS styled
   - Full keyboard navigation support

### API Client Integration

All requests include httpOnly cookies automatically:
```typescript
// client.ts (already configured)
fetch(url, { credentials: 'include' })
```

Error handling:
```typescript
export class ApiError extends Error {
  code: string;
  status: number;
  details?: unknown;
}
```

### TanStack Query Hooks

**useGetMeetings(filters?)**
- Fetches list with optional filters
- Returns `{ data: Meeting[]; total: number }`
- Auto-refetch on filter change

**useCreateMeeting()**
- POST with idempotency-key header
- Invalidates list on success
- Returns `{ mutateAsync, isPending, isError, error }`

**useUpdateMeetingMinutes()**
- PATCH /meetings/:id/minutes
- Auto-invalidates detail query
- Handles markdown/plain format

**useUpdateDraftNotes()**
- PATCH /meetings/:id/draft
- For auto-save feature (called every 10s)

**useGetMeetingDocuments(meetingId)**
- GET /meetings/:id/documents
- Fetches related documents

**useAttachDocument()**
- POST /meetings/:id/attach-document
- Invalidates documents list

### Pages

#### `/meetings` - List
- Displays all meetings sorted by date
- Search filter (subject, location)
- Project filter (optional)
- Pagination ready (50 per page)
- **Accessibility**:
  - Semantic `<section>` with `aria-labelledby`
  - `aria-live="polite"` for loading state
  - `aria-busy={isLoading}` for screen readers
  - Card as link (keyboard navigable)
  - No color-only indicators (uses icons + text)

#### `/meetings/new` - Create Form
- React Hook Form with Zod validation
- Fields: subject, scheduledAt, location, participantsText
- Required indicators (`<span className="text-destructive">*</span>`)
- **Accessibility**:
  - `<label>` for every input
  - `aria-describedby` links label to helper text
  - FormMessage displays errors
  - Submit disabled when invalid but keyboard still works
  - Clear error messages for screen readers

#### `/meetings/[id]` - Detail + Editor
- Tabbed interface (Tabs component from shadcn)
- **Tab 1: Procès-verbal (Minutes)**
  - Markdown editor
  - Save button (disabled if no changes)
  - Shows success message on save
  
- **Tab 2: Brouillon (Draft)**
  - Auto-save every 10 seconds
  - Shows last saved timestamp
  - User can edit freely
  
- **Tab 3: Documents**
  - Lists attached documents
  - Download links
  - Empty state message

- **Info Card**: Created by, participants, dates

- **Accessibility**:
  - Semantic tabs with role="tablist"
  - Focus management on tab switch
  - `aria-describedby` on textareas
  - Live regions for auto-save status
  - Archive button with confirmation

---

## Database Schemas (MongoDB)

### Meeting Collection
```typescript
{
  _id: ObjectId
  subject: string (required, trimmed)
  scheduledAt: Date (required, indexed)
  location?: string
  participantsText?: string
  participantIds?: ObjectId[] (refs users)
  projectId?: ObjectId (ref projects)
  
  minutes?: {
    content: string
    format: "plain" | "markdown"
    updatedAt?: Date
    updatedBy?: ObjectId (ref users)
  }
  
  draftNotes?: string
  draftUpdatedAt?: Date
  
  createdBy: ObjectId (ref users, required, indexed)
  
  isArchived: boolean (default false, indexed)
  archivedAt?: Date
  archivedBy?: ObjectId (ref users)
  
  createdAt: Date
  updatedAt: Date
}
```

### Indexes
- `{ subject: "text" }` - full-text search
- `{ projectId: 1, scheduledAt: -1 }` - filter by project, sort by date
- `{ createdBy: 1, createdAt: -1 }` - user's meetings timeline
- `{ scheduledAt: 1, isArchived: 1 }` - upcoming meetings

### MeetingDocument Collection (Join Table)
```typescript
{
  _id: ObjectId
  meetingId: ObjectId (ref meetings, indexed)
  documentId: ObjectId (ref documents, indexed)
  attachedBy: ObjectId (ref users)
  attachedAt: Date
  createdAt, updatedAt
}
```

**Unique index**: `{ meetingId: 1, documentId: 1 }` - prevent duplicate attachments

---

## Authorization & RBAC

**Authorization Strategy**: Creator-based
- Only the meeting creator can:
  - Update meeting details
  - Update/finalize minutes
  - Update draft notes
  - Attach documents
  - Archive/restore

**Future Enhancement**: Add RBAC roles
```typescript
// RESPONSABLE can manage all meetings
// CHEF_PROJET can create & manage own meetings
// CONSULTANT can view & comment (TBD)
```

---

## Form Validation Examples

### Backend (DTOs)
```typescript
export class CreateMeetingDto {
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  subject: string;

  @IsDate()
  scheduledAt: Date;

  @IsOptional()
  @IsString()
  location?: string;
}
```

### Frontend (Zod)
```typescript
const createMeetingSchema = z.object({
  subject: z.string().min(3).max(255),
  scheduledAt: z.string().transform(val => new Date(val)),
  location: z.string().optional(),
});
```

---

## Testing Strategy

### Backend (NestJS)

**Unit Tests**: Service logic
```typescript
describe('MeetingsService', () => {
  it('should create meeting with valid DTO', async () => {
    const dto = { subject: 'Test', scheduledAt: new Date() };
    const result = await service.createMeeting(dto, userId);
    expect(result.subject).toBe('Test');
  });

  it('should throw if meeting in past', async () => {
    const dto = { subject: 'Test', scheduledAt: new Date('2020-01-01') };
    await expect(service.createMeeting(dto, userId)).rejects.toThrow();
  });
});
```

**Integration Tests**: API endpoints
```typescript
describe('POST /api/v1/meetings', () => {
  it('should create with valid DTO', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/meetings')
      .set('Idempotency-Key', 'test-key')
      .send(validDto)
      .expect(201);
    expect(res.body.success).toBe(true);
  });

  it('should reject unauthorized', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/meetings')
      .send(validDto)
      .expect(401);
  });
});
```

### Frontend (Next.js)

**Component Tests** (optional but recommended):
```typescript
import { render, screen } from '@testing-library/react';
import MeetingsListPage from './page';

test('renders meetings list', async () => {
  render(<MeetingsListPage />);
  expect(screen.getByText('Réunions')).toBeInTheDocument();
});
```

---

## Performance Optimizations

### Backend
- Mongoose indexes on frequently queried fields
- Pagination: GET /meetings with `skip` & `limit`
- Soft delete: `isArchived` flag (no physical delete)

### Frontend
- TanStack Query caching + staleTime
- Code splitting: each page lazy-loaded
- Image optimization: use Next.js `<Image>` component
- Debounced search input (optional enhancement)

---

## Accessibility Checklist (WCAG 2.1 AA)

### Color & Contrast
- ✅ No color-only cues (use icons + text, e.g., status badges)
- ✅ Text contrast >= 4.5:1 (Tailwind defaults meet this)
- ✅ Focus indicators visible (ring-2 ring-ring)

### Keyboard Navigation
- ✅ All buttons reachable with Tab
- ✅ Form inputs with `<label>` + `aria-describedby`
- ✅ Dialog focus trapped (shadcn Dialog handles this)
- ✅ No keyboard traps

### Screen Readers
- ✅ Semantic HTML: `<h1>`, `<section>`, `<nav>`, `<main>`
- ✅ `aria-live="polite"` for async updates
- ✅ `aria-busy` for loading states
- ✅ `aria-label` on icon-only buttons
- ✅ `role="status"` on success messages
- ✅ Error messages linked via `aria-describedby`

### Motor & Cognitive
- ✅ Touch targets >= 44x44px (buttons, links)
- ✅ Clear form labels & instructions
- ✅ Sufficient spacing between clickable elements
- ✅ Progress indicators during long operations
- ✅ Consistent navigation across pages

### Testing Tools
- Browser: aXe DevTools (Chrome extension)
- Lighthouse Accessibility audit
- Screen reader: NVDA (Windows) or VoiceOver (Mac)
- Keyboard-only testing: disable mouse

---

## Next Steps

1. **Add Remaining Features**:
   - Document upload in meeting detail (integrate with Documents feature)
   - Action items extraction from minutes
   - Email notifications on meeting create/update
   - Meeting templates (pre-filled subjects, participants)

2. **Enhance Authorization**:
   - Project-based permissions (only project members can view meeting)
   - Meeting viewer list (optional)
   - Presenter vs attendee roles

3. **Advanced Features**:
   - Real-time collaboration (multiple users editing minutes)
   - AI-powered minutes generation (from transcript)
   - Calendar integration (Outlook, Google Calendar)
   - Recurring meetings
   - Zoom/Teams recording links

4. **Reporting**:
   - Meeting statistics (count, duration, participants)
   - Minutes analytics (extract action items automatically)

---

## Common Patterns Used

### Idempotency
For safe retries, implemented in service:
```typescript
if (idempotencyKey) {
  const cached = await this.idempotencyService.getCachedResponse(...);
  if (cached) return cached;
}
// ... execute ...
await this.idempotencyService.cacheResponse(...);
```

### Soft Delete
Instead of physical deletion, set flag:
```typescript
async archive(id, userId) {
  return this.repo.update(id, {
    isArchived: true,
    archivedAt: new Date(),
    archivedBy: userId,
  });
}
```

### Auto-Save (Frontend)
Debounced save on user input:
```typescript
useEffect(() => {
  const timer = setTimeout(() => {
    updateDraft.mutate({ id, draftNotes });
  }, 10000); // 10 seconds
  return () => clearTimeout(timer);
}, [draftNotes]);
```

### Optimistic Updates (TanStack Query)
```typescript
useMutation({
  mutationFn: updateMinutes,
  onMutate: async (newData) => {
    // Optimistically update cache
    queryClient.setQueryData(['meetings', id], prev => ({
      ...prev,
      minutes: newData,
    }));
  },
  onError: () => {
    // Revert on error
    queryClient.invalidateQueries(['meetings', id]);
  },
});
```

---

## Quick Reference - Common Tasks

### Add a new meeting field
1. Update Meeting schema in `src/shared/db/schemas/meeting.schema.ts`
2. Update CreateMeetingDto in `src/features/meetings/dto/index.ts`
3. Update service method `createMeeting()`
4. Update repository `create()` method (if needed)
5. Update frontend types in `lib/api/meetings.ts`
6. Update form in `app/meetings/new/page.tsx`

### Add a new API endpoint
1. Create DTO in `src/features/meetings/dto/`
2. Add method to `MeetingsService`
3. Add route to `MeetingsController`
4. Add React hook in `lib/api/meetings.ts`
5. Use hook in component/page

### Add a new filter to meetings list
1. Update `GetMeetingsQueryDto` in backend DTO
2. Update repository `findAll()` method with filter logic
3. Update `useGetMeetings()` hook signature
4. Pass filter from page component

---

## Resources

- **NestJS Docs**: https://docs.nestjs.com
- **TanStack Query Docs**: https://tanstack.com/query/latest
- **shadcn/ui Docs**: https://ui.shadcn.com
- **WCAG 2.1 Checklist**: https://www.w3.org/WAI/WCAG21/checklist/
- **Mongoose Docs**: https://mongoosejs.com

---

**Version**: 1.0
**Last Updated**: February 2026
**Owner**: Architecture Team
