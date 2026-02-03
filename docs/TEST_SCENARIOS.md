# Test Scenarios for Cart and Checkout

This document outlines the test scenarios for validating the robustness and correctness of the cart and checkout flows in the BoroBepari e-commerce platform.

## 1. Edge Case Handling

### 1.1 Product Stock Changes
*   **Scenario**: User adds item to cart. While browsing, stock drops below cart quantity.
*   **Expected Behavior**:
    *   Cart page loads.
    *   Server validation checks current stock.
    *   Yellow warning banner appears: "Stock reduced. Only X available."
    *   Item quantity in cart is automatically adjusted to available stock.
    *   User can proceed with reduced quantity.

### 1.2 Price Changes
*   **Scenario**: User adds item to cart at Price A. Admin changes price to Price B.
*   **Expected Behavior**:
    *   Cart page loads / User attempts checkout.
    *   Server validation detects price mismatch.
    *   Yellow warning banner appears: "Price changed from A to B".
    *   Cart totals update to reflect new price.
    *   User must review before proceeding.

### 1.3 Coupon Expiry
*   **Scenario**: User applies valid coupon. Coupon expires before checkout completion.
*   **Expected Behavior**:
    *   On "Place Order" click (or cart refresh):
    *   Validation fails.
    *   Error message: "Coupon has expired".
    *   Discount is removed from total.
    *   User is redirected to cart/review to see updated total.

### 1.4 Simultaneous Checkouts (Race Condition)
*   **Scenario**: Two users buy the last unit of a product simultaneously.
*   **Expected Behavior**:
    *   First user completes order successfully.
    *   Second user clicks "Place Order".
    *   Server validation (DB insert/check) fails due to stock constraint.
    *   Error toast: "Product X is out of stock".
    *   Redirect to cart to remove item.

## 2. Validation

### 2.1 Quantity Limits
*   **Scenario**: User tries to set quantity < 1 or > stock.
*   **Expected Behavior**:
    *   Input field prevents invalid values (auto-corrects to 1 or max stock).
    *   Decrement button disabled at 1 (unless below MOQ, then allows down to 1 but shows warning).
    *   Increment button disabled at max stock.

### 2.2 MOQ Compliance
*   **Scenario**: User adds item with quantity < MOQ.
*   **Expected Behavior**:
    *   Cart shows warning row.
    *   "Proceed to Checkout" button is disabled.
    *   "Fix All" button sets quantities to MOQ.

### 2.3 Address Validation
*   **Scenario**: User submits empty or invalid address details.
*   **Expected Behavior**:
    *   Form shows inline error messages (Required, invalid format).
    *   Submission blocked until fixed.

## 3. Performance

### 3.1 Debounced Validation
*   **Scenario**: User rapidly types in quantity input.
*   **Expected Behavior**:
    *   Network tab shows only one validation request after typing stops (1s debounce).
    *   UI updates immediately optimistically, then syncs if server disagrees.

## 4. Accessibility

### 4.1 Keyboard Navigation
*   **Scenario**: User navigates checkout using Tab key.
*   **Expected Behavior**:
    *   Focus moves logically through inputs and buttons.
    *   Focus trap in modals (Address, QuickView).
    *   Enter key activates buttons/links.

### 4.2 Screen Readers
*   **Scenario**: User uses screen reader on Cart page.
*   **Expected Behavior**:
    *   Quantity inputs have `aria-label`.
    *   Remove buttons have `aria-label` identifying the product.
    *   Warnings (MOQ, Stock) are announced via `role="alert"` or `aria-live`.

## 5. Mobile Optimization

### 5.1 Sticky Elements
*   **Scenario**: User scrolls long cart on mobile.
*   **Expected Behavior**:
    *   Checkout summary/button bar stays fixed at bottom.
    *   "Proceed to Checkout" always accessible.

## 6. Error Recovery

### 6.1 Payment Failure
*   **Scenario**: bKash payment fails or is cancelled.
*   **Expected Behavior**:
    *   User redirected to `payment-callback`.
    *   Error message shown.
    *   "Retry Payment" button redirects back to Review/Payment step.
    *   Cart remains intact (until success).

### 6.2 Session Persistence
*   **Scenario**: User refreshes page during checkout.
*   **Expected Behavior**:
    *   Selected address and payment method are remembered (via `sessionStorage`).
    *   User stays on current step.
