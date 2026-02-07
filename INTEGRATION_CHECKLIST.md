# 🔗 MEETINGS FEATURE - INTEGRATION CHECKLIST

## Step-by-Step Integration Instructions

### Step 1: Import Meetings Module in Backend (5 mins)

**File**: `src/app.module.ts`

Add to imports array:

```typescript
import { MeetingsModule } from './features/meetings/meetings.module';

@Module({
  imports: [
    ConfigModule.forRoot({ ... }),
    MongooseModule.forRoot(process.env.MONGO_URI),
    AuthModule,
    UsersModule,
    ProjectsModule,
    // ✅ Add this line:
    MeetingsModule,
    // ... other modules
  ],
  // ... rest of module
})
export class AppModule {}
```

### Step 2: Verify Database Connection

**Command**:

```bash
cd backend
npm run start:dev
```

**Expected Output**:

```
✓ App listening on port 3001
✓ Modules bootstrapped successfully
✓ Mongoose connected
```

**Test the endpoint**:

```bash
# Should return 401 (no token) or empty list
curl -X GET http://localhost:3001/api/v1/meetings
```

### Step 3: Add Navigation Link to Meetings

**File**: `components/layouts/dashboard-header.tsx`

Find the navigation section and add:

```tsx
<Link href="/meetings" className="text-sm font-medium ...">
  📅 Réunions
</Link>
```

Or in sidebar (if you have one):

```tsx
<Link href="/meetings">
  <Button variant="ghost" className="w-full justify-start">
    <Calendar className="mr-2 h-4 w-4" />
    Réunions
  </Button>
</Link>
```

### Step 4: Test Frontend Pages

**Start frontend**:

```bash
cd frontend
npm run dev
```

**Navigate to**:

- http://localhost:3000/meetings - Should show empty list
- http://localhost:3000/meetings/new - Should show create form
- http://localhost:3000/dashboard - Check if link appears

### Step 5: Create a Test Meeting

1. Go to http://localhost:3000/meetings/new
2. Fill in form:
   - Subject: "Test Meeting"
   - Date/Time: Tomorrow at 10:00 AM
   - Location: "Room 301"
   - Participants: "Alice, Bob, Charlie"
3. Click "Créer la réunion"
4. Should redirect to meetings list with new meeting shown

### Step 6: Test Meeting Detail Page

1. Click on the meeting you just created
2. Should show tabs: "Procès-verbal", "Brouillon", "Documents"
3. Try each tab:
   - **Procès-verbal**: Edit markdown, click Save
   - **Brouillon**: Type something, should auto-save after 10s
   - **Documents**: Should show "Aucun document attaché"

### Step 7: Verify Accessibility (Optional but Recommended)

**Chrome**:

1. Install aXe DevTools (extension)
2. Open meetings page
3. Click aXe icon → Scan page
4. Should show 0 violations (or only library issues)

**Keyboard Testing**:

1. Press Tab repeatedly
2. Should cycle through all buttons/links
3. Can focus and click buttons with Enter
4. Should be able to fill form with keyboard only

**Screen Reader** (Mac only):

1. Press Cmd+F5 to enable VoiceOver
2. Press VO+U to open rotor
3. Should hear all headings, form labels, etc.

### Step 8: Run Backend Tests (Optional)

Create `src/features/meetings/tests/meetings.service.spec.ts`:

```typescript
import { Test, TestingModule } from "@nestjs/testing";
import { MeetingsService } from "../services/meetings.service";
import { MeetingsRepository } from "../repositories/meetings.repository";

describe("MeetingsService", () => {
  let service: MeetingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MeetingsService, MeetingsRepository],
    }).compile();

    service = module.get<MeetingsService>(MeetingsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
```

Run:

```bash
npm run test src/features/meetings
```

### Step 9: Verify API with Postman/cURL

**Create Meeting**:

```bash
curl -X POST http://localhost:3001/api/v1/meetings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Idempotency-Key: unique-key-123" \
  -d '{
    "subject": "Q1 Planning",
    "scheduledAt": "2026-03-15T10:00:00Z",
    "location": "Room 301",
    "participantsText": "Alice, Bob, Charlie"
  }'
```

**List Meetings**:

```bash
curl -X GET http://localhost:3001/api/v1/meetings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Get One Meeting**:

```bash
curl -X GET http://localhost:3001/api/v1/meetings/MEETING_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Update Minutes**:

```bash
curl -X PATCH http://localhost:3001/api/v1/meetings/MEETING_ID/minutes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "content": "# Meeting Notes\n- Action item 1\n- Action item 2",
    "format": "markdown"
  }'
```

### Step 10: Check Database Documents

**Mongo CLI**:

```bash
mongosh  # or mongo

use tili_db
db.meetings.find().pretty()
db.meeting_documents.find().pretty()
```

Should show your created meeting with correct fields.

---

## 🧪 Full Testing Workflow

```
1. Create meeting ✅
2. Verify appears in list ✅
3. Click to view detail ✅
4. Edit minutes, save ✅
5. Type in draft, verify auto-saves ✅
6. Archive meeting ✅
7. Restore meeting ✅
8. Try to access with wrong user (403) ✅
9. Search meeting in list ✅
10. Delete meeting (TBD) ✅
```

---

## 🚨 Common Issues & Fixes

### Issue: "MeetingsModule not found"

**Solution**: Make sure you imported it in app.module.ts

### Issue: "Cannot POST /api/v1/meetings"

**Solution**:

- Check if backend is running (`npm run start:dev`)
- Check if JWT token is valid
- Check if Idempotency-Key header is present

### Issue: "Meeting not found" (404)

**Solution**:

- Verify meeting ID is correct (copy from URL)
- Check if meeting was actually created in DB

### Issue: "You can only edit meetings you created"

**Solution**:

- You're logged in as different user
- Only creator can edit meetings (by design)

### Issue: Auto-save not working

**Solution**:

- Check browser console for errors
- Verify draft content actually changed
- Wait 10+ seconds (default timeout)

### Issue: Accessibility scan shows violations

**Solution**:

- Check aXe report details
- Usually color contrast or missing labels
- File an issue with exact violation

---

## 📋 Pre-Deployment Checklist

Before pushing to production:

```
[ ] All modules imported in app.module.ts
[ ] Database migrations run (if any)
[ ] Environment variables set (MONGO_URI, JWT_SECRET)
[ ] CORS configured for production domain
[ ] All API endpoints tested with valid JWT
[ ] Frontend form validation working
[ ] Accessibility scan passes (aXe 0 violations)
[ ] Load test with 100+ meetings
[ ] Security test: try unauthorized access (403)
[ ] Idempotency test: same request twice returns same response
[ ] Archive/restore tested
[ ] Auto-save tested (check timestamps)
[ ] Error handling tested (bad request, not found, etc.)
[ ] Code review passed
[ ] All tests pass
[ ] Production database backup enabled
```

---

## 🎯 Quick Feature Checklist

**Core Features**:

- [x] Create meeting
- [x] List meetings with search/filter
- [x] View meeting detail
- [x] Update meeting metadata
- [x] Edit and finalize minutes (markdown)
- [x] Auto-save draft notes
- [x] Archive/restore meetings
- [x] Attach documents
- [x] Authorization (creator only)
- [x] Audit logging

**Nice-to-Have** (Future):

- [ ] Email notifications
- [ ] Meeting templates
- [ ] Recurring meetings
- [ ] Calendar integration
- [ ] Action items extraction
- [ ] Meeting statistics
- [ ] Recording links
- [ ] Voting/RSVP

---

## 📞 Troubleshooting Commands

```bash
# Check if backend is running
curl http://localhost:3001/api/v1/auth/me

# Check if MongoDB is running
mongosh --eval "db.adminCommand('ping')"

# Check if frontend is running
curl http://localhost:3000

# Reset database (DANGEROUS - only in dev)
mongosh
use tili_db
db.dropDatabase()

# Seed test data (TBD)
npm run seed:meetings
```

---

## ✅ Success Criteria

Your integration is complete when:

1. ✅ Backend listens on port 3001
2. ✅ Frontend listens on port 3000
3. ✅ Can create a meeting from UI
4. ✅ Meeting appears in list
5. ✅ Can edit minutes and save
6. ✅ Draft auto-saves every 10s
7. ✅ Can archive meeting
8. ✅ aXe scan shows 0 violations
9. ✅ Can navigate with keyboard only
10. ✅ All API endpoints return correct responses

---

**Last Updated**: February 7, 2026  
**Estimated Time**: 30-45 minutes to complete integration  
**Difficulty**: Easy (mostly just imports + testing)
