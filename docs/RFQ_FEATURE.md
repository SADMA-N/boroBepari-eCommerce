# RFQ & Quote Management Feature

This document outlines the implementation details, workflows, and edge case handling for the Request for Quotation (RFQ) feature in the BoroBepari e-commerce platform.

## Overview

The RFQ feature allows Buyers to request custom quotes for products (especially bulk orders) and Suppliers to respond with custom pricing and terms.

## Workflows

### 1. Buyer: Submit RFQ

- **EntryPoint**: "Request Quote" button on Product Detail Page (PDP) or Quick View.
- **Pre-requisites**: User must be logged in (Auth check implemented).
- **Form**:
  - Quantity (with MOQ validation)
  - Target Price (optional)
  - Delivery Location
  - Notes
  - Attachments (Max 5 files, 5MB limit, specific types)
- **Validation**: Zod schema used for form validation.
- **Outcome**: RFQ created with status `pending`.

### 2. Supplier: Manage RFQs

- **Route**: `/supplier/rfqs`
- **Inbox**: View RFQs targeting their products.
- **Filtering**: New, Quoted, Accepted, Expired.
- **Action**: "Send Quote".
- **Validation**: Unit price required. Warning if price > target price.
- **Outcome**: Quote created with status `pending`.

### 3. Buyer: Manage Quotes

- **Route**: `/buyer/rfqs` (Inbox) -> `/buyer/rfqs/$rfqId` (Detail).
- **Inbox**: List of submitted RFQs with status badges and expiry countdowns.
- **Detail View**:
  - View RFQ details.
  - List of received quotes (Cards/Table view).
  - Compare quotes.
- **Actions**:
  - **Accept**: Locks price, updates status to `accepted`. Enables "Proceed to Checkout".
  - **Reject**: Updates status to `rejected`.
  - **Counter**: Submit a counter-offer (updates status to `countered`).

### 4. Conversion to Order

- **Trigger**: "Proceed to Checkout" button on an `accepted` quote.
- **Mechanism**: Adds item to Cart with:
  - `customPrice` (Locked from quote)
  - `rfqId` & `quoteId` metadata.
- **Cart UI**: Displays "Price locked from Quote #ID" badge. Disables quantity editing to preserve agreement integrity.

## Error Handling & Edge Cases

### Network & API

- **Retries**: UI shows loading states during API calls. In real integration, `react-query`'s auto-retry would be used.
- **Session**: Auth check before actions. Redirects to login if session expired.

### Logic Edge Cases

- **Expiry**:
  - RFQs and Quotes have expiry dates.
  - Actions (Accept/Reject/Quote) are disabled if `expired`.
  - Visual indicators (Red text/badges) for expired items.
- **Concurrent Actions**:
  - Accepting a quote automatically marks others as `rejected` (or pending review, depending on business logic - currently implemented as potentially rejecting others visually or logically).
- **Validation**:
  - File uploads validated for size/type on client-side.
  - Price/Quantity validation on client-side.

## Accessibility (a11y)

- **Modals**: Focus management and keyboard navigation support.
- **ARIA**: Labels on icon-only buttons.
- **Feedback**: Toast notifications for all significant actions (success/error).

## Mobile Optimization

- **Responsive Layouts**:
  - Grids collapse to single columns on mobile.
  - Tables convert to Card views or have scrollable containers.
- **Touch Targets**: Buttons sized for touch (min 44px height usually).

## Future Improvements

- Real-time WebSocket integration for instant notifications.
- Chat system for negotiation notes.
- Multi-product RFQs.
