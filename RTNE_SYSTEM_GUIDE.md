# Real-Time Number Entry (RTNE) System Guide

## Overview
The RTNE system streamlines the process of collecting and providing real-time contact information across multiple projects. It connects agents who need contact details with a dedicated Real-Time Number Provider (RTNP).

## System Architecture

### 1. User Roles

#### Regular Users (Agents)
- Assigned to specific projects (Hungerbox, DTSS, DC, etc.)
- Can submit LinkedIn URLs for contact information
- View only their own RTNE sheet
- Access via `/rtne` page

#### RTNP User (realtimenumberprovider@amplior.com)
- Dedicated role for providing contact information
- Views all projects and their pending requests
- Can see combined data from all users in each project
- Access via `/rtnp` dashboard

#### Admin
- Full access to all features
- Can view RTNP dashboard
- Manages users and projects

### 2. How It Works

#### For Agents (Regular Users):
1. Navigate to RTNE page (`/rtne`)
2. Paste LinkedIn URLs in their personal sheet
3. System automatically saves data to database
4. Each row is tracked with a row number
5. Data is associated with their user ID and project

#### For RTNP User:
1. Login with `realtimenumberprovider@amplior.com`
2. Dashboard shows all projects with pending request counts
3. Click on any project to view combined sheet
4. See all users' requests for that project in one place
5. Fill in contact details (name, city, job title, company, email, phone)
6. Mark requests as completed when done

#### For Admin:
1. Can access RTNP dashboard via "RTNP Dashboard" button in navbar
2. Monitor all projects and requests
3. Same capabilities as RTNP user

### 3. Database Structure

#### rtne_requests Table
```sql
- id: UUID (primary key)
- project_name: TEXT (e.g., "Hungerbox", "DTSS")
- user_id: UUID (who submitted the request)
- user_name: TEXT (display name)
- linkedin_url: TEXT (the LinkedIn profile URL)
- full_name: TEXT (filled by RTNP)
- city: TEXT (filled by RTNP)
- job_title: TEXT (filled by RTNP)
- company_name: TEXT (filled by RTNP)
- email_address: TEXT (filled by RTNP)
- primary_phone: TEXT (filled by RTNP)
- status: TEXT ('pending' or 'completed')
- row_number: INTEGER (persistent row position)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
- completed_at: TIMESTAMP
- completed_by: UUID
```

### 4. Key Features

#### Project-Based Organization
- All projects from users table are displayed on RTNP dashboard
- Each project shows pending and completed request counts
- Projects are sorted alphabetically

#### Real-Time Auto-Save
- Changes are automatically saved after 1 second of no typing
- No manual save button needed
- Works for both agents and RTNP user

#### Persistent Row Numbers
- Each request maintains its row number
- Ensures data stays in the correct position
- Makes it easy to reference specific entries

#### Two View Modes (RTNP Dashboard)
1. **Sheet View** (Default)
   - Excel-like table layout
   - All data in one scrollable view
   - Quick editing and completion
   - Best for bulk processing

2. **Card View**
   - Detailed card layout
   - Separated pending and completed sections
   - Better for reviewing individual requests

### 5. Access URLs

- **Agent RTNE Page**: `/rtne`
- **RTNP Dashboard**: `/rtnp`
- **Project View**: `/rtnp/project/{projectName}`

### 6. Security (RLS Policies)

#### rtne_requests Table Policies:
- RTNP and admins can view all requests
- Users can view only their own requests
- Users can insert their own requests
- RTNP and admins can update all requests
- Users can delete only their own pending requests

### 7. Workflow Example

**Scenario**: Hungerbox team needs 10 contact numbers

1. **Agent 1** (Hungerbox project):
   - Opens `/rtne`
   - Pastes 3 LinkedIn URLs in rows 1-3
   - Data auto-saves

2. **Agent 2** (Hungerbox project):
   - Opens `/rtne`
   - Pastes 4 LinkedIn URLs in rows 1-4
   - Data auto-saves

3. **Agent 3** (Hungerbox project):
   - Opens `/rtne`
   - Pastes 3 LinkedIn URLs in rows 1-3
   - Data auto-saves

4. **RTNP User**:
   - Opens `/rtnp` dashboard
   - Sees "Hungerbox: 10 pending requests"
   - Clicks on Hungerbox project
   - Views combined sheet with all 10 requests
   - Sees which agent submitted each request
   - Fills in contact details for each
   - Marks each as completed when done

5. **Result**:
   - All agents can see their completed requests
   - RTNP dashboard shows "Hungerbox: 0 pending, 10 completed"
   - Data is organized and tracked

### 8. Navigation

#### For RTNP User/Admin:
- "RTNP Dashboard" button appears in navbar (purple button)
- Click to access dashboard
- Dashboard shows all projects
- Click any project to view its sheet

#### For Regular Users:
- Access RTNE via main navigation
- See only their own sheet
- Submit requests via RTNE button

### 9. Benefits

1. **Centralized**: All projects in one dashboard
2. **Organized**: Project-based grouping
3. **Efficient**: Combined view of all users' requests
4. **Trackable**: Row numbers and user attribution
5. **Real-time**: Auto-save functionality
6. **Flexible**: Two view modes for different workflows
7. **Secure**: Role-based access control

### 10. Future Enhancements

Potential improvements:
- Bulk import from CSV
- Export completed requests
- Request priority levels
- Time tracking for completion
- Performance metrics
- Notification system
- Search and filter capabilities
