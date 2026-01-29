# BoroBepari — Product Requirements Document

## Executive Summary

### Platform Overview

**BoroBepari** is a multi-vendor B2B wholesale marketplace designed for Bangladeshi and South Asian commerce. The platform enables retailers, distributors, and resellers to discover verified suppliers, negotiate bulk pricing through RFQ workflows, place MOQ-based orders, and manage procurement—all in Bengali and English with BDT-first pricing.

Unlike B2C e-commerce platforms, BoroBepari focuses on wholesale transactions with features specifically designed for business buyers: tiered pricing, minimum order quantities, sample orders, partial deposits, and supplier verification systems that establish trust in high-value transactions.

### Target Users

**Primary Users (Buyers):**

- **Wholesale Buyers** — Retail chain owners, distributors, and resellers seeking reliable suppliers with competitive bulk pricing
- **Guest Buyers** — First-time business visitors exploring the platform before registration

**Secondary Users (Suppliers):**

- **Manufacturers & Wholesalers** — Factory operators and wholesale distributors expanding domestic B2B sales channels
- **Verified Suppliers** — KYC-verified businesses with trade licenses seeking qualified bulk buyers

**Platform Operators:**

- **Administrative Staff** — Super-admins managing platform configuration, user roles, and site-wide settings
- **Product Teams** — Catalog managers maintaining accurate inventory, pricing, and product information
- **Operations Teams** — Order managers and support staff handling fulfillment and dispute resolution

### Key Value Propositions

**For Buyers:**

1. **Verified Supplier Network** — KYC-verified suppliers with trade licenses, factory audits, and performance ratings reduce counterfeit risk
2. **Transparent Wholesale Pricing** — Tiered bulk pricing tables, MOQ indicators, and sample orders enable informed purchasing decisions
3. **Efficient Procurement** — RFQ workflow, negotiation tools, and one-click reorder reduce procurement time by 70%
4. **Flexible B2B Payments** — Full payment, 30% deposit, and escrow protection accommodate business cash flow needs
5. **Bengali-First Experience** — Native language support increases accessibility for Tier-2/3 city businesses

**For Suppliers:**

1. **Qualified Lead Generation** — Access to verified business buyers without middlemen or trade fair dependency
2. **Operational Dashboard** — Product management, order tracking, RFQ inbox, and payout analytics in one interface
3. **Payment Security** — Escrow model with 3-day release window ensures guaranteed payments
4. **Trust Signals** — Verification badges, reviews, and performance metrics build credibility

**For Platform:**

1. **Commission Revenue** — 8-12% commission on transactions with verified payment processing
2. **Network Effects** — Growing supplier catalog attracts buyers; growing buyer base attracts suppliers
3. **Data Insights** — Transaction data enables market intelligence and platform optimization

### Platform Scope

This document specifies frontend interfaces, user experiences, and user-facing workflows for BoroBepari. All features are designed for responsive web (PWA-ready) with Bengali and English language support.

### Accessibility & Performance Commitment

BoroBepari targets **WCAG 2.1 Level AA compliance** for all public-facing pages, **fully responsive design** across mobile, tablet, and desktop devices, and **sub-3-second page loads** on 4G connections.

---

## Product Vision and Goals

### Vision Statement

**"Become Bangladesh's most trusted B2B wholesale marketplace—where every retailer can access verified suppliers, transparent pricing, and reliable delivery without leaving their shop."**

BoroBepari envisions a future where wholesale procurement is:

- **Digital-First** — No more monthly trips to Dhaka markets for product sourcing
- **Trustworthy** — Verified suppliers, transparent pricing, and escrow protection
- **Accessible** — Bengali-first UX serving Tier-2/3 cities alongside metro areas
- **Efficient** — RFQ workflows and reorder tools that save hours per procurement cycle

### Strategic Goals

### Goal 1: Buyer Acquisition & Retention

**Objective:** Convert first-time visitors into active, repeat wholesale buyers.

**Key Results:**

- Guest-to-registered buyer conversion rate ≥ 35%
- Repeat order rate ≥ 45% within 60 days of first order
- Buyer satisfaction score (CSAT) ≥ 4.2/5
- Cart abandonment rate ≤ 30%

**Success Metrics:**

- Time from registration to first order ≤ 48 hours
- Average orders per active buyer per month ≥ 2
- Net Promoter Score (NPS) ≥ 40

### Goal 2: Supplier Network Growth

**Objective:** Build a verified supplier network that attracts and retains quality wholesale buyers.

**Key Results:**

- Verified supplier count ≥ 500 (MVP), ≥ 5,000 (12 months)
- Supplier verification rate ≥ 70% (of registered suppliers)
- RFQ response rate ≥ 60% within 24 hours
- Supplier retention rate ≥ 80% (12-month active)

**Success Metrics:**

- Average products per supplier ≥ 25
- Supplier GMV growth ≥ 15% month-over-month
- Quote-to-order conversion rate ≥ 30%

### Goal 3: Platform Performance & Accessibility

**Objective:** Deliver fast, accessible experiences across all devices to maximize reach.

**Key Results:**

- Lighthouse Performance Score ≥ 85
- WCAG 2.1 AA compliance: 100% of buyer-facing pages
- Mobile traffic conversion rate ≥ desktop conversion rate
- Page load time (First Contentful Paint) ≤ 2 seconds on 4G

**Success Metrics:**

- Time to Interactive (TTI) ≤ 4 seconds
- Bengali language usage ≥ 60% of sessions
- Mobile bounce rate ≤ 35%

### Goal 4: Transaction Volume & Revenue

**Objective:** Drive sustainable GMV growth through increased order value and frequency.

**Key Results:**

- Monthly GMV ≥ ৳10 Cr (MVP), ≥ ৳50 Cr (12 months)
- Average Order Value (AOV) ≥ ৳25,000
- Payment success rate ≥ 97%
- Commission revenue margin ≥ 10%

**Success Metrics:**

- Orders per day ≥ 100 (MVP), ≥ 1,000 (12 months)
- RFQ volume ≥ 500/month
- Escrow dispute rate ≤ 3%

### Success Criteria Summary

BoroBepari will be considered successful when:

1. **Buyers can source products 70% faster** than traditional wholesale market visits
2. **Suppliers receive qualified leads** that convert at 30%+ to orders
3. **The platform achieves ৳10 Cr+ monthly GMV** within 6 months of launch
4. **Bengali-first UX drives adoption** in Tier-2/3 cities at rates equal to metro areas
5. **Verification systems reduce disputes** to under 3% of transactions

---

## Epic Overview

This section organizes BoroBepari's user stories into **8 strategic epics**. Story points use the Fibonacci sequence (1, 2, 3, 5, 8, 13, 21) where higher numbers indicate greater complexity.

### Story Point Estimation Guide

- **1-2 points:** Simple UI components, basic forms, static pages
- **3-5 points:** Moderate complexity with multiple states, filters, or data flows
- **8-13 points:** Complex features requiring integrations, real-time updates, or multi-step workflows
- **21+ points:** Highly complex features with multiple sub-systems or novel functionality

---

### Epic 1: Product Discovery & Catalog

**Priority:** P0 (Must Have)
**Total Story Points:** 18

**Description:**
Enable buyers to efficiently discover, search, filter, and evaluate wholesale products. This epic forms the foundation of the buyer journey and directly impacts conversion.

**Business Value:**
Strong product discovery drives buyer engagement and reduces bounce rates. Search, filtering, and detailed product pages are prerequisites for all transactions.

**User Stories:**

| Story # | Story Name                                               | Points | Priority |
| ------- | -------------------------------------------------------- | ------ | -------- |
| 1       | Browse & Search (Categories, Keywords, Filters)          | 5      | P0       |
| 2       | Product Detail Page (Images, Tiered Pricing, MOQ, Specs) | 5      | P0       |
| 3       | Quick View Modal                                         | 3      | P0       |
| 4       | Wishlist Management                                      | 2      | P1       |
| 5       | Guest Browsing & Session Persistence                     | 3      | P0       |

**Key Features:**

- Category navigation with mega-menu
- Real-time search with filters (price, MOQ, location, verification)
- Product cards with image, title, price, MOQ, supplier badge
- Tiered pricing tables with volume discounts
- Sample order toggle (1-5 units)
- Stock status indicators
- Wishlist with "Add to Cart" and sharing
- Guest cart persistence (7-day local storage)

**Success Metrics:**

- Search-to-product click-through rate ≥ 40%
- Product detail page bounce rate ≤ 35%
- Quick view to cart conversion ≥ 25%

---

### Epic 2: Buyer Account & Verification

**Priority:** P0 (Must Have)
**Total Story Points:** 11

**Description:**
Provide secure identity management for buyers with registration, profile management, saved addresses, and optional business verification for enhanced trust.

**Business Value:**
Reduces friction for first-time buyers while building long-term relationships. Guest checkout increases initial conversion; account features drive retention.

**User Stories:**

| Story # | Story Name                               | Points | Priority |
| ------- | ---------------------------------------- | ------ | -------- |
| 6       | Buyer Registration & Login (OTP, Social) | 5      | P0       |
| 7       | Profile & Address Management             | 3      | P0       |
| 8       | Guest Checkout                           | 3      | P0       |

**Key Features:**

- Mobile OTP registration and verification
- Social login (Google, Facebook)
- Profile editing with business information
- Multiple saved delivery addresses with default
- Password reset and security settings
- Guest checkout with post-purchase account creation offer

**Success Metrics:**

- Registration completion rate ≥ 80%
- Guest-to-registered conversion rate ≥ 35%
- Address book usage ≥ 60% of registered buyers

---

### Epic 3: RFQ & Quotation Workflow

**Priority:** P0 (Must Have)
**Total Story Points:** 16

**Description:**
Enable buyers to request quotes for bulk orders and suppliers to respond with pricing, creating a negotiation workflow that converts to orders.

**Business Value:**
RFQ is the core B2B differentiator. It enables price negotiation, builds buyer-supplier relationships, and captures high-intent purchase signals.

**User Stories:**

| Story # | Story Name                                          | Points | Priority |
| ------- | --------------------------------------------------- | ------ | -------- |
| 9       | RFQ Submission (Product, Quantity, Target Price)    | 5      | P0       |
| 10      | Supplier Quote Response                             | 5      | P0       |
| 11      | Quote Management (Accept, Reject, Counter, Convert) | 6      | P0       |

**Key Features:**

- "Request Quote" button on PDP and supplier pages
- RFQ form with product, quantity, target price, notes, attachments
- Buyer RFQ inbox with status tabs (Pending, Quoted, Accepted, Expired)
- Supplier quote form with price, validity, terms
- Counter-offer workflow
- Quote-to-order conversion with locked pricing
- Expiry countdown and notifications

**Success Metrics:**

- RFQ-to-quote response rate ≥ 60% (within 24 hours)
- Quote-to-order conversion rate ≥ 30%
- Average negotiation rounds ≤ 2

---

### Epic 4: Cart & Checkout

**Priority:** P0 (Must Have)
**Total Story Points:** 14

**Description:**
Enable cart management and B2B-optimized checkout with MOQ enforcement, partial deposits, and multiple payment options.

**Business Value:**
Direct revenue driver. Cart and checkout experience are highest-impact areas for conversion. B2B payment flexibility (deposits, escrow) differentiates from B2C platforms.

**User Stories:**

| Story # | Story Name                                   | Points | Priority |
| ------- | -------------------------------------------- | ------ | -------- |
| 12      | Cart Management (View, Edit, MOQ Validation) | 5      | P0       |
| 13      | Checkout Flow (Address, Delivery, Payment)   | 5      | P0       |
| 14      | Payment Processing (bKash, Deposit, Escrow)  | 4      | P0       |

**Key Features:**

- Multi-supplier cart with per-supplier subtotals
- Real-time quantity adjustment with MOQ warnings
- Coupon code application
- Checkout steps: Address → Payment → Review
- Payment options: Full payment, 30% deposit, Pay on Delivery (verified buyers)
- PO number input (optional)
- Order confirmation with email/SMS receipt
- Escrow hold with 3-day release window

**Success Metrics:**

- Cart abandonment rate ≤ 30%
- Checkout completion rate ≥ 70%
- Payment success rate ≥ 97%

---

### Epic 5: Order Management & Tracking

**Priority:** P0 (Must Have)
**Total Story Points:** 12

**Description:**
Provide complete post-purchase visibility with order history, status tracking, reorder functionality, and invoice access.

**Business Value:**
Post-purchase experience drives retention and repeat orders. Order transparency reduces support burden and builds trust.

**User Stories:**

| Story # | Story Name                 | Points | Priority |
| ------- | -------------------------- | ------ | -------- |
| 15      | Order History & Details    | 4      | P0       |
| 16      | Order Status Tracking      | 4      | P0       |
| 17      | Reorder & Invoice Download | 4      | P1       |

**Key Features:**

- Order list with status filtering and search
- Order detail with item list, quantities, prices, delivery info
- Visual status timeline (Placed → Confirmed → Shipped → Delivered)
- Real-time status updates via notifications
- One-click reorder with current pricing verification
- PDF invoice generation and download

**Success Metrics:**

- Order status check frequency ≥ 2 per order
- Reorder rate ≥ 30% of completed orders
- Invoice download rate ≥ 50%

---

### Epic 6: Supplier Dashboard & Tools

**Priority:** P0 (Must Have)
**Total Story Points:** 21

**Description:**
Provide suppliers with comprehensive tools to manage products, respond to RFQs, fulfill orders, and track business performance.

**Business Value:**
Supplier tools determine catalog quality and RFQ responsiveness. Dashboard analytics help suppliers optimize and grow, increasing platform stickiness.

**User Stories:**

| Story # | Story Name                                  | Points | Priority |
| ------- | ------------------------------------------- | ------ | -------- |
| 18      | Supplier Registration & KYC                 | 5      | P0       |
| 19      | Product Management (Add, Edit, Bulk Import) | 8      | P0       |
| 20      | Order & RFQ Management                      | 5      | P0       |
| 21      | Analytics & Payouts                         | 3      | P1       |

**Key Features:**

- Supplier registration with business profile
- KYC document upload (Trade License, NID)
- Product form with images, tiered pricing, MOQ, variants
- Bulk product import via CSV/Excel
- Low-stock alerts and inventory management
- RFQ inbox with quote response workflow
- Order management with status updates
- GMV analytics, conversion rates, date range filters
- Payout history and withdrawal requests

**Success Metrics:**

- Product data accuracy ≥ 99%
- RFQ response time ≤ 24 hours (average)
- Supplier dashboard daily active rate ≥ 60%

---

### Epic 7: Admin Console & Operations

**Priority:** P0 (Must Have)
**Total Story Points:** 16

**Description:**
Enable platform administrators to manage users, review KYC submissions, moderate content, resolve disputes, and configure platform settings.

**Business Value:**
Admin tools ensure platform quality, trust, and compliance. KYC review and dispute resolution directly impact buyer and supplier confidence.

**User Stories:**

| Story # | Story Name                  | Points | Priority |
| ------- | --------------------------- | ------ | -------- |
| 22      | Admin Dashboard & Analytics | 5      | P0       |
| 23      | User & Supplier Management  | 5      | P0       |
| 24      | KYC Review & Verification   | 3      | P0       |
| 25      | Dispute Resolution          | 3      | P1       |

**Key Features:**

- Real-time dashboard (GMV, users, KYC queue, disputes)
- User management with search, filter, suspend
- Supplier management with verification status
- KYC document review with approve/reject workflow
- Dispute panel with evidence review and resolution options
- Commission and fee configuration
- Site settings (maintenance mode, delivery limits)
- Audit log for all admin actions

**Success Metrics:**

- KYC review time ≤ 24 hours
- Dispute resolution time ≤ 72 hours
- Admin action audit coverage: 100%

---

### Epic 8: Notifications & Support

**Priority:** P1 (Should Have)
**Total Story Points:** 10

**Description:**
Provide multi-channel notifications for order updates and support communication for issue resolution.

**Business Value:**
Proactive notifications reduce support burden and increase buyer confidence. Support tools ensure issues are resolved quickly.

**User Stories:**

| Story # | Story Name                  | Points | Priority |
| ------- | --------------------------- | ------ | -------- |
| 26      | Multi-Channel Notifications | 4      | P0       |
| 27      | Reviews & Ratings           | 3      | P1       |
| 28      | Support & Help Center       | 3      | P1       |

**Key Features:**

- Email, SMS, and push notifications for order updates
- Notification preference management
- Stock alert notifications for wishlisted items
- Product review submission with photos
- Review display with sorting and helpful votes
- Help center with FAQs and guides
- Support ticket submission and tracking
- WhatsApp support link

**Success Metrics:**

- Notification delivery rate ≥ 98%
- Review submission rate ≥ 15% of delivered orders
- Support ticket resolution time ≤ 24 hours

---

### Epic Roadmap Summary

**Phase 1: Core Marketplace (MVP)**

- Epic 1: Product Discovery & Catalog
- Epic 2: Buyer Account & Verification
- Epic 4: Cart & Checkout
- Epic 6: Supplier Dashboard & Tools (registration, products)

**Phase 2: B2B Workflows**

- Epic 3: RFQ & Quotation Workflow
- Epic 5: Order Management & Tracking
- Epic 7: Admin Console & Operations

**Phase 3: Engagement & Growth**

- Epic 8: Notifications & Support
- Epic 6: Supplier Dashboard & Tools (analytics, payouts)

### Total Story Points Summary

| Priority         | Story Points   |
| ---------------- | -------------- |
| P0 (Must Have)   | 98 points      |
| P1 (Should Have) | 20 points      |
| **Grand Total**  | **118 points** |

---

## User Stories

### Epic 1: Product Discovery & Catalog

#### **Story 1: Browse & Search**

**Story:** As a **buyer**, I want to browse products by category, search with keywords, and apply filters so that I can discover wholesale products efficiently.

**Acceptance Criteria:**

- **Given** I visit the BoroBepari homepage, **when** the page loads, **then** I see featured products, promotional banners, category sidebar, and "Frequently Searched" cards.
- **Given** I click on a category (e.g., "Apparel & Accessories"), **when** the category page loads, **then** I see a grid of products with images, names, prices in BDT, MOQ labels, and supplier verification badges.
- **Given** I use the search bar, **when** I type a query and submit, **then** I see relevant products with options to filter by price range, MOQ range, supplier location, and verification status.
- **Given** I apply filters, **when** I select price range or MOQ, **then** the product grid updates within 500ms without page reload.
- **Given** I scroll through listings, **when** I reach the end, **then** more products load automatically (infinite scroll) or pagination controls appear.
- **Given** I want to change language, **when** I toggle Bengali/English, **then** all UI text updates without page reload.

---

#### **Story 2: Product Detail Page**

**Story:** As a **buyer**, I want to view detailed product information including images, tiered pricing, MOQ, specifications, and supplier information so that I can make informed wholesale purchasing decisions.

**Acceptance Criteria:**

- **Given** I click on a product, **when** the PDP loads, **then** I see high-quality images (with zoom/gallery), title, current price, original price (if discounted), MOQ, and stock status.
- **Given** I'm viewing a product, **when** I scroll to pricing section, **then** I see a tiered pricing table showing 3+ quantity ranges with per-unit prices.
- **Given** the product supports samples, **when** I toggle "Order Sample," **then** quantity selector allows 1-5 units at sample price.
- **Given** a product is out of stock, **when** I view it, **then** "Add to Cart" is disabled, "Out of Stock" displays in red, and "Notify Me" option appears.
- **Given** I want to evaluate the supplier, **when** I view supplier section, **then** I see supplier name (linked to profile), verification badge, response rate, and on-time delivery percentage.
- **Given** I scroll down, **when** I view tabs, **then** I see Overview, Specifications, Reviews, and Supplier Info tabs with relevant content.

---

#### **Story 3: Quick View Modal**

**Story:** As a **buyer**, I want to quick-view a product without leaving the listing page so that I can evaluate products faster while browsing.

**Acceptance Criteria:**

- **Given** I'm on a product listing, **when** I click the quick-view icon on a product card, **then** a modal opens with product image gallery, title, price, MOQ, quantity selector, and action buttons.
- **Given** the quick view modal is open, **when** I adjust quantity and click "Add to Cart," **then** the item is added, modal closes, and success toast appears.
- **Given** the quick view modal is open, **when** I click "View Full Details →," **then** the modal closes and full PDP loads.
- **Given** I'm on mobile, **when** quick view opens, **then** modal displays full-screen with touch-friendly controls.

---

#### **Story 4: Wishlist Management**

**Story:** As a **buyer**, I want to save products to a wishlist so that I can easily find and purchase them later.

**Acceptance Criteria:**

- **Given** I'm viewing a product, **when** I click the heart/wishlist icon, **then** the product is saved and icon changes to filled state.
- **Given** I'm logged in, **when** I navigate to "My Wishlist," **then** I see saved products with images, names, prices, MOQ, and availability status.
- **Given** I'm viewing my wishlist, **when** I click "Add to Cart" on an item, **then** the item is added to cart with quantity selector.
- **Given** I want to share my wishlist, **when** I click "Share," **then** I can copy link or share via WhatsApp/social media.

---

#### **Story 5: Guest Browsing & Session Persistence**

**Story:** As a **guest user**, I want to browse products and add items to cart without registering so that I can evaluate BoroBepari before committing.

**Acceptance Criteria:**

- **Given** I'm not signed in, **when** I visit BoroBepari, **then** I can browse categories, search, view product details, and see all pricing information.
- **Given** I want to add items as a guest, **when** I click "Add to Cart," **then** items are added to a guest session cart without requiring login.
- **Given** I have items in my guest cart, **when** I return within 7 days on the same device, **then** my cart persists with items and quantities intact.
- **Given** I try to access account features (wishlist, order history), **when** I click on them, **then** I'm prompted to "Login or Register" with benefit explanation.

---

### Epic 2: Buyer Account & Verification

#### **Story 6: Buyer Registration & Login**

**Story:** As a **buyer**, I want to register, login, and secure my account so that I can access personalized features and track my orders.

**Acceptance Criteria:**

- **Given** I'm a new user, **when** I click "Register," **then** I see a form for name, mobile number, email, and password with mobile OTP verification.
- **Given** I submit registration, **when** OTP is verified, **then** my account is created and I'm logged in automatically.
- **Given** I'm a returning user, **when** I click "Login," **then** I can sign in with mobile/email and password, with "Forgot Password" and social login options.
- **Given** I want to reset password, **when** I click "Forgot Password," **then** I receive OTP via SMS/email to set a new password.

---

#### **Story 7: Profile & Address Management**

**Story:** As a **buyer**, I want to manage my profile and delivery addresses so that checkout is faster and my information stays current.

**Acceptance Criteria:**

- **Given** I'm logged in, **when** I visit "My Account," **then** I can view and edit name, email, phone, and business information.
- **Given** I navigate to "Saved Addresses," **when** I click "Add Address," **then** I can enter address details, label (Home/Office/Warehouse), and set as default.
- **Given** I have multiple addresses, **when** I view the list, **then** I can edit, delete, or change the default address.

---

#### **Story 8: Guest Checkout**

**Story:** As a **guest user**, I want to complete a purchase without creating an account so that I can quickly place my first order.

**Acceptance Criteria:**

- **Given** I have items in my guest cart, **when** I click "Proceed to Checkout," **then** I see options for "Login/Register" or "Continue as Guest."
- **Given** I choose "Continue as Guest," **when** I proceed, **then** I must provide delivery address, contact phone/email, and payment details for this order only.
- **Given** I complete guest checkout, **when** the order is placed, **then** I receive confirmation email with order number and tracking link.
- **Given** I completed a guest order, **when** I view confirmation page, **then** I see option to "Create Account" to save my information for future orders.

---

### Epic 3: RFQ & Quotation Workflow

#### **Story 9: RFQ Submission**

**Story:** As a **buyer**, I want to submit a Request for Quote with my requirements so that I can negotiate pricing for bulk orders.

**Acceptance Criteria:**

- **Given** I'm on a PDP or supplier page, **when** I click "Request Quote," **then** an RFQ form opens with product pre-filled.
- **Given** the RFQ form is open, **when** I fill quantity, target price, delivery location, and notes, **then** I can submit the RFQ.
- **Given** I submit an RFQ, **when** submission succeeds, **then** I see confirmation with RFQ number and expected response time.
- **Given** I want to attach files, **when** I click "Attach Files," **then** I can upload images or documents (specs, designs).

---

#### **Story 10: Supplier Quote Response**

**Story:** As a **supplier**, I want to receive and respond to RFQs so that I can convert inquiries into orders.

**Acceptance Criteria:**

- **Given** a new RFQ is submitted, **when** it targets my product, **then** I receive notification (in-app + SMS) within 1 minute.
- **Given** I view an RFQ in my dashboard, **when** I click "Send Quote," **then** I see a form for unit price, total price, validity period, and terms.
- **Given** I submit a quote, **when** submission succeeds, **then** the buyer receives notification and sees my quote in their inbox.

---

#### **Story 11: Quote Management**

**Story:** As a **buyer**, I want to view, compare, accept, reject, or counter quotes so that I can complete negotiations and place orders.

**Acceptance Criteria:**

- **Given** I have quotes in my inbox, **when** I view a quote, **then** I see supplier name, quoted price, validity countdown, and terms.
- **Given** I want to accept a quote, **when** I click "Accept," **then** the quote status changes and "Place Order" button appears.
- **Given** I want to counter, **when** I click "Counter," **then** I can enter a new price and submit counter-offer to supplier.
- **Given** I click "Place Order" on accepted quote, **when** checkout loads, **then** the quoted price is locked and cannot be changed.
- **Given** a quote validity expires, **when** I view it, **then** status shows "Expired" and Accept is disabled.

---

### Epic 4: Cart & Checkout

#### **Story 12: Cart Management**

**Story:** As a **buyer**, I want to view my cart, update quantities, and see pricing details so that I can review my order before checkout.

**Acceptance Criteria:**

- **Given** I have items in cart, **when** I click the cart icon, **then** I see all items with images, names, prices, quantities, and line totals.
- **Given** I'm viewing cart, **when** I change quantity, **then** line total and order total update in real-time.
- **Given** an item quantity is below MOQ, **when** I view cart, **then** I see a warning message indicating minimum required quantity.
- **Given** I have a coupon code, **when** I enter and apply it, **then** discount is applied if valid, or error shows if invalid/expired.
- **Given** I'm viewing cart, **when** I check totals, **then** I see subtotal, delivery fee, discounts, and final total.

---

#### **Story 13: Checkout Flow**

**Story:** As a **buyer**, I want to select delivery address, choose payment method, and place my order so that I can complete my purchase.

**Acceptance Criteria:**

- **Given** I click "Proceed to Checkout," **when** checkout loads, **then** I see sections for delivery address, payment method, and order summary.
- **Given** I'm at checkout, **when** I select address, **then** I can choose from saved addresses or add a new one.
- **Given** I'm choosing payment, **when** I view options, **then** I see Full Payment, 30% Deposit, and Pay on Delivery (if eligible).
- **Given** I want to enter PO number, **when** I type in PO field, **then** it saves with the order for my reference.
- **Given** I review order summary, **when** all details are correct, **then** I can click "Place Order" to submit.

---

#### **Story 14: Payment Processing**

**Story:** As a **buyer**, I want to pay securely via bKash, card, or deposit so that my transaction is protected.

**Acceptance Criteria:**

- **Given** I select bKash payment, **when** I confirm, **then** I'm redirected to bKash for authentication and returned upon completion.
- **Given** I select 30% Deposit, **when** I confirm, **then** only deposit amount is charged; balance due on delivery displays clearly.
- **Given** payment succeeds, **when** confirmation page loads, **then** I see order number, summary, and "Track Order" button; email/SMS receipt is sent.
- **Given** payment fails, **when** error occurs, **then** I see clear error message with retry option.

---

### Epic 5: Order Management & Tracking

#### **Story 15: Order History & Details**

**Story:** As a **buyer**, I want to view my order history and details so that I can track my purchases and reference past orders.

**Acceptance Criteria:**

- **Given** I'm logged in, **when** I navigate to "My Orders," **then** I see all orders sorted by date with order number, date, total, and status.
- **Given** I'm viewing orders, **when** I filter by status, **then** list shows only matching orders.
- **Given** I click on an order, **when** detail page loads, **then** I see items, quantities, prices, delivery address, payment method, and status timeline.

---

#### **Story 16: Order Status Tracking**

**Story:** As a **buyer**, I want to track my order status in real-time so that I know when to expect delivery.

**Acceptance Criteria:**

- **Given** I have an active order, **when** I view order details, **then** I see a visual status timeline (Placed → Confirmed → Shipped → Delivered) with current stage highlighted.
- **Given** order status changes, **when** supplier updates it, **then** I receive notification and timeline updates in real-time.
- **Given** order is shipped, **when** tracking number is available, **then** I see courier name and tracking link.

---

#### **Story 17: Reorder & Invoice Download**

**Story:** As a **buyer**, I want to quickly reorder past purchases and download invoices so that I can save time and maintain records.

**Acceptance Criteria:**

- **Given** I view a completed order, **when** I click "Reorder," **then** all items are added to cart with current prices and availability checked.
- **Given** a reordered item is unavailable, **when** I view cart, **then** I see warning with alternative suggestions.
- **Given** I want an invoice, **when** I click "Download Invoice," **then** a PDF generates and downloads with order details, prices, and tax breakdown.

---

### Epic 6: Supplier Dashboard & Tools

#### **Story 18: Supplier Registration & KYC**

**Story:** As a **supplier**, I want to register and complete KYC verification so that I can sell on BoroBepari with verified status.

**Acceptance Criteria:**

- **Given** I'm a new supplier, **when** I click "Sell on BoroBepari," **then** I see registration form for business name, contact info, and mobile OTP verification.
- **Given** I'm registered, **when** I navigate to KYC section, **then** I can upload Trade License, NID, and bank details.
- **Given** I submit KYC documents, **when** upload succeeds, **then** status shows "Pending Review" and I receive confirmation.
- **Given** KYC is approved, **when** I view my profile, **then** "Verified Supplier" badge displays on my profile and products.

---

#### **Story 19: Product Management**

**Story:** As a **supplier**, I want to add, edit, and manage my product listings so that buyers can discover and purchase my products.

**Acceptance Criteria:**

- **Given** I'm in vendor dashboard, **when** I click "Add Product," **then** I see form for title, description, category, images, price tiers, MOQ, and stock.
- **Given** I'm filling product form, **when** I upload images, **then** I see previews with options to reorder, set primary, and delete.
- **Given** I enter tiered pricing, **when** I add tiers, **then** I can specify quantity ranges and per-unit prices for each tier.
- **Given** I save and publish, **when** product is submitted, **then** it appears in catalog within 5 minutes.
- **Given** I want to bulk import, **when** I upload CSV/Excel, **then** I see preview with validation errors highlighted before confirming.

---

#### **Story 20: Order & RFQ Management**

**Story:** As a **supplier**, I want to manage orders and respond to RFQs so that I can fulfill buyer requests efficiently.

**Acceptance Criteria:**

- **Given** I have new orders, **when** I view dashboard, **then** I see order queue with status, customer name, total, and date.
- **Given** I click on an order, **when** detail opens, **then** I see items, quantities, delivery address, and payment status.
- **Given** I want to update status, **when** I select new status and confirm, **then** status updates and buyer receives notification.
- **Given** I have RFQs, **when** I view RFQ inbox, **then** I see all RFQs with product, quantity, target price, and status tabs.

---

#### **Story 21: Analytics & Payouts**

**Story:** As a **supplier**, I want to view my sales analytics and manage payouts so that I can track performance and withdraw earnings.

**Acceptance Criteria:**

- **Given** I'm in dashboard overview, **when** I view stats, **then** I see GMV, order count, conversion rate for selected date range.
- **Given** I navigate to payouts, **when** I view balance, **then** I see available balance, pending escrow, and payout history.
- **Given** I want to withdraw, **when** I click "Request Withdrawal," **then** funds transfer to linked bank within 3 business days.

---

### Epic 7: Admin Console & Operations

#### **Story 22: Admin Dashboard & Analytics**

**Story:** As an **admin**, I want to view platform metrics and analytics so that I can monitor marketplace health.

**Acceptance Criteria:**

- **Given** I login as admin, **when** dashboard loads, **then** I see GMV, active users, pending KYC, open disputes with 15-minute refresh.
- **Given** I want detailed analytics, **when** I navigate to reports, **then** I can filter by date range and export CSV/PDF.

---

#### **Story 23: User & Supplier Management**

**Story:** As an **admin**, I want to manage users and suppliers so that I can maintain platform quality.

**Acceptance Criteria:**

- **Given** I navigate to users, **when** page loads, **then** I see data table with name, email, role, status, and registration date.
- **Given** I search for a user, **when** I enter query, **then** results filter by name, email, or phone.
- **Given** I want to suspend a supplier, **when** I click "Suspend," **then** supplier products are hidden and account locked; supplier notified.

---

#### **Story 24: KYC Review & Verification**

**Story:** As an **admin**, I want to review KYC submissions so that I can verify legitimate suppliers.

**Acceptance Criteria:**

- **Given** I navigate to KYC queue, **when** page loads, **then** I see pending submissions with supplier name, documents, and submission date.
- **Given** I review a submission, **when** I click "View Documents," **then** I see Trade License and NID images with zoom.
- **Given** documents are valid, **when** I click "Approve," **then** supplier receives verified badge and notification.
- **Given** documents are invalid, **when** I click "Reject" with reason, **then** supplier is notified with rejection reason.

---

#### **Story 25: Dispute Resolution**

**Story:** As an **admin**, I want to mediate disputes so that I can ensure fair resolution for buyers and suppliers.

**Acceptance Criteria:**

- **Given** I navigate to disputes, **when** page loads, **then** I see open disputes with order details, parties, and issue type.
- **Given** I review a dispute, **when** I view evidence, **then** I see messages, photos, and order timeline.
- **Given** I make a decision, **when** I select resolution (refund, reject, partial), **then** both parties are notified and escrow is processed accordingly.

---

### Epic 8: Notifications & Support

#### **Story 26: Multi-Channel Notifications**

**Story:** As a **buyer**, I want to receive order updates via email, SMS, and push so that I stay informed about my purchases.

**Acceptance Criteria:**

- **Given** I place an order, **when** status changes, **then** I receive notifications via my preferred channels.
- **Given** I want to manage preferences, **when** I go to notification settings, **then** I can toggle channels and notification types.
- **Given** an item I want is back in stock, **when** inventory updates, **then** I receive stock alert notification.

---

#### **Story 27: Reviews & Ratings**

**Story:** As a **buyer**, I want to submit and read product reviews so that I can share feedback and make informed decisions.

**Acceptance Criteria:**

- **Given** I received an order, **when** I view the product, **then** I see "Write a Review" button.
- **Given** I submit a review, **when** I rate 1-5 stars with text and optional photos, **then** review appears on product page.
- **Given** I'm viewing reviews, **when** I sort by "Most Helpful," **then** reviews reorder based on helpful votes.

---

#### **Story 28: Support & Help Center**

**Story:** As a **user**, I want to access help resources and contact support so that I can resolve issues quickly.

**Acceptance Criteria:**

- **Given** I need help, **when** I click "Help," **then** I see FAQs, guides, and contact options.
- **Given** I want to submit a ticket, **when** I fill the form, **then** I receive ticket number and can track status.
- **Given** I want quick support, **when** I click WhatsApp link, **then** WhatsApp opens with pre-filled message.

---

---

## Wireframes & Prototype

### Interactive Prototype

**Live Prototype:** [BoroBepari Prototype](https://preview--borobepari-wholesale.lovable.app/)

The interactive prototype demonstrates key user flows including homepage, product discovery, PDP with tiered pricing, quick view modal, RFQ workflow, cart, checkout, and supplier dashboard.

### Key Wireframe Specifications

#### Homepage Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│ HEADER                                                                  │
│ ┌─────────┐ ┌────────────────────────────┐ 🌐 BN/EN  🛒  Sign In       │
│ │  LOGO   │ │ 🔍 Search products...      │                              │
│ └─────────┘ └────────────────────────────┘                              │
├─────────────────────────────────────────────────────────────────────────┤
│ NAV: All Categories │ Featured │ Order Protection │ Sell on BoroBepari │
├─────────────────────────────────────────────────────────────────────────┤
│ ┌────────────┐ ┌───────────────────────────────────────────────────────┐│
│ │ CATEGORIES │ │ FREQUENTLY SEARCHED          POPULAR SUPPLIERS       ││
│ │ For You    │ │ ┌─────────┐ ┌─────────┐     ┌─────────────────────┐  ││
│ │ Apparel    │ │ │Watches  │ │Phones   │     │ Supplier Carousel   │  ││
│ │ Electronics│ │ └─────────┘ └─────────┘     └─────────────────────┘  ││
│ │ Sports     │ └───────────────────────────────────────────────────────┘│
│ └────────────┘                                                          │
│ ┌───────────────────────────────────────────────────────────────────────┐
│ │ 🟣 PROMOTIONAL BANNER — Low MOQ • 14-Day Dispatch • Custom Branding  │
│ └───────────────────────────────────────────────────────────────────────┘
│ RECOMMENDED FOR BUSINESS                                                │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│ │ [IMAGE]  │ │ [IMAGE]  │ │ [IMAGE]  │ │ [IMAGE]  │ │ [IMAGE]  │       │
│ │ BDT 389  │ │ BDT 2,445│ │ BDT 822  │ │ BDT 146  │ │ BDT 550  │       │
│ │ MOQ: 100 │ │ MOQ: 2   │ │ MOQ: 5   │ │ MOQ: 50  │ │ MOQ: 10  │       │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
├─────────────────────────────────────────────────────────────────────────┤
│ TOP RANKING              │ NEW ARRIVALS                                 │
│ ┌───────┐ ┌───────┐      │ ┌───────┐ ┌───────┐ ┌───────┐              │
│ │ 🏆TOP │ │ 🏆TOP │      │ │ [IMG] │ │ [IMG] │ │ [IMG] │              │
│ └───────┘ └───────┘      │ └───────┘ └───────┘ └───────┘              │
├─────────────────────────────────────────────────────────────────────────┤
│ DISCOVER MORE: Clothing → │ Electronics → │ Fashion → │ Home →        │
├─────────────────────────────────────────────────────────────────────────┤
│ FOOTER: Company │ Marketplace │ Programs │ Help   [bKash][Nagad][VISA] │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Product Detail Page

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Home > Apparel > Winter Clothing > Product Name                         │
├─────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────┐ ┌─────────────────────────────────────┐ │
│ │                             │ │ Premium Leather Phone Case 2024     │ │
│ │      PRODUCT IMAGE          │ │                                     │ │
│ │      (with zoom)            │ │ Sold by: Dhaka Leather Co. ✓        │ │
│ │                             │ │ ★★★★☆ 4.2 (1,247 reviews)           │ │
│ │  ┌───┐ ┌───┐ ┌───┐ ┌───┐   │ │                                     │ │
│ │  │ 1 │ │ 2 │ │ 3 │ │ 4 │   │ │ ৳450  ৳750  SAVE 40%               │ │
│ │  └───┘ └───┘ └───┘ └───┘   │ │                                     │ │
│ └─────────────────────────────┘ │ ┌─────────────────────────────────┐ │ │
│                                 │ │ TIERED PRICING                  │ │ │
│                                 │ │ Qty 1-49    │ ৳450/unit         │ │ │
│                                 │ │ Qty 50-199  │ ৳380/unit ← ACTIVE│ │ │
│                                 │ │ Qty 200+    │ ৳320/unit         │ │ │
│                                 │ └─────────────────────────────────┘ │ │
│                                 │                                     │ │
│                                 │ MOQ: 20 units                       │ │
│                                 │ 🟢 In Stock (5,000+ available)      │ │
│                                 │                                     │ │
│                                 │ Quantity: [−] 100 [+]               │ │
│                                 │ ☐ Order Sample (1-5 @ ৳550)         │ │
│                                 │                                     │ │
│                                 │ [  Add to Cart  ] [  Buy Now  ]     │ │
│                                 │ [  Request Quote  ]                 │ │
│                                 │                                     │ │
│                                 │ 🚚 Estimated: 5-7 days to Dhaka     │ │
│                                 └─────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────┤
│ [Overview] [Specifications] [Reviews (1,247)] [Supplier Info]           │
│ ───────────────────────────────────────────────────────────────────     │
│ Premium quality leather phone case designed for durability...           │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Quick View Modal

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                     [X] │
│ ┌─────────────────────────────┐ ┌─────────────────────────────────────┐ │
│ │                             │ │ Product Title Here                  │ │
│ │      PRODUCT IMAGE          │ │ Sold by: Supplier Name →            │ │
│ │                             │ │ ★★★☆☆ 3.7 (855 reviews)             │ │
│ │  ┌─────┐ ┌─────┐ ┌─────┐   │ │                                     │ │
│ │  │ [1] │ │ [2] │ │ [3] │   │ │ ৳19,376  ৳48,440  SAVE 60%         │ │
│ │  └─────┘ └─────┘ └─────┘   │ │                                     │ │
│ │  ┌──────────────────────┐  │ │ Quantity: [−] 1 [+]                 │ │
│ │  │     -60% OFF         │  │ │ MOQ: 10 units                       │ │
│ │  └──────────────────────┘  │ │                                     │ │
│ └─────────────────────────────┘ │ 🟢 In Stock                         │ │
│                                 │                                     │ │
│                                 │ [♡] [  Add to Cart  ] [ Buy Now ]  │ │
│                                 │                                     │ │
│                                 │ 🚚 Free Shipping • Est. 7 days      │ │
│                                 │                                     │ │
│                                 │ View Full Details →                 │ │
│                                 └─────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

#### RFQ Flow

```
RFQ SUBMISSION                        QUOTE INBOX
┌─────────────────────────────┐      ┌─────────────────────────────────────┐
│ Request for Quote           │      │ My Quotes                           │
│                             │      │ [All] [Pending] [Quoted] [Accepted] │
│ Product: Leather Case       │      ├─────────────────────────────────────┤
│ Quantity: [    500    ]     │      │ ┌─────────────────────────────────┐ │
│ Target Price: [৳300/unit]   │      │ │ Leather Case — RFQ #12345       │ │
│ Delivery: [Chattogram ▼]    │      │ │ Qty: 500 │ Target: ৳300         │ │
│                             │      │ │                                 │ │
│ Notes:                      │      │ │ 💬 QUOTE RECEIVED               │ │
│ ┌─────────────────────────┐ │      │ │ Offer: ৳320/unit                │ │
│ │ Need custom logo...     │ │      │ │ Valid: 5 days                   │ │
│ └─────────────────────────┘ │      │ │                                 │ │
│                             │      │ │ [Accept] [Counter] [Reject]     │ │
│ [Attach Files]              │      │ └─────────────────────────────────┘ │
│                             │      │                                     │
│ [    Submit RFQ    ]        │      │ ┌─────────────────────────────────┐ │
└─────────────────────────────┘      │ │ T-Shirts Bulk — RFQ #12344      │ │
                                     │ │ ⏳ Pending response...           │ │
                                     │ └─────────────────────────────────┘ │
                                     └─────────────────────────────────────┘
```

#### Vendor Dashboard

```
┌─────────────────────────────────────────────────────────────────────────┐
│ VENDOR PORTAL                                    Dhaka Leather Co. ✓    │
├───────────────┬─────────────────────────────────────────────────────────┤
│               │                                                         │
│ 📊 Overview   │  Welcome back!                                          │
│               │                                                         │
│ 📦 Products   │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│               │  │ GMV (30d)   │ │ Orders      │ │ Conversion  │       │
│ 🛒 Orders     │  │ ৳4,52,000   │ │ 47          │ │ 3.2%        │       │
│               │  │ ↑ 12%       │ │ ↑ 8%        │ │ ↓ 0.5%      │       │
│ 📝 RFQs       │  └─────────────┘ └─────────────┘ └─────────────┘       │
│               │                                                         │
│ 💬 Messages   │  ┌─────────────────────┐ ┌─────────────────────┐       │
│               │  │ 🔔 PENDING          │ │ 📦 RECENT ORDERS    │       │
│ 💰 Payouts    │  │ • 3 new RFQs        │ │ #ORD-5678 - ৳38,000 │       │
│               │  │ • 2 orders to ship  │ │ #ORD-5677 - ৳12,500 │       │
│ ⚙️ Settings   │  │ • 5 messages        │ │ #ORD-5676 - ৳8,200  │       │
│               │  └─────────────────────┘ └─────────────────────┘       │
└───────────────┴─────────────────────────────────────────────────────────┘
```

---

## Technical Requirements

### Responsive Design

**Requirement:** All pages must be fully responsive across mobile, tablet, and desktop.

**Acceptance Criteria:**

- **Given** a user accesses BoroBepari on any device, **when** the page loads, **then** layout adapts to screen size with breakpoints (mobile: <768px, tablet: 768-1024px, desktop: >1024px).
- **Given** a user views product images, **when** images load, **then** they are served in appropriate resolutions based on device.
- **Given** dashboards are accessed on mobile, **when** loaded, **then** navigation collapses to hamburger menu with touch-friendly controls.

### Accessibility (WCAG 2.1 AA)

**Requirement:** Public-facing pages must meet WCAG 2.1 Level AA standards.

**Acceptance Criteria:**

- **Given** a user navigates with keyboard, **when** they use Tab/Shift+Tab, **then** all interactive elements are focusable in logical order with visible focus indicators.
- **Given** a screen reader user accesses pages, **when** content is read, **then** images have alt text, forms have labels, and semantic HTML is used.
- **Given** a user resizes text to 200%, **when** viewing content, **then** it remains readable without horizontal scrolling.

### Performance

**Requirement:** Pages must load quickly and provide smooth interactions.

**Acceptance Criteria:**

- **Given** a user on 4G connection accesses homepage, **when** page loads, **then** First Contentful Paint (FCP) ≤ 2 seconds and Time to Interactive (TTI) ≤ 4 seconds.
- **Given** a user scrolls through listings, **when** reaching the end, **then** additional products load seamlessly via lazy loading.
- **Given** images are displayed, **when** pages load, **then** images are optimized (WebP with fallbacks) and lazy-loaded below the fold.

### Browser Support

**Requirement:** BoroBepari must function correctly on all modern browsers.

**Acceptance Criteria:**

- **Given** a user on Chrome (v90+), Firefox (v88+), Safari (v14+), or Edge (v90+), **when** using any feature, **then** all functionality works without browser-specific bugs.
- **Given** a user on mobile Safari (iOS 14+) or Chrome mobile (Android 9+), **when** accessing the site, **then** all touch interactions work correctly.

### Localization

**Requirement:** Platform must support Bengali and English with seamless switching.

**Acceptance Criteria:**

- **Given** a user toggles language, **when** switch is clicked, **then** all UI text updates without page reload.
- **Given** Bengali is selected, **when** viewing prices, **then** BDT currency displays with proper formatting (৳).
- **Given** user preference is saved, **when** they return, **then** last selected language is remembered.

### Security

**Requirement:** All data transmission and storage must follow security best practices.

**Acceptance Criteria:**

- **Given** a user enters sensitive data, **when** transmitted, **then** all connections use HTTPS.
- **Given** a session is active, **when** idle for 30 minutes, **then** user is automatically logged out.
- **Given** authentication tokens are stored, **when** stored, **then** they use secure httpOnly cookies.

---

Author: DoppleByte\*
