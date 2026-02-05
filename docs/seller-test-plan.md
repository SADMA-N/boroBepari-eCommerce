# Seller Portal Test Plan

## Core Flows

1. Register seller → Login → Complete KYC.
2. Add product (single + bulk import).
3. Update product price/stock inline.
4. View and manage orders (confirm, ship).
5. RFQ response lifecycle (new → quoted → accepted).
6. Payout request → history → escrow view.
7. Profile & settings updates.

## Negative Tests

- Invalid file formats for uploads.
- Duplicate SKU entries.
- Invalid bank account formats.
- Session timeout redirect.
- Rate limit and network errors.

## Mobile Tests

- Tab navigation and forms.
- Bottom navigation usability.
- Modals open/close via touch.
