# Database Schema Plan (Sprint 1)

This document outlines the planned database collection schemas for **BarberSaaS**.

---

## 1. `users` Collection

Stores account details, authentication credentials, and system roles.

| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | Primary Key |
| `name` | String | Full name of the user |
| `email` | String | Unique email address |
| `password` | String | Hashed password |
| `role` | String | `owner`, `admin`, `barber`, `customer` |
| `phone` | String | Optional contact phone number |
| `avatar` | String | Optional image URL |
| `isVerified` | Boolean | Account verification status |
| `createdAt` | Date | Creation timestamp |
| `updatedAt` | Date | Last update timestamp |

---

## 2. `shops` Collection

Stores business information for barber shops registered on the platform.

| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | Primary Key |
| `name` | String | Business name |
| `slug` | String | Unique URL slug |
| `ownerId` | ObjectId | Ref to `users` collection |
| `phone` | String | Shop phone number |
| `email` | String | Shop email address |
| `address` | Object | `{ street, city, state, zipCode, country }` |
| `workingHours` | Array | Daily schedule objects `{ day, openTime, closeTime, isOpen }` |
| `status` | String | `active`, `suspended`, `inactive` |
| `createdAt` | Date | Creation timestamp |
| `updatedAt` | Date | Last update timestamp |

---

## 3. `employees` Collection

Stores staff and barber profiles linked to a specific shop.

| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | Primary Key |
| `shopId` | ObjectId | Ref to `shops` collection |
| `userId` | ObjectId | Ref to `users` collection |
| `displayName` | String | Name displayed on booking menu |
| `specialties` | Array of Strings | E.g. `['Fade', 'Beard Trim', 'Haircut']` |
| `commissionRate` | Number | Optional percentage |
| `schedule` | Array | Custom working hours/shifts |
| `isActive` | Boolean | Active employment status |
| `createdAt` | Date | Creation timestamp |
| `updatedAt` | Date | Last update timestamp |

---

## 4. `customers` Collection

Stores customer client profiles and shop interaction metrics.

| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | Primary Key |
| `shopId` | ObjectId | Ref to `shops` collection |
| `userId` | ObjectId | Optional Ref to `users` collection |
| `name` | String | Customer full name |
| `phone` | String | Customer phone number |
| `email` | String | Customer email |
| `notes` | String | Internal notes (e.g. preferences) |
| `totalVisits` | Number | Lifetime appointment count |
| `createdAt` | Date | Creation timestamp |
| `updatedAt` | Date | Last update timestamp |

---

## 5. `appointments` Collection

Stores booking slots, services requested, assigned staff, and status.

| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | Primary Key |
| `shopId` | ObjectId | Ref to `shops` collection |
| `customerId` | ObjectId | Ref to `customers` collection |
| `employeeId` | ObjectId | Ref to `employees` collection |
| `services` | Array | Array of `{ serviceId, name, price, durationMinutes }` |
| `startTime` | Date | Appointment start time |
| `endTime` | Date | Appointment end time |
| `status` | String | `pending`, `confirmed`, `completed`, `cancelled`, `no_show` |
| `totalPrice` | Number | Total cost of booking |
| `notes` | String | Special customer instructions |
| `createdAt` | Date | Creation timestamp |
| `updatedAt` | Date | Last update timestamp |
