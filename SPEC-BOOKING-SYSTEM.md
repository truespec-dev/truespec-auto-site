# True Spec Auto Garage — Booking & Scheduling System Spec

---

## 1. Overview

Full-featured appointment booking system with smart calendar, cross-shop coordination, PIN-based admin access, and customer notifications. Designed for minimal ongoing cost (~$1–5/month) and easy extensibility for future shop partners.

---

## 2. Shop Routing Rules

### Auto Shop Services

- Oil Change
- Brakes
- Tune-Up
- Suspension
- Alignment
- Inspection
- Other (manually assigned by Admin)

### Tire Center Services

- Tires

### "Other" Category

- Customer selects "Other" when their service isn't listed
- Routes to **Auto Shop** by default
- Father or his manager can reassign to Tire Center if needed from admin dashboard

---

## 3. Linked Sub-Appointment Model

### Core Concept

One customer request with services spanning both shops is internally split into **two linked sub-appointments** — one per shop. The customer sees a single request; the admin dashboard shows both sub-appointments with a visual connector.

### Flow

1. Customer submits request with mixed services (e.g., Oil Change + Tires)
2. System identifies which services belong to Auto Shop and which to Tire Center
3. System checks capacity at both shops for the customer's preferred date/time
4. System finds the best overlapping window (e.g., Auto Shop at 9:00 AM, Tire Center at 11:00 AM)
5. Both sub-appointments go to "Pending Approval" for their respective shops
6. Each shop independently approves, declines, or reschedules their portion
7. Customer receives coordinated confirmation or partial decline notification

### Capacity Rules

- A time slot shows available if **either** shop has capacity
- A slot shows fully booked only when **both** shops are at capacity
- Max 3 appointments per time slot per shop (customer-facing limit)

### Admin Capacity Override

- When admin reaches 3 bookings in a timeslot, a **warning appears**: *"This slot is at capacity (3/3). Are you sure you want to add another appointment?"*
- Admin can **override and schedule anyway** — no hard limit
- Override is logged in the appointment record for accountability
- Customer-facing booking still caps at 3 (no override available)

### Admin Outside-Hours Scheduling

- Admin dashboard shows **shop-specific hours** (not combined customer-facing hours):
  - Auto Shop: Mon–Fri 8:00 AM – 6:00 PM, Sat 9:00 AM – 2:00 PM, Sun Closed
  - Tire Center: Mon–Sun 7:30 AM – 7:00 PM
- If admin selects a time outside that shop's hours, a **warning appears**: *"This is outside Auto Shop business hours. Are you sure you want to schedule here?"*
- Admin can **override and schedule anyway**
- Override is logged in the appointment record

---

## 4. Approval & Decline Flows

### Both Shops Approve

- Customer receives: *"Your Auto Shop services are confirmed for [time] and Tire Center services for [time] on [date]."*
- Dashboard shows: ✅ Auto Shop: Approved | ✅ Tire Center: Approved

### One Shop Approves, Other Declines

- Declining shop selects a reason (Parts unavailable, Scheduling conflict [with sub-options], Unable to perform work on this vehicle, Too far out, Other)
- Customer receives **Pending Approval** message:
  > *"We can complete part of your service on [date]. Unfortunately, [Shop Name] is unable to perform [service] due to [reason]. Would you like to proceed with [remaining shop] services only, or would you prefer to look elsewhere?"*
- Dashboard shows: ✅ Auto Shop: Approved | ❌ Tire Center: Declined (with reason)
- Customer can Accept (proceeds with approved portion only) or Reject (closes entire request)

### Both Shops Decline

- Customer receives full decline with explanation for each shop
- Dashboard shows: ❌ Auto Shop: Declined | ❌ Tire Center: Declined

### Partial Decline → Customer Accepts Remaining Services

- Original request is closed
- If customer later wants the declined services, they submit a new request
- Admin can optionally create a "linked rebooking" reference in the dashboard

---

## 5. Reschedule Flow

### Shop-Initiated Reschedule

1. Father/tire tech enters new proposed time
2. Sub-appointment status changes to **"Pending Approval"**
3. Customer receives notification with new proposed time
4. Customer can Approve or Reject
5. If Reject, customer can propose a different time or call the shop

### Cross-Shop Reschedule Coordination

- When one shop reschedules their portion, the other shop is notified
- Dashboard shows: *"Auto Shop proposed new time: [time]. Tire Center: [current status]"*
- Both shops should coordinate timing for same-day service

---

## 6. Notification System

### Customer Notifications (Email + SMS)

- **Submission confirmation:** "Thank you for scheduling with True Spec Auto Garage! Your request for [service] on [date] during [slot] has been received and will be reviewed shortly. You will be notified with a confirmed appointment time."
- **Full approval:** Confirmation with both shop times (if cross-shop)
- **Partial decline:** Pending Approval with options (see Section 4)
- **Full decline:** Explanation for each shop's decline reason
- **Reschedule request:** New proposed time with approve/reject option

### Shop Notifications (Admin Dashboard)

- **New request:** New sub-appointment assigned to their shop
- **Cross-shop alert:** "This is a cross-shop request. The customer also has services pending at [other shop]."
- **Action by other shop:** Real-time dashboard update when the other shop acts
- **Notes/coordination:** Shared notes thread visible to both shops on linked requests

---

## 7. Admin Dashboard Architecture

### Separate Login URLs


| Role                   | URL               | Visible to Customer-Facing Nav |
| ---------------------- | ----------------- | ------------------------------ |
| **Auto Shop**          | `/admin`          | No                             |
| **Tire Center**        | `/admin-tire`     | No                             |
| **Site Admin (Owner)** | `/admin-internal` | No (hidden, different URL)     |


### Role Permissions

#### Auto Shop Admin (Father or Shop Manager)

- **Full Admin access** — all scheduling, customer management, and dashboard capabilities
- View/Approve/Decline/Reschedule Auto Shop sub-appointments
- View linked Tire Center sub-appointments (read-only)
- View shared notes on cross-shop requests
- Add notes visible to Tire Center on cross-shop requests
- Access Customer File System (CRM) — create/edit/view customer profiles
- Manual booking for walk-ins and phone calls
- Override capacity limits (warns at 3, allows override)
- Schedule outside business hours (shows Auto Shop hours, warns but allows)
- Manage specials
- Manage Tire Center PIN (if acting as shop manager)
- Cannot reset Site Admin PIN

#### Tire Center (Tire Tech)

- View/Approve/Decline/Reschedule Tire Center sub-appointments
- View linked Auto Shop sub-appointments (read-only)
- View shared notes on cross-shop requests
- Add notes visible to Auto Shop on cross-shop requests
- Access Customer File System (CRM) for Tire Center customers
- Manual booking for walk-ins and phone calls
- Override capacity limits (warns at 3, allows override)
- Schedule outside business hours (shows Tire Center hours, warns but allows)
- Cannot manage Auto Shop PIN, specials, or site content

#### Site Admin (Owner — you)

- Full access to everything — all shops, all appointments, all customers
- Approve/Decline/Reschedule any sub-appointment
- Reassign services between shops (e.g., move Inspection to Tire Center)
- Route "Other" services to the appropriate shop
- Manage specials (CRUD via Google Sheet)
- Manage site content
- Reset/change any shop's PIN
- Override slot capacity limits
- Access all customer files across both shops
- View all notifications and logs

### Dashboard Layout

```
┌─────────────────────────────────────────────────────┐
│  PENDING APPROVALS                                  │
│  ┌─────────────────────────────────────────────┐    │
│  │ 🔗 Cross-Shop Request — John's 2024 Honda   │    │
│  │ Services: Oil Change (Auto), Tires (Tire)   │    │
│  │ Preferred: Sat Jan 18, Morning              │    │
│  │                                             │    │
│  │ Auto Shop: [APPROVE] [DECLINE] [RESCHEDULE] │    │
│  │ Tire Center: [APPROVE] [DECLINE] [RESCHEDULE]│   │
│  │                                             │    │
│  │ 📝 Notes Thread:                            │    │
│  │   (Father) "I can have car ready by 11am"  │    │
│  │   (Tire Tech) "Booked after 11am works"    │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │ Oil Change Only — Jane's 2019 Ford          │    │
│  │ Preferred: Fri Jan 17, Afternoon            │    │
│  │ Auto Shop: [APPROVE] [DECLINE] [RESCHEDULE] │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

---

## 8. Manual Scheduling Dashboard (Walk-In / Phone)

### Purpose

Allow father or tire tech to manually book appointments for phone calls and walk-ins, using the same backend system as online bookings. Prevents double-booking across all channels.

### Access

- Accessible from within the admin dashboard (both Auto Shop and Tire Center)
- Single "New Appointment" button visible to both roles
- Opens a modal or dedicated panel with the same smart calendar and capacity checks used by the online booking form

### Manual Booking Flow

1. Shop clicks **"New Appointment"** in their dashboard
2. Enters customer info: Name, Phone, Email (optional for walk-ins), Vehicle (Year/Make/Model)
3. Selects service(s) from the same checkbox matrix used online
4. System auto-routes to the correct shop based on service selection
5. Smart calendar shows available slots (same capacity logic as online)
6. Shop selects date and time slot
7. Shop clicks **"Confirm Appointment"** — appointment is logged immediately as **Confirmed** (no pending approval needed since shop is booking directly)
8. Customer receives confirmation via email/SMS if contact info was provided

### Cross-Shop Manual Booking

- If a walk-in/phone customer needs services from both shops, the manual booking creates linked sub-appointments just like online
- Dashboard prompts: *"This customer needs services at both shops. Would you like to coordinate same-day scheduling?"*
- Both shops see the linked request and can coordinate via notes

### Dashboard Layout (Manual Booking Panel)

```
┌─────────────────────────────────────────────────────┐
│  NEW APPOINTMENT                                    │
│                                                     │
│  Customer: [Name         ]  Phone: [           ]    │
│  Email:    [                         ]              │
│  Vehicle:  [Year] [Make    ] [Model    ]           │
│                                                     │
│  SERVICE TYPE:                                      │
│  [✓] Oil Change  [ ] Brakes    [✓] Tires  [ ] Tune │
│  [ ] Suspension  [ ] Alignment [ ] Inspect [ ] Other│
│                                                     │
│  → Auto Shop (Oil Change) — Sat Jan 18              │
│  → Tire Center (Tires) — Sat Jan 18                │
│                                                     │
│  Preferred Date: [📅 calendar]  Slot: [Morning ▾]   │
│                                                     │
│  Available Slots:                                   │
│  ┌─────┬─────┬─────┬─────┐                         │
│  │ 8AM │ 9AM │10AM │11AM │  ← Auto Shop capacity   │
│  │ ✅  │ ✅  │ ⚠️  │ ✅  │                         │
│  ├─────┼─────┼─────┼─────┤                         │
│  │ 8AM │ 9AM │10AM │11AM │  ← Tire Center capacity │
│  │ ✅  │ ✅  │ ✅  │ ✅  │                         │
│  └─────┴─────┴─────┴─────┘                         │
│                                                     │
│  [CONFIRM APPOINTMENT]                              │
└─────────────────────────────────────────────────────┘
```

### Key Behaviors

- Manual appointments are logged as **Confirmed** immediately (skip "Pending Approval")
- Same capacity rules apply (max 3 per slot per shop)
- Same time slot constraints (Auto Shop Mon–Fri 8–6, Sat 9–2; Tire Center Mon–Sun 7:30–7)
- Customer notifications fire automatically if email/phone provided
- Walk-in customers without email/phone still get logged (for shop's internal tracking)
- Appointment source tagged as **"Manual"** in the system (vs **"Online"**) for reporting

---

## 9. Customer File System (CRM)

### Purpose
Industry-standard customer relationship management system for storing client info, vehicles, work history, and receipts. Accessible to all shop roles for their respective customers.

### Data Model

#### Customer Profile
```
┌─────────────────────────────────────────────────────┐
│  CUSTOMER PROFILE                                   │
│                                                     │
│  Name:        [First] [Last]                        │
│  Phone:       [(   )   -    ]                       │
│  Email:       [                         ]           │
│  Address:     [                         ]           │
│  Notes:       [                         ]           │
│  Created:     [date]    Last Visit: [date]          │
│  Shop:        [Auto Shop / Tire Center / Both]      │
│                                                     │
│  VEHICLES:                                          │
│  ┌─────────────────────────────────────────────┐    │
│  │ 2024 Honda Civic EX                        │    │
│  │ VIN: 2HGFC2F69RH...     [View/Edit]        │    │
│  │ ┌─────────────────────────────────────────┐ │    │
│  │ │ WORK HISTORY                           │ │    │
│  │ │ 01/18/2025 — Oil Change — Auto Shop    │ │    │
│  │ │ 01/18/2025 — Tires (4) — Tire Center  │ │    │
│  │ │ 12/02/2024 — Brake Pads — Auto Shop   │ │    │
│  │ └─────────────────────────────────────────┘ │    │
│  │                                             │    │
│  │ RECEIPTS:                                   │    │
│  │ [receipt_2025-01-18.pdf]  [View] [Download]│    │
│  │ [receipt_2024-12-02.pdf]  [View] [Download]│    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  [+ Add Vehicle]  [+ Add Receipt]  [+ New Service] │
└─────────────────────────────────────────────────────┘
```

### Duplicate Detection

When creating or editing a customer profile, system checks for matches:

| Field Checked | Match Type | Prompt |
|---------------|-----------|--------|
| Name + Phone | Exact | *"A customer with this name and phone already exists. Is this the same person?"* |
| Name + Email | Exact | *"A customer with this name and email already exists. Is this the same person?"* |
| Phone number | Exact | *"This phone number is already on file for [Name]. Is this the same person?"* |
| Email | Exact | *"This email is already on file for [Name]. Is this the same person?"* |
| Vehicle VIN | Exact | *"This VIN is already registered to [Name]. Is this the same vehicle?"* |
| Vehicle Year/Make/Model + Name | Fuzzy | *"We found a similar vehicle ([Year] [Make] [Model]) on file for [Name]. Is this the same vehicle?"* |

- If confirmed as same person → merge into existing profile
- If new person → create new profile
- Duplicate check runs on both **manual entry** and **online booking submission**

### Work History Logging

Every appointment (online or manual) automatically creates a work history entry:
- Date
- Service(s) performed
- Shop (Auto / Tire / Both)
- Technician notes (optional)
- Cost (optional)
- Linked appointment ID

### Receipt Management

- Admin can attach PDF/image receipts to customer profiles
- Receipts stored in Google Drive (linked via API) for cost-free storage
- Receipts viewable and downloadable from customer profile
- Optional: receipt auto-attached when appointment is marked complete

### Access by Role

| Role | Can View | Can Edit | Can Delete |
|------|----------|----------|------------|
| Auto Shop Admin | Auto Shop customers | Auto Shop customers | No (archive only) |
| Tire Center | Tire Center customers | Tire Center customers | No (archive only) |
| Site Admin | All customers | All customers | All customers |

### Dashboard Entry Points

- **From Appointment:** Click customer name → opens full profile
- **From Manual Booking:** Customer info auto-populates if existing match found
- **Search Bar:** Global search by name, phone, email, VIN, or vehicle description
- **Customers Tab:** Full customer list with filters (by shop, last visit, etc.)

### Visual Design

All CRM screens maintain the **early '50s print-ad aesthetic**:
- Cream/parchment backgrounds with charcoal borders
- Bebas Neue headers, Oswald body text
- Red accent for action buttons
- Notepad-style forms (ring-bound appearance for work history sections)
- Dashboard tabs styled as vintage file folder tabs

### Full UI Interface — No Google Access Needed

**The admin never needs to open Google Sheets or Google Drive directly.** Everything is handled through the custom-built dashboard interface:

| Task | Where It Happens | Google Behind the Scenes? |
|------|------------------|--------------------------|
| View customer list | Dashboard → Customers tab | Sheet read (automatic) |
| Create new customer | Dashboard → "New Customer" form | Sheet write (automatic) |
| Edit customer info | Dashboard → Customer profile → Edit | Sheet update (automatic) |
| Add vehicle | Dashboard → Customer profile → "+ Add Vehicle" | Sheet write (automatic) |
| Log work performed | Dashboard → Customer profile → "+ New Service" | Sheet write (automatic) |
| Upload receipt | Dashboard → "+ Add Receipt" → file picker | Drive upload (automatic) |
| View receipt | Dashboard → click receipt link | Drive URL opens in new tab |
| Search customers | Dashboard → search bar | Client-side filter (instant) |
| Duplicate check | Automatic on save | Client-side comparison (instant) |

The Google Sheet and Drive are **pure backend storage** — like a database that happens to be free. Father interacts with the dashboard UI only.

### Detailed Backend Breakdown

#### Google Sheet Structure (4 Tabs)

```
TAB: Customers
┌────┬───────────┬────────────┬─────────────────┬─────────────┬──────────┐
│ ID │ FirstName │ LastName   │ Phone           │ Email       │ Notes    │
├────┼───────────┼────────────┼─────────────────┼─────────────┼──────────┤
│ C01│ John      │ Smith      │ (303) 555-1234  │ j@email.com │          │
│ C02│ Maria     │ Garcia     │ (720) 555-5678  │ m@email.com │ Prefers  │
│    │           │            │                 │             │ morning  │
└────┴───────────┴────────────┴─────────────────┴─────────────┴──────────┘

TAB: Vehicles
┌────┬─────────┬──────┬─────────┬────────┬─────────────────────────┐
│ ID │ CustID  │ Year │ Make    │ Model  │ VIN                     │
├────┼─────────┼──────┼─────────┼────────┼─────────────────────────┤
│ V01│ C01     │ 2024 │ Honda   │ Civic  │ 2HGFC2F69RH...          │
│ V02│ C01     │ 2019 │ Toyota  │ Camry  │ 4T1BF1FK5KU...          │
│ V03│ C02     │ 2022 │ Ford    │ F-150  │ 1FTEW1EP5NK...          │
└────┴─────────┴──────┴─────────┴────────┴─────────────────────────┘

TAB: WorkHistory
┌────┬─────────┬─────────┬────────────┬──────────────────┬───────┐
│ ID │ CustID  │ VehID   │ Date       │ Services         │ Cost  │
├────┼─────────┼─────────┼────────────┼──────────────────┼───────┤
│ W01│ C01     │ V01     │ 2025-01-18 │ Oil Change       │ $45   │
│ W02│ C01     │ V01     │ 2025-01-18 │ Tires (4)        │ $620  │
│ W03│ C01     │ V02     │ 2024-12-02 │ Brake Pads       │ $180  │
└────┴─────────┴─────────┴────────────┴──────────────────┴───────┘

TAB: Appointments (shared with scheduling system)
┌────┬─────────┬─────────┬────────────┬──────────┬─────────┬──────────┐
│ ID │ CustID  │ VehID   │ Date       │ Time     │ Shop    │ Status   │
├────┼─────────┼─────────┼────────────┼──────────┼─────────┼──────────┤
│ A01│ C01     │ V01     │ 2025-02-01 │ 9:00 AM  │ Auto    │ Confirmed│
│ A02│ C01     │ V01     │ 2025-02-01 │ 11:00 AM │ Tire    │ Pending  │
└────┴─────────┴─────────┴────────────┴──────────┴─────────┴──────────┘
```

#### Duplicate Detection Flow

```
Customer enters info (online form or manual entry)
            │
            ▼
    ┌───────────────────┐
    │ Check Phone Match │──── Match found? ──→ Prompt: "Same person as [Name]?"
    └───────────────────┘                        │
            │ No match                           ├─ Yes → Use existing profile
            ▼                                    └─ No  → Continue
    ┌───────────────────┐
    │ Check Email Match │──── Match found? ──→ Prompt: "Same person as [Name]?"
    └───────────────────┘                        │
            │ No match                           ├─ Yes → Use existing profile
            ▼                                    └─ No  → Continue
    ┌───────────────────┐
    │ Check Name+Phone  │──── Match found? ──→ Prompt: "Same person?"
    │ Combo Match       │                        │
    └───────────────────┘                        ├─ Yes → Use existing profile
            │ No match                           └─ No  → Create new profile
            ▼
    ┌───────────────────┐
    │ Create New Profile│
    │ Assign next CustID│
    └───────────────────┘
```

#### Receipt Handling Flow

```
Admin uploads receipt (PDF/image)
            │
            ▼
    ┌───────────────────┐
    │ Upload to Google  │  ← Free 15GB storage
    │ Drive folder      │
    │ (per-customer)    │
    └───────────────────┘
            │
            ▼
    ┌───────────────────┐
    │ Store Drive URL   │  ← Just a URL string in WorkHistory sheet
    │ in WorkHistory    │
    │ Sheet             │
    └───────────────────┘
            │
            ▼
    ┌───────────────────┐
    │ View/Download     │  ← Click URL opens in new tab
    │ from Customer     │
    │ Profile           │
    └───────────────────┘
```

#### Cost Breakdown

| Component | Approach | Cost |
|-----------|----------|------|
| Data storage | Google Sheets (4 tabs) | Free |
| Receipt storage | Google Drive (15GB free) | Free |
| API access | Google Sheets API via Service Account | Free |
| Search/filtering | Client-side JS filtering of sheet data | Free |
| Duplicate detection | Client-side comparison on load | Free |
| No database needed | Sheets IS the database | $0 |
| No CRM subscription | We build it | $0 |

**The CRM adds zero additional monthly cost** — it's just more tabs in the same Google Sheet we're already using for appointments.

#### API Limits (Not a Concern)

Google Sheets API free tier allows:
- 300 requests per minute per project
- 60 requests per minute per user

For a small shop with 5-10 lookups per day, this is nowhere near the limit.

---

## 10. Extensibility — Future Shop Partners

### Architecture

- Each shop is a **role** with its own PIN, URL, and service routing
- Adding a new shop (Body Shop, Welder, Electrical Specialist, etc.) requires:
  1. Adding a new role to the auth system
  2. Creating a new admin URL (e.g., `/admin-body`)
  3. Mapping new services to the shop in the routing config
  4. Adding the shop to the capacity/availability system
  5. Updating the service type checkbox matrix on booking forms

### Service Routing Config (Google Sheet or JSON)

```
Service         | Shop          | Default
----------------|---------------|--------
Oil Change      | Auto Shop     | ✓
Brakes          | Auto Shop     | ✓
Tune-Up         | Auto Shop     | ✓
Suspension      | Auto Shop     | ✓
Alignment       | Auto Shop     | ✓
Inspection      | Auto Shop     | ✓ (reassignable to Tire)
Tires           | Tire Center   | ✓
Other           | Auto Shop      | ✓ (reassignable to Tire)
[future]Body    | Body Shop     | ✓
[future]Welding | Welding Shop  | ✓
```

### Admin Dashboard Extensibility

- Dashboard dynamically renders tabs/sections based on active shops
- When a new shop is added, it automatically appears in the admin interface
- Cross-shop coordination extends naturally to 3+ shops (e.g., Auto + Tire + Body)

---

## 11. Edge Cases


| Scenario                                                   | Handling                                                                                     |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Both shops decline different portions                      | Full decline message with each shop's reason                                                 |
| Slot fills up between submission and first approval        | Mark sub-appointment as "Slot No Longer Available", prompt shop to pick new time             |
| Customer selects "Other" only                              | Routes to Auto Shop by default; father can reassign to Tire Center                           |
| Customer selects only Tire services                        | Routes directly to Tire Center (no cross-shop logic)                                         |
| Customer selects only Auto services                        | Routes directly to Auto Shop (no cross-shop logic)                                           |
| Cross-shop request but only one shop has capacity that day | Notify customer: "We can do [Shop A] on [date]. [Shop B] would need a separate appointment." |
| Customer rejects reschedule proposal                       | Request closes, customer can call or submit new request                                      |
| 3+ shops in future (cross-shop coordination)               | System checks capacity across all relevant shops, links sub-appointments for each            |


---

## 12. Business Hours


| Shop        | Mon–Fri           | Saturday          | Sunday            |
| ----------- | ----------------- | ----------------- | ----------------- |
| Auto Shop   | 8:00 AM – 6:00 PM | 9:00 AM – 2:00 PM | Closed            |
| Tire Center | 7:30 AM – 7:00 PM | 7:30 AM – 7:00 PM | 7:30 AM – 7:00 PM |


### Customer Outside Hours

- If customer requests a time outside Auto Shop hours but within Tire Center hours:
  - System shows available time for Tire Center only
  - Message: "Note: Auto Shop is closed at this time. Only Tire Center services can be scheduled."
- If customer requests a time outside both shops' hours:
  - Warning message: "This is outside our business hours. We'll review your request and get back to you."

---

## 13. Technology Stack


| Component           | Technology                              | Cost             |
| ------------------- | --------------------------------------- | ---------------- |
| Frontend            | Static HTML/CSS/JS (Vite)               | Free             |
| Hosting             | Netlify                                 | Free tier        |
| Backend Functions   | Netlify Functions (serverless)          | Free tier        |
| Database            | Google Sheets (via Service Account API) | Free             |
| SMS Notifications   | Twilio                                  | ~$0.01/text      |
| Email Notifications | EmailJS                                 | Free (200/month) |
| Calendar UI         | Vanilla JS custom calendar              | Free             |
| **Total**           |                                         | **~$1–5/month**  |

### Account Reference

| Service    | Account                            | Purpose                                      |
| ---------- | ---------------------------------- | -------------------------------------------- |
| Google     | TrueSpecAutoScheduling@gmail.com   | Backend service account, Sheets API, notifications |
| GitHub     | *(TBD)*                            | Source code repo, auto-deploy to Netlify     |
| Netlify    | *(TBD — via GitHub login)*         | Hosting, serverless functions                |
| Twilio     | *(TBD)*                            | SMS notifications                            |
| EmailJS    | *(TBD)*                            | Email notifications                          |


---

## 14. Build Phases

### Phase 1 — Core Infrastructure

- [ ] Netlify configuration (`netlify.toml`, dependencies)
- [ ] Google Sheets integration (service account, API connection)
- [ ] PIN authentication system with role-based access
- [ ] Service routing configuration

### Phase 2 — Booking Page

- [ ] `book.html` with smart calendar
- [ ] Combined business hours display
- [ ] Service type selection with shop routing
- [ ] Form submission to Netlify Function
- [ ] Customer confirmation message (on-site, no redirect)

### Phase 3 — Admin Dashboard

- [ ] `admin.html` with role-based PIN login
- [ ] Separate URL for Site Admin (`/admin-internal`)
- [ ] Pending approvals queue with cross-shop indicators
- [ ] Approve/Decline/Reschedule actions
- [ ] Shared notes thread on cross-shop requests
- [ ] Real-time status updates across shops
- [ ] Manual Scheduling Dashboard (New Appointment panel, walk-in/phone booking)
- [ ] Manual appointment source tagging ("Manual" vs "Online")

### Phase 4 — Notifications

- [ ] Twilio SMS integration
- [ ] EmailJS email integration
- [ ] Customer notification templates (submission, approval, partial decline, full decline, reschedule)
- [ ] Shop notification templates (new request, cross-shop alert, other shop action)

### Phase 5 — Home Page Integration

- [ ] Home page Schedule Box AJAX submission (on-site confirmation, no redirect)
- [ ] Independent functionality from booking page

### Phase 6 — Specials Management

- [ ] Google Sheet CMS for specials
- [ ] Auto-expiry and reminder emails
- [ ] Admin CRUD interface

### Phase 7 — Remaining Pages

- [ ] Our Services
- [ ] Parts & Accessories
- [ ] About Us
- [ ] Contact

### Phase 8 — Monetization (Optional)

- [ ] Banner ad slots for automotive specific ads (Google AdSense)

---

## 15. Success Criteria

- [ ] Customer can submit a booking request from home page or booking page
- [ ] Mixed-service requests are split into linked sub-appointments
- [ ] Both shops see and act on their portions independently
- [ ] Cross-shop coordination is visible in dashboard with notes thread
- [ ] Manual booking panel allows walk-in/phone appointments with same capacity logic
- [ ] Manual appointments logged as "Confirmed" immediately with source tagged as "Manual"
- [ ] Customer notifications fire for manual bookings when contact info provided
- [ ] Partial declines result in clear "Pending Approval" for customer
- [ ] All notifications (email + SMS) fire correctly
- [ ] Admin (Site Admin) has full control from hidden URL
- [ ] System is extensible for future shop partners
- [ ] Total ongoing cost stays under $5/month