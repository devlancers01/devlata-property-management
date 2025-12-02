# Devlata Property Management – Admin Panel

**Property Booking • Customer Management • Sales • Expenses • Staff • Calendar**

A full-stack property management system built with **Next.js + Firebase**, designed for villa/stay operations requiring customer bookings, calendar blocking, sales tracking, expenses, staff management, and **RBAC-based admin access**.

---

## 📌 Table of Contents

* [Overview](#overview)
* [Features](#features)
* [Tech Stack](#tech-stack)
* [Project Structure](#project-structure)
* [Firestore Data Model](#firestore-data-model)
* [Environment Variables](#environment-variables)
* [Installation](#installation)
* [Running the Project](#running-the-project)
* [Developer Guidelines](#developer-guidelines)
* [Cloud Functions](#cloud-functions)
* [Cleanup Automation](#cleanup-automation)
* [RBAC Roles](#rbac-roles)
* [Prerequisites](#prerequisites)
* [Conventions](#conventions)

---

## 🚀 Overview

The **Devlata Property Management Admin Panel** helps automate operational workflows for multi-day villa stays, supporting:

* **Customer bookings**
* **Group member handling**
* **Calendar blocking**
* **Sales calculations**
* **Staff salary & advances**
* **Monthly/yearly expenses**
* **RBAC + authentication**
* **Document uploads** (ID proofs, receipts)
* **Automated cleanup scripts**
* **Fast search + filters**

The system ensures **no double-booking**, **accurate sales reporting**, and **clear expense tracking**.

---

## ⭐ Features

### 1. Dashboard

* Key metrics
* Booking stats
* Pending payments
* Revenue vs expenses
* Alerts & notifications

### 2. Customer Management

* Lead → Customer conversion
* Manual booking entry
* Group member management
* ID proof uploads
* Payment tracking (**advance, part, final, extra, cancellation**)
* Custom cancellation charges

### 3. Booking Calendar

* Daily blocking
* Auto-block on booking
* Prevent overlapping bookings
* **Same-day checkout → check-in allowed**
* Click-to-view customer details
* WhatsApp quick messaging (template-driven)

### 4. Sales

* Real-time income
* Monthly & daily summaries
* **Expense-deducted net profit**
* Pending settlements
* Graphs & analytics

### 5. Expenses

* Monthly + Annual expenses
* Categories: **food, maintenance, misc, other**
* Receipt upload
* Partial payment support for annual expenses

### 6. Staff Management

* Staff profiles
* Salary tracking
* Advances & miscellaneous expenses
* Leave tracking

### 7. RBAC Access

Roles:

* **Admin**
* **Manager**
* **Staff**
* **Viewer**

### 8. Automated Cleanup

* Delete expense receipts older than **3 months**
* Delete ID proofs older than **12 months**
* Retention duration configurable in settings