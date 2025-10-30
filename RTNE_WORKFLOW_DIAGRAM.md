# RTNE System Workflow Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         PROSPECT FINDER                          │
│                      (Main Application)                          │
└─────────────────────────────────────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
         ┌──────────▼──────────┐   ┌─────────▼──────────┐
         │   REGULAR USERS     │   │   RTNP USER        │
         │   (Agents)          │   │   + ADMIN          │
         └──────────┬──────────┘   └─────────┬──────────┘
                    │                         │
         ┌──────────▼──────────┐   ┌─────────▼──────────┐
         │   /rtne             │   │   /rtnp            │
         │   Personal Sheet    │   │   Dashboard        │
         └──────────┬──────────┘   └─────────┬──────────┘
                    │                         │
                    │                         │
         ┌──────────▼──────────┐   ┌─────────▼──────────┐
         │  Paste LinkedIn     │   │  View All Projects │
         │  URLs in rows       │   │  - Hungerbox       │
         │                     │   │  - DTSS            │
         │  Auto-saves to DB   │   │  - DC (Hyd)        │
         │  with:              │   │  - etc.            │
         │  - user_id          │   │                    │
         │  - project_name     │   │  Click project →   │
         │  - row_number       │   └─────────┬──────────┘
         └──────────┬──────────┘             │
                    │                         │
                    │              ┌──────────▼──────────┐
                    │              │  /rtnp/project/     │
                    │              │  {projectName}      │
                    │              │                     │
                    │              │  Combined Sheet:    │
                    │              │  All users' data    │
                    │              │  for this project   │
                    │              └──────────┬──────────┘
                    │                         │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   rtne_requests TABLE   │
                    │   (Supabase Database)   │
                    └─────────────────────────┘
```

## User Flow Comparison

### Regular User (Agent) Flow
```
1. Login → Dashboard
         ↓
2. Click RTNE button
         ↓
3. See personal sheet (100 rows)
         ↓
4. Paste LinkedIn URLs
         ↓
5. Data auto-saves
         ↓
6. Wait for RTNP to fill details
         ↓
7. See completed data in their sheet
```

### RTNP User Flow
```
1. Login → Dashboard
         ↓
2. Click "RTNP Dashboard" button
         ↓
3. See all projects with counts:
   ┌─────────────────────────┐
   │ Hungerbox               │
   │ 🔴 10 pending           │
   │ ✅ 25 completed         │
   └─────────────────────────┘
   ┌─────────────────────────┐
   │ DTSS                    │
   │ 🔴 5 pending            │
   │ ✅ 15 completed         │
   └─────────────────────────┘
         ↓
4. Click project (e.g., Hungerbox)
         ↓
5. See combined sheet:
   ┌──────────────────────────────────────────────┐
   │ Row | User    | LinkedIn URL | Name | City  │
   ├──────────────────────────────────────────────┤
   │ 1   | Agent1  | linkedin.com | [  ] | [  ]  │
   │ 2   | Agent1  | linkedin.com | [  ] | [  ]  │
   │ 3   | Agent1  | linkedin.com | [  ] | [  ]  │
   │ 1   | Agent2  | linkedin.com | [  ] | [  ]  │
   │ 2   | Agent2  | linkedin.com | [  ] | [  ]  │
   │ 3   | Agent2  | linkedin.com | [  ] | [  ]  │
   │ 4   | Agent2  | linkedin.com | [  ] | [  ]  │
   │ 1   | Agent3  | linkedin.com | [  ] | [  ]  │
   │ 2   | Agent3  | linkedin.com | [  ] | [  ]  │
   │ 3   | Agent3  | linkedin.com | [  ] | [  ]  │
   └──────────────────────────────────────────────┘
         ↓
6. Fill in contact details
         ↓
7. Click "Done" button
         ↓
8. Request marked as completed
         ↓
9. Back to dashboard (counts updated)
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    PROJECT: HUNGERBOX                        │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   ┌────▼────┐           ┌────▼────┐          ┌────▼────┐
   │ Agent 1 │           │ Agent 2 │          │ Agent 3 │
   │ 3 URLs  │           │ 4 URLs  │          │ 3 URLs  │
   └────┬────┘           └────┬────┘          └────┬────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │  rtne_requests    │
                    │  (10 total rows)  │
                    │                   │
                    │  All marked as    │
                    │  status='pending' │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │   RTNP Dashboard  │
                    │                   │
                    │  Hungerbox:       │
                    │  🔴 10 pending    │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │  RTNP clicks      │
                    │  Hungerbox        │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │  Combined Sheet   │
                    │  Shows all 10     │
                    │  requests         │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │  RTNP fills data  │
                    │  Marks complete   │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │  rtne_requests    │
                    │  status='completed'│
                    └─────────┬─────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   ┌────▼────┐           ┌────▼────┐          ┌────▼────┐
   │ Agent 1 │           │ Agent 2 │          │ Agent 3 │
   │ Sees    │           │ Sees    │          │ Sees    │
   │ completed│          │ completed│         │ completed│
   │ data    │           │ data    │          │ data    │
   └─────────┘           └─────────┘          └─────────┘
```

## View Modes Comparison

### Sheet View (Excel-like)
```
┌────────────────────────────────────────────────────────────────┐
│ Row │ User   │ Status  │ LinkedIn │ Name │ City │ Job │ ... │ │
├────────────────────────────────────────────────────────────────┤
│  1  │ Agent1 │ Pending │ [URL]    │ [  ] │ [  ] │ [  ] │ ... │ │
│  2  │ Agent1 │ Pending │ [URL]    │ [  ] │ [  ] │ [  ] │ ... │ │
│  3  │ Agent2 │ Pending │ [URL]    │ [  ] │ [  ] │ [  ] │ ... │ │
│  4  │ Agent2 │ Pending │ [URL]    │ [  ] │ [  ] │ [  ] │ ... │ │
│  5  │ Agent3 │ Done    │ [URL]    │ John │ NYC  │ CEO │ ... │ │
└────────────────────────────────────────────────────────────────┘
✅ Best for: Bulk processing, quick editing
```

### Card View (Detailed)
```
┌─────────────────────────────────────────────────────────────┐
│ 🔴 PENDING REQUESTS (4)                                     │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 👤 Agent1 | Row 1                    [Mark Complete ✓] │ │
│ │                                                         │ │
│ │ LinkedIn: [URL]                                         │ │
│ │ Name: [          ]  City: [          ]                 │ │
│ │ Job:  [          ]  Company: [          ]              │ │
│ │ Email: [          ] Phone: [          ]                │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 👤 Agent1 | Row 2                    [Mark Complete ✓] │ │
│ │ ...                                                     │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ ✅ COMPLETED REQUESTS (1)                                   │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 👤 Agent3 | Row 5                    ✅ Completed       │ │
│ │                                                         │ │
│ │ Name: John Doe    City: New York                       │ │
│ │ Company: ABC Corp Phone: +1234567890                   │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
✅ Best for: Detailed review, complex requests
```

## Security Model

```
┌─────────────────────────────────────────────────────────────┐
│                    rtne_requests TABLE                       │
│                    (Row Level Security)                      │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   ┌────▼────┐           ┌────▼────┐          ┌────▼────┐
   │ Agent 1 │           │   RTNP  │          │  Admin  │
   │         │           │         │          │         │
   │ Can:    │           │ Can:    │          │ Can:    │
   │ ✅ View │           │ ✅ View │          │ ✅ View │
   │   own   │           │   all   │          │   all   │
   │ ✅ Insert│          │ ✅ Update│         │ ✅ Update│
   │   own   │           │   all   │          │   all   │
   │ ✅ Delete│          │ ✅ Complete│       │ ✅ All  │
   │   own   │           │   all   │          │   admin │
   │         │           │         │          │   ops   │
   │ Cannot: │           │ Cannot: │          │         │
   │ ❌ View │           │ ❌ Delete│         │         │
   │   others│           │   requests│        │         │
   └─────────┘           └─────────┘          └─────────┘
```

## Real-World Example

```
SCENARIO: Monday Morning, 9:00 AM

Hungerbox Team (5 agents) needs 50 contact numbers

┌─────────────────────────────────────────────────────────────┐
│ 9:00 AM - Agents start working                              │
├─────────────────────────────────────────────────────────────┤
│ Agent 1: Pastes 10 LinkedIn URLs                            │
│ Agent 2: Pastes 10 LinkedIn URLs                            │
│ Agent 3: Pastes 10 LinkedIn URLs                            │
│ Agent 4: Pastes 10 LinkedIn URLs                            │
│ Agent 5: Pastes 10 LinkedIn URLs                            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 9:05 AM - RTNP checks dashboard                             │
├─────────────────────────────────────────────────────────────┤
│ Sees: Hungerbox - 🔴 50 pending requests                    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 9:06 AM - RTNP opens Hungerbox project                      │
├─────────────────────────────────────────────────────────────┤
│ Sees combined sheet with all 50 requests                    │
│ Each row shows which agent submitted it                     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 9:10 AM - 11:00 AM - RTNP works on requests                 │
├─────────────────────────────────────────────────────────────┤
│ Opens LinkedIn profiles                                     │
│ Fills in contact information                                │
│ Marks each as complete                                      │
│ Auto-save keeps data safe                                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 11:00 AM - All requests completed                           │
├─────────────────────────────────────────────────────────────┤
│ Dashboard shows: Hungerbox - ✅ 50 completed                │
│ Each agent sees their completed data in their sheet         │
│ Team can now use the contact information                    │
└─────────────────────────────────────────────────────────────┘

RESULT: 50 contacts processed in 2 hours, all organized by project
```

---

This visual guide helps understand how the RTNE system connects agents, projects, and the RTNP user in a streamlined workflow.
