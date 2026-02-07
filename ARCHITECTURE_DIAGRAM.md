# MEETINGS FEATURE - ARCHITECTURE DIAGRAM

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER BROWSER                              │
│  Chrome / Firefox / Safari / Mobile                              │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS
                             ▼
        ┌──────────────────────────────────────────┐
        │     NEXT.JS FRONTEND (Port 3000)         │
        ├──────────────────────────────────────────┤
        │ App Router                               │
        │  - /meetings (List)                       │
        │  - /meetings/new (Create)                 │
        │  - /meetings/[id] (Detail)               │
        ├──────────────────────────────────────────┤
        │ Features                                  │
        │  - React Hook Form + Zod validation      │
        │  - TanStack Query (React Query)          │
        │  - shadcn/ui components                  │
        │  - Tailwind CSS                          │
        ├──────────────────────────────────────────┤
        │ lib/api/meetings.ts                      │
        │  - useGetMeetings()                      │
        │  - useCreateMeeting()                    │
        │  - useUpdateMeetingMinutes()             │
        │  - useUpdateDraftNotes()                 │
        │  - 6 more hooks...                       │
        └────────────────┬─────────────────────────┘
                         │ REST API + Cookies
                         │ (httpOnly, Secure, SameSite=Lax)
                         ▼
        ┌──────────────────────────────────────────┐
        │    NESTJS BACKEND (Port 3001)            │
        │         /api/v1                          │
        ├──────────────────────────────────────────┤
        │                                          │
        │  ┌──────────────────────────────────┐   │
        │  │  MeetingsController               │   │
        │  │  (Thin HTTP Layer)                │   │
        │  │  - @Post()                        │   │
        │  │  - @Get()                         │   │
        │  │  - @Patch()                       │   │
        │  │  - @UseGuards(JwtAuthGuard)       │   │
        │  └────────────┬─────────────────────┘   │
        │               │                         │
        │  ┌────────────▼─────────────────────┐   │
        │  │  MeetingsService                  │   │
        │  │  (Business Logic & Use-Cases)     │   │
        │  │  - createMeeting()                │   │
        │  │  - updateMeetingMinutes()         │   │
        │  │  - attachDocument()               │   │
        │  │  - archiveMeeting()               │   │
        │  │  - 5 more methods...              │   │
        │  │                                   │   │
        │  │  Integrations:                    │   │
        │  │  - AuditService (audit logs)      │   │
        │  │  - IdempotencyService (retries)   │   │
        │  └────────────┬─────────────────────┘   │
        │               │                         │
        │  ┌────────────▼─────────────────────┐   │
        │  │  MeetingsRepository               │   │
        │  │  (Data Access Layer)              │   │
        │  │  - findById()                     │   │
        │  │  - findAll()                      │   │
        │  │  - create()                       │   │
        │  │  - update()                       │   │
        │  │  - attachDocument()               │   │
        │  │  - archive()                      │   │
        │  │  - 8 more methods...              │   │
        │  └────────────┬─────────────────────┘   │
        │               │                         │
        │  ┌────────────▼─────────────────────┐   │
        │  │  Mongoose Models                  │   │
        │  │  - Meeting (13 fields)            │   │
        │  │  - MeetingDocument (4 fields)     │   │
        │  │  - Schemas with indexes           │   │
        │  └────────────┬─────────────────────┘   │
        │               │                         │
        └───────────────┼──────────────────────────┘
                        │ MongoDB Driver
                        ▼
        ┌──────────────────────────────────────────┐
        │      MONGODB (Default port 27017)        │
        ├──────────────────────────────────────────┤
        │ Collections                              │
        │  - meetings (10 docs)                    │
        │  - meeting_documents (0-N per meeting)  │
        │  - audit_logs (audit trail)             │
        │  - idempotency_keys (cache, TTL 24h)    │
        │  - users, projects, documents, ...      │
        │                                          │
        │ Indexes (Optimized Queries)             │
        │  - meetings.subject (text index)        │
        │  - meetings.scheduledAt                 │
        │  - meetings.projectId, scheduledAt      │
        │  - meetings.createdBy, createdAt        │
        │  - meeting_documents.meetingId,         │
        │    documentId (unique)                  │
        └──────────────────────────────────────────┘
```

---

## Feature Vertical Slice (Meetings)

```
src/features/meetings/
│
├── meetings.module.ts
│   └── Exports: MeetingsService, MeetingsRepository
│
├── controllers/
│   └── meetings.controller.ts
│       ├── Routes: POST /meetings, GET /meetings, PATCH /meetings/:id, etc.
│       ├── @UseGuards(JwtAuthGuard) - Require JWT
│       ├── @Param, @Body, @Query - DTO mapping
│       └── req.user - Extract from JWT
│
├── services/
│   └── meetings.service.ts
│       ├── createMeeting(dto, userId, idempotencyKey)
│       ├── getMeeting(id)
│       ├── updateMeeting(id, dto, userId)
│       ├── updateMeetingMinutes(id, dto, userId)
│       ├── updateDraftNotes(id, dto, userId)
│       ├── attachDocument(id, dto, userId)
│       ├── archiveMeeting(id, userId)
│       ├── restoreMeeting(id, userId)
│       └── Dependencies:
│           ├── MeetingsRepository
│           ├── AuditService
│           └── IdempotencyService
│
├── repositories/
│   └── meetings.repository.ts
│       ├── create(data)
│       ├── findById(id)
│       ├── findAll(filters)
│       ├── update(id, data)
│       ├── updateMinutes(id, content, format, updatedBy)
│       ├── updateDraftNotes(id, notes)
│       ├── archive(id, archivedBy)
│       ├── restore(id)
│       ├── attachDocument(meetingId, documentId, attachedBy)
│       ├── getAttachedDocuments(meetingId)
│       └── detachDocument(meetingId, documentId)
│
├── dto/
│   └── index.ts
│       ├── CreateMeetingDto
│       ├── UpdateMeetingDto
│       ├── UpdateMeetingMinutesDto
│       ├── UpdateDraftNotesDto
│       ├── AttachDocumentDto
│       ├── GetMeetingsQueryDto
│       └── All with @IsString, @IsDate, etc. validation
│
├── guards/ (Future)
│   └── meeting-owner.guard.ts (Optional - for future RBAC)
│
├── tests/
│   ├── meetings.service.spec.ts
│   ├── meetings.controller.spec.ts
│   └── meetings.e2e.spec.ts
│
└── IMPLEMENTATION_GUIDE.md
    └── (400+ lines of detailed docs)
```

---

## Data Flow - Create Meeting

```
User Input (Browser)
    │
    ▼
┌─────────────────────────────────────────┐
│  Create Form (/meetings/new)            │
│  - Subject input                        │
│  - Date/time input                      │
│  - Location input                       │
│  - Participants text                    │
└──────────┬──────────────────────────────┘
           │ Form Submission
           ▼
┌─────────────────────────────────────────┐
│  React Hook Form                        │
│  - Validates with Zod schema            │
│  - Shows error messages                 │
│  - Disables submit if invalid           │
└──────────┬──────────────────────────────┘
           │ Valid DTO
           ▼
┌─────────────────────────────────────────┐
│  useCreateMeeting() Hook                │
│  - Generates Idempotency-Key            │
│  - POST /api/v1/meetings                │
│  - Includes JWT in Cookie               │
└──────────┬──────────────────────────────┘
           │ HTTP POST + Headers
           ▼
┌─────────────────────────────────────────┐
│  Backend: /api/v1/meetings              │
│  - MeetingsController.create()          │
│  - Extract user from JWT (req.user.sub) │
│  - Call MeetingsService                 │
└──────────┬──────────────────────────────┘
           │ DTO + userId
           ▼
┌─────────────────────────────────────────┐
│  MeetingsService.createMeeting()        │
│  1. Check idempotency key               │
│  2. Validate date not in past           │
│  3. Call repository.create()            │
│  4. Log audit event                     │
│  5. Cache response with idempotency key │
│  6. Return created meeting              │
└──────────┬──────────────────────────────┘
           │ Meeting object
           ▼
┌─────────────────────────────────────────┐
│  MeetingsRepository.create()            │
│  - Mongoose Meeting.save()              │
│  - Returns saved document               │
│  - Includes _id, timestamps, etc.       │
└──────────┬──────────────────────────────┘
           │ MongoDB Save
           ▼
┌─────────────────────────────────────────┐
│  MongoDB: meetings collection           │
│  - Insert document                      │
│  - Generate _id                         │
│  - Set createdAt, updatedAt             │
│  - Index on subject, projectId, etc.    │
└──────────┬──────────────────────────────┘
           │ Success Response
           ▼
┌─────────────────────────────────────────┐
│  HTTP 201 Response                      │
│  {                                      │
│    "success": true,                     │
│    "data": {                            │
│      "_id": "...",                      │
│      "subject": "...",                  │
│      "createdAt": "...",                │
│      "createdBy": {...},                │
│      ...                                │
│    }                                    │
│  }                                      │
└──────────┬──────────────────────────────┘
           │ Response + Data
           ▼
┌─────────────────────────────────────────┐
│  Frontend: TanStack Query                │
│  - Store in cache                       │
│  - Invalidate list query                │
│  - Update component state               │
└──────────┬──────────────────────────────┘
           │ UI Update
           ▼
┌─────────────────────────────────────────┐
│  Browser: Redirect to /meetings         │
│  - Show created meeting in list         │
│  - Show success message                 │
│  - User sees meeting immediately        │
└─────────────────────────────────────────┘
```

---

## Data Flow - Update Minutes (Auto-Save Draft)

```
User Types in Draft Notes
    │
    ▼
┌─────────────────────────────────────────┐
│  Textarea onChange                      │
│  - setDraftNotes(value)                 │
│  - Update local state                   │
└──────────┬──────────────────────────────┘
           │ (Every keystroke)
           ▼
┌─────────────────────────────────────────┐
│  useEffect Hook                         │
│  - Wait 10 seconds                      │
│  - Clear previous timer if typing       │
│  (Debounced)                            │
└──────────┬──────────────────────────────┘
           │ 10 second timeout
           ▼
┌─────────────────────────────────────────┐
│  useUpdateDraftNotes() Mutation         │
│  - PATCH /api/v1/meetings/:id/draft     │
│  - Send draftNotes in body              │
└──────────┬──────────────────────────────┘
           │ HTTP PATCH
           ▼
┌─────────────────────────────────────────┐
│  Backend: /api/v1/meetings/:id/draft    │
│  - MeetingsController.updateDraft()     │
│  - Extract userId from JWT              │
│  - Call service                         │
└──────────┬──────────────────────────────┘
           │ id + draftNotes + userId
           ▼
┌─────────────────────────────────────────┐
│  MeetingsService.updateDraftNotes()     │
│  1. Verify user is creator              │
│  2. Call repository.updateDraftNotes()  │
│  3. Return updated document             │
└──────────┬──────────────────────────────┘
           │ Updated meeting
           ▼
┌─────────────────────────────────────────┐
│  MeetingsRepository.updateDraftNotes()  │
│  - MongoDB: findByIdAndUpdate            │
│  - Set draftNotes + draftUpdatedAt      │
│  - Set updatedAt timestamp              │
│  - Return updated doc                   │
└──────────┬──────────────────────────────┘
           │ Updated meeting
           ▼
┌─────────────────────────────────────────┐
│  HTTP 200 Response                      │
│  {                                      │
│    "success": true,                     │
│    "data": {                            │
│      "_id": "...",                      │
│      "draftNotes": "...",               │
│      "draftUpdatedAt": "2026-02-07...", │
│      ...                                │
│    }                                    │
│  }                                      │
└──────────┬──────────────────────────────┘
           │ Success
           ▼
┌─────────────────────────────────────────┐
│  Frontend: TanStack Query                │
│  - Update cache                         │
│  - Trigger onSuccess callback           │
│  - setLastSavedDraft(new Date())       │
└──────────┬──────────────────────────────┘
           │ UI Update
           ▼
┌─────────────────────────────────────────┐
│  Browser: Show "Saved at HH:MM:SS"      │
│  - Update timestamp                     │
│  - User sees confirmation               │
│  - Can continue typing                  │
└─────────────────────────────────────────┘
```

---

## Authorization Flow

```
HTTP Request with JWT in Cookie
    │
    ▼
┌─────────────────────────────────────────┐
│  @UseGuards(JwtAuthGuard)               │
│  - Verify JWT signature                 │
│  - Extract user id (sub)                │
│  - Set req.user = { sub: userId, ... } │
│  - Reject if invalid/expired (401)      │
└──────────┬──────────────────────────────┘
           │ Valid JWT
           ▼
┌─────────────────────────────────────────┐
│  MeetingsController method              │
│  - Extract userId: req.user.sub         │
│  - Pass to service                      │
└──────────┬──────────────────────────────┘
           │ userId in method call
           ▼
┌─────────────────────────────────────────┐
│  MeetingsService method                 │
│  - Check authorization:                 │
│    if (meeting.createdBy !== userId)    │
│      throw ForbiddenException (403)     │
│  - Proceed if authorized                │
│  - Call repository                      │
└──────────┬──────────────────────────────┘
           │ Authorized
           ▼
┌─────────────────────────────────────────┐
│  Repository method executes             │
│  - Access granted to data               │
│  - Return result                        │
└──────────┬──────────────────────────────┘
           │ Success
           ▼
┌─────────────────────────────────────────┐
│  Response 200 OK                        │
│  { "success": true, "data": {...} }     │
└─────────────────────────────────────────┘
```

---

## Error Handling & Response Envelopes

```
All Responses Follow This Structure:

┌─────────────────────────────────────────┐
│  Success Response (HTTP 200/201)        │
├─────────────────────────────────────────┤
│ {                                       │
│   "success": true,                      │
│   "data": {                             │
│     "_id": "...",                       │
│     "subject": "...",                   │
│     ...                                 │
│   },                                    │
│   "meta": {                             │
│     "timestamp": "2026-02-07T10:30:00", │
│     "path": "/api/v1/meetings",         │
│     "requestId": "abc-123-def"          │
│   }                                     │
│ }                                       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Error Response (4xx/5xx)               │
├─────────────────────────────────────────┤
│ {                                       │
│   "success": false,                     │
│   "error": {                            │
│     "code": "VALIDATION_ERROR",         │
│     "message": "Subject required",      │
│     "details": {                        │
│       "field": "subject",               │
│       "constraint": "isNotEmpty"        │
│     }                                   │
│   },                                    │
│   "meta": {                             │
│     "timestamp": "2026-02-07T10:30:01", │
│     "path": "/api/v1/meetings",         │
│     "requestId": "abc-123-def"          │
│   }                                     │
│ }                                       │
└─────────────────────────────────────────┘

Error Codes:
  - VALIDATION_ERROR (400): Invalid DTO
  - AUTH_UNAUTHORIZED (401): Missing/invalid JWT
  - AUTH_FORBIDDEN (403): Not authorized (not creator)
  - ENTITY_NOT_FOUND (404): Meeting doesn't exist
  - INTERNAL_SERVER_ERROR (500): Server error
```

---

## Database Relationships

```
┌──────────────────────┐
│     meetings         │
├──────────────────────┤
│ _id: ObjectId        │ (Primary Key)
│ subject: string ◄────┼──────────────── (Text Index)
│ scheduledAt: Date ◄──┼──────────────── (Index)
│ location: string     │
│ participantsText     │
│ projectId ──────────────────► (Ref) projects._id
│ createdBy ──────────────────► (Ref) users._id
│ minutes: {...}       │
│ draftNotes: string   │
│ isArchived: boolean  │
│ archivedAt: Date     │
│ archivedBy ──────────────────► (Ref) users._id
│ createdAt: Date      │
│ updatedAt: Date      │
└──────────────────────┘
        │
        │ (One-to-Many)
        │
        ▼
┌──────────────────────────────────┐
│   meeting_documents (Join)       │
├──────────────────────────────────┤
│ _id: ObjectId                    │
│ meetingId ──────────────────────► (Ref) meetings._id
│ documentId ─────────────────────► (Ref) documents._id
│ attachedBy ─────────────────────► (Ref) users._id
│ attachedAt: Date                 │
│ createdAt, updatedAt             │
│                                  │
│ [Unique Index]                   │
│ { meetingId: 1, documentId: 1 }  │
└──────────────────────────────────┘
        │
        │ (References)
        │
        ▼
┌──────────────────────┐
│    documents         │
├──────────────────────┤
│ _id: ObjectId        │
│ title: string        │
│ fileName: string     │
│ fileUrl: string      │
│ mimeType: string     │
│ sizeBytes: number    │
│ uploadedBy ───────────────────► (Ref) users._id
│ ...                  │
└──────────────────────┘

Audit Trail:
┌──────────────────────┐
│   audit_logs         │
├──────────────────────┤
│ _id: ObjectId        │
│ actorId ───────────────────────► (Ref) users._id
│ action: "MEETING_CREATED"        │
│ entityType: "MEETING"            │
│ entityId ───────────────────────► (Ref) meetings._id
│ summary: string                  │
│ meta: Record<string, any>        │
│ createdAt: Date                  │
└──────────────────────┘
```

---

## Accessibility Layer

```
┌──────────────────────────────────────┐
│  Frontend Components                 │
├──────────────────────────────────────┤
│                                      │
│  Form Labels                         │
│  ├── <label htmlFor="subject">...    │
│  ├── aria-describedby="subject-help" │
│  └── aria-required="true"            │
│                                      │
│  Error Messages                      │
│  ├── id="subject-error"              │
│  ├── role="alert"                    │
│  └── Announced to screen readers     │
│                                      │
│  Loading States                      │
│  ├── aria-busy="true"                │
│  ├── aria-live="polite"              │
│  └── Skeletons shown                 │
│                                      │
│  Semantic HTML                       │
│  ├── <h1>, <h2>, <section>, <main>  │
│  ├── <button> vs <a>                 │
│  └── Proper heading hierarchy        │
│                                      │
│  Keyboard Navigation                 │
│  ├── Tab through all elements        │
│  ├── Enter to submit forms           │
│  ├── Escape to close dialogs         │
│  └── Focus outline visible           │
│                                      │
│  Color & Contrast                    │
│  ├── No color-only cues              │
│  ├── Text contrast 4.5:1 minimum     │
│  ├── Icons paired with text          │
│  └── Dark/light mode support         │
│                                      │
└──────────────────────────────────────┘
```

---

**Total Architecture Size**: ~3000 lines of production code  
**Documentation**: ~1500 lines  
**Complexity**: Moderate (vertical slice pattern, clean separation)  
**Type Safety**: 100% TypeScript (frontend + backend)  
**Test Coverage**: Ready for unit + integration tests
