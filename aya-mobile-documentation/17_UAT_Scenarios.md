# Ø¢ÙŠØ© Ù…ÙˆØ¨Ø§ÙŠÙ„ - Ø³ÙŠÙ†Ø§Ø±ÙŠÙˆÙ‡Ø§Øª Ø§Ø®ØªØ¨Ø§Ø± Ø§Ù„Ù‚Ø¨ÙˆÙ„
## 17) UAT Scenarios (User Acceptance Testing)

---

## Ø§Ù„ØºØ±Ø¶

20 Ø³ÙŠÙ†Ø§Ø±ÙŠÙˆ Ø§Ø®ØªØ¨Ø§Ø± ÙˆØ§Ù‚Ø¹ÙŠ Ù„Ù…ØªØ¬Ø± ØªØ¬Ø²Ø¦Ø© (Retail). ÙŠÙÙ†ÙÙ‘Ø° Ù‚Ø¨Ù„ Go-Live Ù„Ù„ØªØ£ÙƒØ¯ Ø£Ù† Ø§Ù„Ù†Ø¸Ø§Ù… ÙŠØ¹Ù…Ù„ ÙƒÙ…Ø§ Ù‡Ùˆ Ù…ÙˆØ«Ù‘Ù‚.

---

## Ø§Ù„ØªÙ†Ø³ÙŠÙ‚

ÙƒÙ„ Ø³ÙŠÙ†Ø§Ø±ÙŠÙˆ ÙŠØ­ØªÙˆÙŠ:
- **Pre-conditions:** Ù…Ø§Ø°Ø§ ÙŠØ¬Ø¨ Ø£Ù† ÙŠÙƒÙˆÙ† Ø¬Ø§Ù‡Ø²Ø§Ù‹
- **Steps:** Ø®Ø·ÙˆØ§Øª Ø§Ù„ØªÙ†ÙÙŠØ°
- **Expected Results:** Ø§Ù„Ù†ØªÙŠØ¬Ø© Ø§Ù„Ù…ØªÙˆÙ‚Ø¹Ø©
- **Data Created:** Ù…Ø§ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„ØªÙŠ ØªÙÙ†Ø´Ø£
- **Rollback Expectation:** Ù‡Ù„ ÙŠÙ…ÙƒÙ† Ø§Ù„ØªØ±Ø§Ø¬Ø¹ØŸ ÙƒÙŠÙØŸ

---

## Ø§Ù„Ù…Ø¬Ù…ÙˆØ¹Ø© 1: Ø§Ù„Ù…Ø¨ÙŠØ¹Ø§Øª (Sale)

### UAT-01: Ø¨ÙŠØ¹ Ù†Ù‚Ø¯ÙŠ Ø¨Ø³ÙŠØ·

| Ø§Ù„Ø¨Ù†Ø¯ | Ø§Ù„ØªÙØ§ØµÙŠÙ„ |
|-------|----------|
| **Pre-conditions** | Ù…Ù†ØªØ¬ "iPhone 15" Ø¨Ù…Ø®Ø²ÙˆÙ† â‰¥ 1ØŒ Ø³Ø¹Ø± 45,000ØŒ Ø­Ø³Ø§Ø¨ "Ø§Ù„ØµÙ†Ø¯ÙˆÙ‚" Ù…ÙˆØ¬ÙˆØ¯ |
| **Steps** | 1. ÙØªØ­ POS â†’ 2. Ø¥Ø¶Ø§ÙØ© iPhone 15 (ÙƒÙ…ÙŠØ© 1) â†’ 3. Ø§Ø®ØªÙŠØ§Ø± "Ù†Ù‚Ø¯ÙŠ" â†’ 4. ØªØ£ÙƒÙŠØ¯ |
| **Expected Results** | ÙØ§ØªÙˆØ±Ø© status=completedØŒ Ø®ØµÙ… Ù…Ø®Ø²ÙˆÙ† 1ØŒ ledger_entry income +45,000 ÙÙŠ Ø§Ù„ØµÙ†Ø¯ÙˆÙ‚ |
| **Data Created** | `invoices` (1) + `invoice_items` (1) + `payments` (1) + `ledger_entries` (1) |
| **Rollback** | Ø¥Ù„ØºØ§Ø¡ Ø§Ù„ÙØ§ØªÙˆØ±Ø© (OP-10) Ø£Ùˆ Ø¥Ø±Ø¬Ø§Ø¹ (OP-04) |

### UAT-02: Ø¨ÙŠØ¹ Ù…Ø®ØªÙ„Ø· (Ù†Ù‚Ø¯ÙŠ + ÙÙŠØ²Ø§)

| Ø§Ù„Ø¨Ù†Ø¯ | Ø§Ù„ØªÙØ§ØµÙŠÙ„ |
|-------|----------|
| **Pre-conditions** | Ù…Ù†ØªØ¬ Ø¨Ù…Ø®Ø²ÙˆÙ† â‰¥ 1ØŒ Ø­Ø³Ø§Ø¨Ø§Øª "Ø§Ù„ØµÙ†Ø¯ÙˆÙ‚" Ùˆ"Visa" Ù…ÙˆØ¬ÙˆØ¯Ø© |
| **Steps** | 1. Ø¥Ø¶Ø§ÙØ© Ù…Ù†ØªØ¬ â†’ 2. ØªÙ‚Ø³ÙŠÙ… Ø§Ù„Ø¯ÙØ¹: 25,000 Ù†Ù‚Ø¯ÙŠ + 20,000 ÙÙŠØ²Ø§ â†’ 3. ØªØ£ÙƒÙŠØ¯ |
| **Expected Results** | ÙØ§ØªÙˆØ±Ø© total=45,000ØŒ payment (1) Ù†Ù‚Ø¯ÙŠ 25,000ØŒ payment (2) ÙÙŠØ²Ø§ 20,000ØŒ ledger_entries (2) |
| **Data Created** | `invoices` (1) + `invoice_items` (1) + `payments` (2) + `ledger_entries` (2) |
| **Rollback** | Ø¥Ù„ØºØ§Ø¡ ÙŠØ¹ÙƒØ³ ÙƒÙ„Ø§ Ø§Ù„Ù‚ÙŠØ¯ÙŠÙ† |

### UAT-03: Ø¨ÙŠØ¹ Ø¨Ø®ØµÙ…

| Ø§Ù„Ø¨Ù†Ø¯ | Ø§Ù„ØªÙØ§ØµÙŠÙ„ |
|-------|----------|
| **Pre-conditions** | Ù…Ù†ØªØ¬ Ø¨Ø³Ø¹Ø± 10,000ØŒ Ø­Ø¯ Ø®ØµÙ… Ø§Ù„Ù†Ø¸Ø§Ù… â‰¥ 10% |
| **Steps** | 1. Ø¥Ø¶Ø§ÙØ© Ù…Ù†ØªØ¬ â†’ 2. ØªØ·Ø¨ÙŠÙ‚ Ø®ØµÙ… 10% â†’ 3. ØªØ£ÙƒÙŠØ¯ Ø¯ÙØ¹ Ù†Ù‚Ø¯ÙŠ 9,000 |
| **Expected Results** | invoice.discount_amount=1,000ØŒ total_amount=9,000ØŒ ledger income=9,000 |
| **Data Created** | `invoices` + `invoice_items` + `payments` + `ledger_entries` |
| **Rollback** | Ø¥Ù„ØºØ§Ø¡ Ø£Ùˆ Ø¥Ø±Ø¬Ø§Ø¹ |

### UAT-04: Ù…Ø­Ø§ÙˆÙ„Ø© Ø¨ÙŠØ¹ Ù…Ù†ØªØ¬ Ø¨Ø¯ÙˆÙ† Ù…Ø®Ø²ÙˆÙ†

| Ø§Ù„Ø¨Ù†Ø¯ | Ø§Ù„ØªÙØ§ØµÙŠÙ„ |
|-------|----------|
| **Pre-conditions** | Ù…Ù†ØªØ¬ "ÙƒØ§Ø¨Ù„ USB" Ø¨Ù…Ø®Ø²ÙˆÙ†=0ØŒ track_stock=true |
| **Steps** | 1. Ù…Ø­Ø§ÙˆÙ„Ø© Ø¥Ø¶Ø§ÙØ© Ø§Ù„Ù…Ù†ØªØ¬ Ù„Ù„ÙØ§ØªÙˆØ±Ø© |
| **Expected Results** | Ø®Ø·Ø£ `ERR_STOCK_INSUFFICIENT`ØŒ Ù„Ø§ ÙØ§ØªÙˆØ±Ø© ØªÙÙ†Ø´Ø£ØŒ Ù„Ø§ ØªØºÙŠÙŠØ± ÙÙŠ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª |
| **Data Created** | Ù„Ø§ Ø´ÙŠØ¡ |
| **Rollback** | N/A â€” Ù„Ù… ÙŠØªÙ… Ø£ÙŠ ØªØºÙŠÙŠØ± |

---

## Ø§Ù„Ù…Ø¬Ù…ÙˆØ¹Ø© 2: Ø§Ù„Ù…Ø±ØªØ¬Ø¹Ø§Øª (Return)

### UAT-05: Ø¥Ø±Ø¬Ø§Ø¹ Ø¬Ø²Ø¦ÙŠ

| Ø§Ù„Ø¨Ù†Ø¯ | Ø§Ù„ØªÙØ§ØµÙŠÙ„ |
|-------|----------|
| **Pre-conditions** | ÙØ§ØªÙˆØ±Ø© Ù…ÙƒØªÙ…Ù„Ø© Ø¨Ù…Ù†ØªØ¬ÙŠÙ† (iPhone Ã—1 + Ø´Ø§Ø­Ù† Ã—2) |
| **Steps** | 1. ÙØªØ­ Ø§Ù„ÙØ§ØªÙˆØ±Ø© â†’ 2. Ø¥Ø±Ø¬Ø§Ø¹ Ø´Ø§Ø­Ù† Ã—1 ÙÙ‚Ø· â†’ 3. Ø§Ø®ØªÙŠØ§Ø± Ø­Ø³Ø§Ø¨ Ø§Ù„Ø§Ø³ØªØ±Ø¯Ø§Ø¯ â†’ 4. ØªØ£ÙƒÙŠØ¯ |
| **Expected Results** | return Ø¨Ù…Ø¨Ù„Øº 600ØŒ Ù…Ø®Ø²ÙˆÙ† Ø´Ø§Ø­Ù† +1ØŒ ledger_entry expense -600 Ù…Ù† Ø­Ø³Ø§Ø¨ Ø§Ù„Ø§Ø³ØªØ±Ø¯Ø§Ø¯ |
| **Data Created** | `returns` (1) + `return_items` (1) + `ledger_entries` (1) |
| **Rollback** | Ù„Ø§ reversal â€” ÙŠÙØ³Ø¬Ù‘Ù„ Ø¨ÙŠØ¹ Ø¬Ø¯ÙŠØ¯ Ø¥Ø°Ø§ ÙƒØ§Ù† Ø§Ù„Ø¥Ø±Ø¬Ø§Ø¹ Ø®Ø§Ø·Ø¦Ø§Ù‹ |

### UAT-06: Ù…Ø­Ø§ÙˆÙ„Ø© Ø¥Ø±Ø¬Ø§Ø¹ ÙƒÙ…ÙŠØ© Ø£ÙƒØ¨Ø± Ù…Ù† Ø§Ù„Ù…Ø¨Ø§Ø¹Ø©

| Ø§Ù„Ø¨Ù†Ø¯ | Ø§Ù„ØªÙØ§ØµÙŠÙ„ |
|-------|----------|
| **Pre-conditions** | ÙØ§ØªÙˆØ±Ø© Ø¨Ù…Ù†ØªØ¬ "Ø³Ù…Ø§Ø¹Ø©" Ã—1 |
| **Steps** | 1. ÙØªØ­ Ø§Ù„ÙØ§ØªÙˆØ±Ø© â†’ 2. Ù…Ø­Ø§ÙˆÙ„Ø© Ø¥Ø±Ø¬Ø§Ø¹ Ø³Ù…Ø§Ø¹Ø© Ã—2 |
| **Expected Results** | Ø®Ø·Ø£ `ERR_RETURN_QUANTITY` |
| **Data Created** | Ù„Ø§ Ø´ÙŠØ¡ |
| **Rollback** | N/A |

---

## Ø§Ù„Ù…Ø¬Ù…ÙˆØ¹Ø© 3: Ø§Ù„Ø¯ÙŠÙˆÙ† (Debt)

### UAT-07: Ø¨ÙŠØ¹ Ø¨Ø§Ù„Ø¢Ø¬Ù„

| Ø§Ù„Ø¨Ù†Ø¯ | Ø§Ù„ØªÙØ§ØµÙŠÙ„ |
|-------|----------|
| **Pre-conditions** | Ø¹Ù…ÙŠÙ„ Ø¯ÙŠÙ† Ù…ÙˆØ¬ÙˆØ¯ Ø¨Ø­Ø¯ Ø§Ø¦ØªÙ…Ø§Ù† ÙƒØ§ÙÙ |
| **Steps** | 1. Ø¥Ù†Ø´Ø§Ø¡ ÙØ§ØªÙˆØ±Ø© â†’ 2. Ø§Ø®ØªÙŠØ§Ø± Ø¯ÙØ¹ "Ø¢Ø¬Ù„" â†’ 3. Ø§Ø®ØªÙŠØ§Ø± Ø§Ù„Ø¹Ù…ÙŠÙ„ â†’ 4. ØªØ£ÙƒÙŠØ¯ |
| **Expected Results** | invoice Ø¨Ù€ payment_type=debtØŒ debt_entry Ù…Ø¹ remaining_amount=totalØŒ customer.current_balance ÙŠØ²ÙŠØ¯ |
| **Data Created** | `invoices` + `invoice_items` + `debt_entries` (1) |
| **Rollback** | ØªØ³Ø¯ÙŠØ¯ Ø§Ù„Ø¯ÙŠÙ† Ø£Ùˆ Ø¥Ù„ØºØ§Ø¡ Ø§Ù„ÙØ§ØªÙˆØ±Ø© |

### UAT-08: ØªØ³Ø¯ÙŠØ¯ Ø¯ÙŠÙ† Ø¬Ø²Ø¦ÙŠ

| Ø§Ù„Ø¨Ù†Ø¯ | Ø§Ù„ØªÙØ§ØµÙŠÙ„ |
|-------|----------|
| **Pre-conditions** | Ø¹Ù…ÙŠÙ„ Ø¨Ø¯ÙŠÙ† 10,000 (debt_entry ÙˆØ§Ø­Ø¯) |
| **Steps** | 1. ØµÙØ­Ø© Ø§Ù„Ø¯ÙŠÙˆÙ† â†’ 2. Ø§Ø®ØªÙŠØ§Ø± Ø§Ù„Ø¹Ù…ÙŠÙ„ â†’ 3. ØªØ³Ø¯ÙŠØ¯ 5,000 Ù†Ù‚Ø¯ÙŠ â†’ 4. ØªØ£ÙƒÙŠØ¯ |
| **Expected Results** | debt_payment 5,000ØŒ debt_entry.remaining=5,000ØŒ customer.current_balance ÙŠÙ†Ù‚Øµ 5,000ØŒ ledger income +5,000 |
| **Data Created** | `debt_payments` (1) + `ledger_entries` (1) |
| **Rollback** | Ù„Ø§ â€” ØªÙÙ†Ø´Ø£ debt_payment Ø¹ÙƒØ³ÙŠØ© Ù„Ùˆ Ø®Ø·Ø£ |

### UAT-09: Ù…Ø­Ø§ÙˆÙ„Ø© ØªØ³Ø¯ÙŠØ¯ Ù…Ø¨Ù„Øº Ø£ÙƒØ¨Ø± Ù…Ù† Ø§Ù„Ø¯ÙŠÙ†

| Ø§Ù„Ø¨Ù†Ø¯ | Ø§Ù„ØªÙØ§ØµÙŠÙ„ |
|-------|----------|
| **Pre-conditions** | Ø¹Ù…ÙŠÙ„ Ø¨Ø¯ÙŠÙ† 3,000 |
| **Steps** | 1. Ù…Ø­Ø§ÙˆÙ„Ø© ØªØ³Ø¯ÙŠØ¯ 5,000 |
| **Expected Results** | Ø®Ø·Ø£ `ERR_DEBT_OVERPAY` |
| **Data Created** | Ù„Ø§ Ø´ÙŠØ¡ |
| **Rollback** | N/A |

---

## Ø§Ù„Ù…Ø¬Ù…ÙˆØ¹Ø© 4: Ø§Ù„Ù…Ø´ØªØ±ÙŠØ§Øª ÙˆØ§Ù„Ù…ÙˆØ±Ø¯ÙŠÙ† (Purchase)

### UAT-10: ØªØ³Ø¬ÙŠÙ„ Ù…Ø´ØªØ±ÙŠØ§Øª Ù…Ù† Ù…ÙˆØ±Ø¯

| Ø§Ù„Ø¨Ù†Ø¯ | Ø§Ù„ØªÙØ§ØµÙŠÙ„ |
|-------|----------|
| **Pre-conditions** | Ù…ÙˆØ±Ø¯ Ù…ÙˆØ¬ÙˆØ¯ØŒ Ù…Ù†ØªØ¬ "iPhone 15" |
| **Steps** | 1. Ù…Ø´ØªØ±ÙŠØ§Øª â†’ 2. Ø§Ø®ØªÙŠØ§Ø± Ø§Ù„Ù…ÙˆØ±Ø¯ â†’ 3. Ø¥Ø¶Ø§ÙØ© iPhone Ã—10 Ø¨Ù€ 40,000/ÙˆØ­Ø¯Ø© â†’ 4. Ø¯ÙØ¹ Ù†Ù‚Ø¯ÙŠ â†’ 5. ØªØ£ÙƒÙŠØ¯ |
| **Expected Results** | purchase Ø¨Ù€ total=400,000ØŒ Ù…Ø®Ø²ÙˆÙ† iPhone +10ØŒ cost_price Ù…Ø­Ø¯Ù‘Ø«ØŒ ledger expense -400,000 |
| **Data Created** | `purchase_orders` (1) + `purchase_items` (1) + `ledger_entries` (1) |
| **Rollback** | Ù„Ø§ â€” ÙŠÙÙ†Ø´Ø£ Ø¥Ø±Ø¬Ø§Ø¹ Ù…Ø´ØªØ±ÙŠØ§Øª |

### UAT-11: ØªØ³Ø¯ÙŠØ¯ Ù…ÙˆØ±Ø¯

| Ø§Ù„Ø¨Ù†Ø¯ | Ø§Ù„ØªÙØ§ØµÙŠÙ„ |
|-------|----------|
| **Pre-conditions** | Ù…ÙˆØ±Ø¯ Ø¨Ù…Ø¨Ù„Øº Ù…Ø³ØªØ­Ù‚ 100,000 |
| **Steps** | 1. Ø§Ù„Ù…ÙˆØ±Ø¯ÙŠÙ† â†’ 2. ØªØ³Ø¯ÙŠØ¯ 50,000 Ù†Ù‚Ø¯ÙŠ â†’ 3. ØªØ£ÙƒÙŠØ¯ |
| **Expected Results** | supplier_payment 50,000ØŒ supplier.current_balance ÙŠÙ†Ù‚ØµØŒ ledger expense -50,000 |
| **Data Created** | `supplier_payments` (1) + `ledger_entries` (1) |
| **Rollback** | Ù„Ø§ Ù…Ø¨Ø§Ø´Ø± â€” ÙŠÙØ³Ø¬Ù‘Ù„ ØªØµØ­ÙŠØ­ |

---

## Ø§Ù„Ù…Ø¬Ù…ÙˆØ¹Ø© 5: Ø§Ù„ØµÙŠØ§Ù†Ø© (Maintenance)

### UAT-12: ØªØ³Ø¬ÙŠÙ„ Ø¹Ù…Ù„ÙŠØ© ØµÙŠØ§Ù†Ø©

| Ø§Ù„Ø¨Ù†Ø¯ | Ø§Ù„ØªÙØ§ØµÙŠÙ„ |
|-------|----------|
| **Pre-conditions** | Ù„Ø§ ÙŠÙˆØ¬Ø¯ Ø´Ø±ÙˆØ· |
| **Steps** | 1. Ø§Ù„ØµÙŠØ§Ù†Ø© â†’ 2. Ø¥Ø¶Ø§ÙØ© Ø¬Ù‡Ø§Ø² (Ø§Ø³Ù… + Ù…Ø´ÙƒÙ„Ø© + ØªÙƒÙ„ÙØ©) â†’ 3. Ø§Ø³ØªÙ„Ø§Ù… Ø¯ÙØ¹Ø© â†’ 4. ØªØ£ÙƒÙŠØ¯ |
| **Expected Results** | maintenance_job Ø¨Ø­Ø§Ù„Ø© in_progress Ø£Ùˆ completedØŒ ledger income +revenue |
| **Data Created** | `maintenance_jobs` (1) + `ledger_entries` (1) |
| **Rollback** | ØªØ¹Ø¯ÙŠÙ„ Ø§Ù„Ø­Ø§Ù„Ø© Ø£Ùˆ Ø¥Ù„ØºØ§Ø¡ |

---

## Ø§Ù„Ù…Ø¬Ù…ÙˆØ¹Ø© 6: Ø§Ù„Ø¬Ø±Ø¯ (Inventory Count)

### UAT-13: Ø¬Ø±Ø¯ ÙŠÙˆÙ…ÙŠ Ø¨Ù„Ø§ ÙØ±ÙˆÙ‚Ø§Øª

| Ø§Ù„Ø¨Ù†Ø¯ | Ø§Ù„ØªÙØ§ØµÙŠÙ„ |
|-------|----------|
| **Pre-conditions** | Ù…Ø®Ø²ÙˆÙ† Ù†Ø¸Ø§Ù…ÙŠ Ø¯Ù‚ÙŠÙ‚ |
| **Steps** | 1. Ø§Ù„Ø¬Ø±Ø¯ â†’ 2. Ø¥Ø¯Ø®Ø§Ù„ ÙƒÙ„ Ù…Ù†ØªØ¬ Ø¨Ù€ counted_quantity = system_quantity â†’ 3. Ø¥ÙƒÙ…Ø§Ù„ |
| **Expected Results** | stock_count status=completedØŒ Ù„Ø§ inventory_count_items Ø¨Ù€å·®å¼‚ØŒ Ù„Ø§ ØªØºÙŠÙŠØ± ÙÙŠ Ø§Ù„Ù…Ø®Ø²ÙˆÙ† |
| **Data Created** | `inventory_counts` (1) + `inventory_count_items` (n) |
| **Rollback** | N/A â€” Ø§Ù„Ø¬Ø±Ø¯ ØªØ³Ø¬ÙŠÙ„ ÙÙ‚Ø· |

### UAT-14: Ø¬Ø±Ø¯ ÙŠÙƒØ´Ù Ù†Ù‚Øµ

| Ø§Ù„Ø¨Ù†Ø¯ | Ø§Ù„ØªÙØ§ØµÙŠÙ„ |
|-------|----------|
| **Pre-conditions** | Ù…Ù†ØªØ¬ "Ø³Ù…Ø§Ø¹Ø©" Ù…Ø®Ø²ÙˆÙ† Ù†Ø¸Ø§Ù…ÙŠ=10 |
| **Steps** | 1. Ø§Ù„Ø¬Ø±Ø¯ â†’ 2. Ø¥Ø¯Ø®Ø§Ù„ counted=8 â†’ 3. Ø¥ÙƒÙ…Ø§Ù„ â†’ 4. ØªØ³ÙˆÙŠØ© Ø§Ù„Ù…Ø®Ø²ÙˆÙ† |
| **Expected Results** | stock_count_item: system=10, counted=8, difference=-2. Ø¨Ø¹Ø¯ Ø§Ù„ØªØ³ÙˆÙŠØ©: Ø§Ù„Ù…Ø®Ø²ÙˆÙ† = 8 |
| **Data Created** | `inventory_counts` + `inventory_count_items` |
| **Rollback** | ØªØ³ÙˆÙŠØ© Ø¹ÙƒØ³ÙŠØ© |

---

## Ø§Ù„Ù…Ø¬Ù…ÙˆØ¹Ø© 7: Ø§Ù„ØªØ³ÙˆÙŠØ© ÙˆØ§Ù„Ø­Ø³Ø§Ø¨Ø§Øª (Reconciliation)

### UAT-15: ØªØ³ÙˆÙŠØ© Ø­Ø³Ø§Ø¨ Ø§Ù„ØµÙ†Ø¯ÙˆÙ‚

| Ø§Ù„Ø¨Ù†Ø¯ | Ø§Ù„ØªÙØ§ØµÙŠÙ„ |
|-------|----------|
| **Pre-conditions** | Ø­Ø³Ø§Ø¨ "Ø§Ù„ØµÙ†Ø¯ÙˆÙ‚" Ø¨Ù€ current_balance=50,000 |
| **Steps** | 1. Ø§Ù„ØªØ³ÙˆÙŠØ© â†’ 2. Ø§Ù„Ø¹Ø¯ Ø§Ù„ÙØ¹Ù„ÙŠ: 50,000 â†’ 3. ØªØ£ÙƒÙŠØ¯ |
| **Expected Results** | reconciliation_entry: system=50,000, actual=50,000, difference=0, is_resolved=true |
| **Data Created** | `reconciliation_entries` (1) |
| **Rollback** | N/A â€” ØªØ³Ø¬ÙŠÙ„ ÙÙ‚Ø· |

### UAT-16: ØªØ³ÙˆÙŠØ© ÙŠÙƒØ´Ù ÙØ§Ø¦Ø¶

| Ø§Ù„Ø¨Ù†Ø¯ | Ø§Ù„ØªÙØ§ØµÙŠÙ„ |
|-------|----------|
| **Pre-conditions** | Ø­Ø³Ø§Ø¨ "Ø§Ù„ØµÙ†Ø¯ÙˆÙ‚" balance=50,000 |
| **Steps** | 1. Ø§Ù„Ø¹Ø¯ Ø§Ù„ÙØ¹Ù„ÙŠ: 51,000 â†’ 2. ØªØ³Ø¬ÙŠÙ„ Ø§Ù„ÙØ±Ù‚ â†’ 3. ØªØµØ­ÙŠØ­ (adjustment +1,000) |
| **Expected Results** | reconciliation Ø¨ÙØ±Ù‚ +1,000ØŒ ledger adjustment +1,000ØŒ balance Ù…Ø­Ø¯Ø« Ø¥Ù„Ù‰ 51,000 |
| **Data Created** | `reconciliation_entries` (1) + `ledger_entries` (1) |
| **Rollback** | ØªØ³ÙˆÙŠØ© Ø¹ÙƒØ³ÙŠØ© |

---

## Ø§Ù„Ù…Ø¬Ù…ÙˆØ¹Ø© 8: Backup & Restore

### UAT-17: Ø§Ù„ØªØ­Ù‚Ù‚ Ù…Ù† ÙˆØ¬ÙˆØ¯ Backup ÙŠÙˆÙ…ÙŠ

| Ø§Ù„Ø¨Ù†Ø¯ | Ø§Ù„ØªÙØ§ØµÙŠÙ„ |
|-------|----------|
| **Pre-conditions** | Ù…Ø´Ø±ÙˆØ¹ Supabase Ù†Ø´Ø· |
| **Steps** | 1. Supabase Dashboard â†’ Backups â†’ 2. ØªØ­Ù‚Ù‚ Ù…Ù† ÙˆØ¬ÙˆØ¯ backup â‰¤ 24h |
| **Expected Results** | backup Ù…ÙˆØ¬ÙˆØ¯ Ø¨ØªØ§Ø±ÙŠØ® Ø§Ù„ÙŠÙˆÙ… Ø£Ùˆ Ø£Ù…Ø³ |
| **Data Created** | Ù„Ø§ Ø´ÙŠØ¡ |
| **Rollback** | N/A |

### UAT-18: Restore Drill (Ø§Ø®ØªØ¨Ø§Ø± Ø§Ù„Ø§Ø³ØªØ¹Ø§Ø¯Ø©)

| Ø§Ù„Ø¨Ù†Ø¯ | Ø§Ù„ØªÙØ§ØµÙŠÙ„ |
|-------|----------|
| **Pre-conditions** | Ù…Ø´Ø±ÙˆØ¹ Supabase Ø«Ø§Ù†ÙˆÙŠ Ù…ÙÙ†Ø´Ø£ |
| **Steps** | 1. ØªÙ†Ø²ÙŠÙ„ backup â†’ 2. Ø§Ø³ØªØ¹Ø§Ø¯Ø© â†’ 3. ØªØ´ØºÙŠÙ„ drift check â†’ 4. Ù…Ù‚Ø§Ø±Ù†Ø© snapshot â†’ 5. Ø­Ø°Ù Ø§Ù„Ù…Ø´Ø±ÙˆØ¹ Ø§Ù„Ø«Ø§Ù†ÙˆÙŠ |
| **Expected Results** | 29 Ø¬Ø¯ÙˆÙ„ Ù…ÙˆØ¬ÙˆØ¯Ø©ØŒ drift=0ØŒ snapshot ÙŠØªØ·Ø§Ø¨Ù‚ØŒ RTO < 4h |
| **Data Created** | Ù„Ø§ Ø´ÙŠØ¡ Ø¹Ù„Ù‰ Ø§Ù„Ø¥Ù†ØªØ§Ø¬ |
| **Rollback** | Ø­Ø°Ù Ø§Ù„Ù…Ø´Ø±ÙˆØ¹ Ø§Ù„Ø«Ø§Ù†ÙˆÙŠ |

---

## Ø§Ù„Ù…Ø¬Ù…ÙˆØ¹Ø© 9: Ø§Ù„Ø¥Ù„ØºØ§Ø¡ ÙˆØ§Ù„ØªØ¹Ø¯ÙŠÙ„ (Cancel/Edit)

### UAT-19: Ø¥Ù„ØºØ§Ø¡ ÙØ§ØªÙˆØ±Ø© Ù‚Ø¨Ù„ Ø£ÙŠ Ø¥Ø±Ø¬Ø§Ø¹

| Ø§Ù„Ø¨Ù†Ø¯ | Ø§Ù„ØªÙØ§ØµÙŠÙ„ |
|-------|----------|
| **Pre-conditions** | ÙØ§ØªÙˆØ±Ø© Ù…ÙƒØªÙ…Ù„Ø© Ø¨Ù„Ø§ Ù…Ø±ØªØ¬Ø¹Ø§Øª |
| **Steps** | 1. ÙØªØ­ Ø§Ù„ÙØ§ØªÙˆØ±Ø© â†’ 2. Ø¥Ù„ØºØ§Ø¡ + Ø³Ø¨Ø¨ â†’ 3. ØªØ£ÙƒÙŠØ¯ |
| **Expected Results** | status=cancelledØŒ Ù…Ø®Ø²ÙˆÙ† ÙŠØ¹ÙˆØ¯ØŒ ledger entries Ø¹ÙƒØ³ÙŠØ©ØŒ audit_log ÙŠØ³Ø¬Ù„ Ø§Ù„Ø³Ø¨Ø¨ |
| **Data Created** | ØªØ­Ø¯ÙŠØ« `invoices` + `ledger_entries` (reversal) + `audit_logs` |
| **Rollback** | Ù„Ø§ Ø¹ÙƒØ³ Ù„Ù„Ø¥Ù„ØºØ§Ø¡ â€” ÙŠÙÙ†Ø´Ø£ ÙØ§ØªÙˆØ±Ø© Ø¬Ø¯ÙŠØ¯Ø© |

### UAT-20: Ù…Ø­Ø§ÙˆÙ„Ø© Ø¥Ù„ØºØ§Ø¡ ÙØ§ØªÙˆØ±Ø© Ø¨Ù‡Ø§ Ù…Ø±ØªØ¬Ø¹

| Ø§Ù„Ø¨Ù†Ø¯ | Ø§Ù„ØªÙØ§ØµÙŠÙ„ |
|-------|----------|
| **Pre-conditions** | ÙØ§ØªÙˆØ±Ø© Ø¨Ù‡Ø§ return Ù…Ø³Ø¬Ù‘Ù„ |
| **Steps** | 1. Ù…Ø­Ø§ÙˆÙ„Ø© Ø¥Ù„ØºØ§Ø¡ Ø§Ù„ÙØ§ØªÙˆØ±Ø© |
| **Expected Results** | Ø®Ø·Ø£ `ERR_CANCEL_HAS_RETURN` |
| **Data Created** | Ù„Ø§ Ø´ÙŠØ¡ |
| **Rollback** | N/A |

---

## Ø§Ù„Ù…Ø¬Ù…ÙˆØ¹Ø© 10: Ø³ÙŠÙ†Ø§Ø±ÙŠÙˆÙ‡Ø§Øª Ø¥Ø¶Ø§ÙÙŠØ© (Edge Cases)

### UAT-21: Ø¨ÙŠØ¹ Ù…ØªØ²Ø§Ù…Ù† Ù…Ù† Ø¬Ù‡Ø§Ø²ÙŠÙ† (Concurrent Sale)

| Ø§Ù„Ø¨Ù†Ø¯ | Ø§Ù„ØªÙØ§ØµÙŠÙ„ |
|-------|-----------|
| **Pre-conditions** | Ù…Ù†ØªØ¬ "Ø³Ù…Ø§Ø¹Ø©" Ø¨Ù…Ø®Ø²ÙˆÙ†=1ØŒ Ø¬Ù‡Ø§Ø²Ø§ POS Ù…ÙØªÙˆØ­Ø§Ù† |
| **Steps** | 1. Ø§Ù„Ø¬Ù‡Ø§Ø² A ÙŠØ¨Ø¯Ø£ Ø¨ÙŠØ¹ Ø§Ù„Ø³Ù…Ø§Ø¹Ø© â†’ 2. Ø§Ù„Ø¬Ù‡Ø§Ø² B ÙŠØ­Ø§ÙˆÙ„ Ø¨ÙŠØ¹ Ù†ÙØ³ Ø§Ù„Ø³Ù…Ø§Ø¹Ø© Ø¨Ø¹Ø¯ Ø«ÙˆØ§Ù†ÙŠ â†’ 3. ØªØ£ÙƒÙŠØ¯ Ù…Ù† Ø§Ù„Ø¬Ù‡Ø§Ø²ÙŠÙ† |
| **Expected Results** | Ø§Ù„Ø¬Ù‡Ø§Ø² A ÙŠÙ†Ø¬Ø­ØŒ Ø§Ù„Ø¬Ù‡Ø§Ø² B ÙŠØ­ØµÙ„ Ø¹Ù„Ù‰ `ERR_STOCK_INSUFFICIENT` (Ø¨ÙØ¶Ù„ SELECT FOR UPDATE) |
| **Data Created** | ÙØ§ØªÙˆØ±Ø© ÙˆØ§Ø­Ø¯Ø© ÙÙ‚Ø· |
| **Rollback** | N/A â€” Ø§Ù„Ø·Ù„Ø¨ Ø§Ù„Ø«Ø§Ù†ÙŠ Ù„Ù… ÙŠÙÙ†ÙØ° |

### UAT-21b: Ø§Ø®ØªØ¨Ø§Ø± Deadlock Prevention (Lock Ordering + Retry)

| Ø§Ù„Ø¨Ù†Ø¯ | Ø§Ù„ØªÙØ§ØµÙŠÙ„ |
|-------|-----------|
| **Pre-conditions** | Ù…Ù†ØªØ¬Ø§Ù† A Ùˆ B Ø¨Ù…Ø®Ø²ÙˆÙ† ÙƒØ§ÙÙØŒ Ø¬Ù‡Ø§Ø²Ø§ POS Ù…ÙØªÙˆØ­Ø§Ù† |
| **Steps** | 1. Ø§Ù„Ø¬Ù‡Ø§Ø² A ÙŠØ¨ÙŠØ¹ [A Ø«Ù… B] â†’ 2. Ø§Ù„Ø¬Ù‡Ø§Ø² B ÙŠØ¨ÙŠØ¹ [B Ø«Ù… A] ÙÙŠ Ù†ÙØ³ Ø§Ù„Ù„Ø­Ø¸Ø© â†’ 3. ØªØ£ÙƒÙŠØ¯ Ù…Ù† Ø§Ù„Ø¬Ù‡Ø§Ø²ÙŠÙ† |
| **Expected Results** | Ù„Ø§ ÙŠØ­Ø¯Ø« deadlock Ø¯Ø§Ø¦Ù…Ø› Ø§Ù„Ù†Ø¸Ø§Ù… ÙŠØ±ØªØ¨ Ø§Ù„Ù‚ÙÙ„ (`product_id ASC`) ÙˆÙŠÙØ¹ÙŠØ¯ Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø© ØªÙ„Ù‚Ø§Ø¦ÙŠØ§Ù‹ Ø¹Ù†Ø¯ Ø§Ù„ØªØ¹Ø§Ø±Ø¶. Ø¥Ù…Ø§ Ù†Ø¬Ø§Ø­ Ø§Ù„Ø¹Ù…Ù„ÙŠØªÙŠÙ† Ø£Ùˆ ÙØ´Ù„ ÙˆØ§Ø­Ø¯Ø© Ø¨Ø±Ø³Ø§Ù„Ø© `ERR_CONCURRENT_STOCK_UPDATE` |
| **Data Created** | Ø³Ø¬Ù„Ø§Øª ØµØ­ÙŠØ­Ø© Ø¨Ø¯ÙˆÙ† ØªÙƒØ±Ø§Ø± (Ø¨ÙØ¶Ù„ idempotency) |
| **Rollback** | Ø§Ù„Ø·Ù„Ø¨ Ø§Ù„ÙØ§Ø´Ù„ ÙÙ‚Ø· |

### UAT-22: ØªØ¹Ø¯ÙŠÙ„ ÙØ§ØªÙˆØ±Ø© Ø¨Ø¹Ø¯ Ø¥Ù‚ÙØ§Ù„ Ø§Ù„ÙŠÙˆÙ…

| Ø§Ù„Ø¨Ù†Ø¯ | Ø§Ù„ØªÙØ§ØµÙŠÙ„ |
|-------|-----------|
| **Pre-conditions** | Ø¥Ù‚ÙØ§Ù„ ÙŠÙˆÙ…ÙŠ (OP-24) ØªÙ… Ø¨Ù†Ø¬Ø§Ø­ Ù„ØªØ§Ø±ÙŠØ® Ø§Ù„ÙŠÙˆÙ… |
| **Steps** | 1. Ù…Ø­Ø§ÙˆÙ„Ø© ØªØ¹Ø¯ÙŠÙ„ ÙØ§ØªÙˆØ±Ø© Ø¨ØªØ§Ø±ÙŠØ® Ø§Ù„ÙŠÙˆÙ… |
| **Expected Results** | OP-24 Ù‡Ùˆ soft close â€” Ø§Ù„ØªØ¹Ø¯ÙŠÙ„ ÙŠÙØ³Ù…Ø­ Ø¨Ù‡ Ù„ÙƒÙ† ÙŠÙØ³Ø¬Ù‘Ù„ ÙÙŠ audit_logs |
| **Data Created** | ØªØ­Ø¯ÙŠØ« `invoices` + `audit_logs` |
| **Rollback** | Ø¥Ù„ØºØ§Ø¡ Ø§Ù„ØªØ¹Ø¯ÙŠÙ„ |

### UAT-23: ØªØ³Ø¬ÙŠÙ„ Ù…ØµØ±ÙˆÙ

| Ø§Ù„Ø¨Ù†Ø¯ | Ø§Ù„ØªÙØ§ØµÙŠÙ„ |
|-------|-----------|
| **Pre-conditions** | Ø­Ø³Ø§Ø¨ "Ø§Ù„ØµÙ†Ø¯ÙˆÙ‚" Ø¨Ø±ØµÙŠØ¯ ÙƒØ§ÙÙ…ØŒ ÙØ¦Ø© Ù…ØµØ±ÙˆÙ "Ø¥ÙŠØ¬Ø§Ø±" Ù…ÙˆØ¬ÙˆØ¯Ø© |
| **Steps** | 1. Ø§Ù„Ù…ØµØ±ÙˆÙØ§Øª â†’ 2. Ø¥Ø¶Ø§ÙØ© Ù…ØµØ±ÙˆÙ: Ø¥ÙŠØ¬Ø§Ø± 500,000 Ù…Ù† Ø§Ù„ØµÙ†Ø¯ÙˆÙ‚ â†’ 3. ØªØ£ÙƒÙŠØ¯ |
| **Expected Results** | expense Ø¨Ù…Ø¨Ù„Øº 500,000ØŒ ledger_entry expense -500,000ØŒ accounts.current_balance ÙŠÙ†Ù‚Øµ |
| **Data Created** | `expenses` (1) + `ledger_entries` (1) |
| **Rollback** | Ù…ØµØ±ÙˆÙ Ø¹ÙƒØ³ÙŠ (reversal) |

### UAT-24: ØªØ­ÙˆÙŠÙ„ Ø¨ÙŠÙ† Ø­Ø³Ø§Ø¨ÙŠÙ†

| Ø§Ù„Ø¨Ù†Ø¯ | Ø§Ù„ØªÙØ§ØµÙŠÙ„ |
|-------|-----------|
| **Pre-conditions** | Ø­Ø³Ø§Ø¨ "Ø§Ù„ØµÙ†Ø¯ÙˆÙ‚" Ø¨Ø±ØµÙŠØ¯ 100,000ØŒ Ø­Ø³Ø§Ø¨ "Ø§Ù„Ø¨Ù†Ùƒ" Ù…ÙˆØ¬ÙˆØ¯ |
| **Steps** | 1. Ø§Ù„ØªØ­ÙˆÙŠÙ„Ø§Øª â†’ 2. Ù…Ù† Ø§Ù„ØµÙ†Ø¯ÙˆÙ‚ Ø¥Ù„Ù‰ Ø§Ù„Ø¨Ù†Ùƒ 50,000 â†’ 3. ØªØ£ÙƒÙŠØ¯ |  
| **Expected Results** | transfer Ø¨Ù…Ø¨Ù„Øº 50,000ØŒ ledger_entries (2): expense Ù…Ù† Ø§Ù„ØµÙ†Ø¯ÙˆÙ‚ + income Ø¥Ù„Ù‰ Ø§Ù„Ø¨Ù†ÙƒØŒ accounts Ù…Ø­Ø¯Ù‘Ø«Ø© |
| **Data Created** | `transfers` (1) + `ledger_entries` (2) |
| **Rollback** | ØªØ­ÙˆÙŠÙ„ Ø¹ÙƒØ³ÙŠ |

### UAT-25: Ø¥Ø±Ø¬Ø§Ø¹ Ù…Ù†ØªØ¬ Ù…Ø¨Ø§Ø¹ Ø¨Ø§Ù„Ø¢Ø¬Ù„ (Debt Return)

| Ø§Ù„Ø¨Ù†Ø¯ | Ø§Ù„ØªÙØ§ØµÙŠÙ„ |
|-------|-----------|
| **Pre-conditions** | ÙØ§ØªÙˆØ±Ø© Ø¢Ø¬Ù„Ø© Ø¨Ù…Ø¨Ù„Øº 10,000 Ù…Ø¹ Ø¹Ù…ÙŠÙ„ Ø¯ÙŠÙ†ØŒ debt_entry.remaining_amount=10,000 |
| **Steps** | 1. فتح الفاتورة → 2. إرجاع كامل → 3. لا يُطلب `refund_account_id` لأن `cash_refund = 0` (لا يوجد جزء مسدد سابقاً) → 4. تأكيد |
| **Expected Results** | return مسجّل، المخزون يعود، debt_entry.remaining_amount=0 و is_paid=true، debt_customer.current_balance ينقص 10,000، ولا يُنشأ قيد cash refund |
| **Data Created** | `returns` (1) + `return_items` (n) + ØªØ­Ø¯ÙŠØ« `debt_entries` + `debt_customers` |
| **Rollback** | ÙØ§ØªÙˆØ±Ø© Ø¨ÙŠØ¹ Ø¬Ø¯ÙŠØ¯Ø© + Ø¯ÙŠÙ† Ø¬Ø¯ÙŠØ¯ |

| Ø§Ù„Ù…Ø¬Ø§Ù„ | Ø³ÙŠÙ†Ø§Ø±ÙŠÙˆÙ‡Ø§Øª | Ø£Ø±Ù‚Ø§Ù… |
|--------|-----------|-------|
| Ø§Ù„Ù…Ø¨ÙŠØ¹Ø§Øª | 4 | UAT-01 â†’ 04 |
| Ø§Ù„Ù…Ø±ØªØ¬Ø¹Ø§Øª | 2 | UAT-05, 06 |
| Ø§Ù„Ø¯ÙŠÙˆÙ† | 3 | UAT-07 â†’ 09 |
| Ø§Ù„Ù…Ø´ØªØ±ÙŠØ§Øª | 2 | UAT-10, 11 |
| Ø§Ù„ØµÙŠØ§Ù†Ø© | 1 | UAT-12 |
| Ø§Ù„Ø¬Ø±Ø¯ | 2 | UAT-13, 14 |
| Ø§Ù„ØªØ³ÙˆÙŠØ© | 2 | UAT-15, 16 |
| Backup/Restore | 2 | UAT-17, 18 |
| Ø§Ù„Ø¥Ù„ØºØ§Ø¡ | 2 | UAT-19, 20 |
| Edge Cases | 7 | UAT-21 â†’ 27 |
| Ø§Ù„Ø£Ù…Ø§Ù† | 3 | UAT-28 â†’ 30 |
| الأداء | 2 | UAT-31 → 32 |
| توافق الأجهزة | 3 | UAT-33 → 35 |
| المصروفات والإشعارات (V2) | 3 | UAT-36 → 38 |
| التواصل وروابط الإيصالات (V2) | 3 | UAT-39 → 41 |
| الصلاحيات الدقيقة والتقارير (V2) | 4 | UAT-42 → 45 |
| النقل والاستعادة (V2) | 3 | UAT-46 → 48 |
| البحث والتنبيهات والأداء (V2) | 3 | UAT-49 → 51 |
| **المجموع** | **51** | |

---

### UAT-26: ØªØ¹Ø¯ÙŠÙ„ ÙØ§ØªÙˆØ±Ø© Ø¨Ø£Ø«Ø± Ø±Ø¬Ø¹ÙŠ (Edit Invoice â€” Retroactive)

| Ø§Ù„Ø¨Ù†Ø¯ | Ø§Ù„ØªÙØ§ØµÙŠÙ„ |
|-------|----------|
| **Pre-conditions** | ÙØ§ØªÙˆØ±Ø© active Ù…ÙˆØ¬ÙˆØ¯Ø© Ø¨Ù…Ù†ØªØ¬ ÙˆØ§Ø­Ø¯ØŒ Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… Admin |
| **Steps** | 1. Ø§ÙØªØ­ ØªÙØ§ØµÙŠÙ„ Ø§Ù„ÙØ§ØªÙˆØ±Ø© â†’ 2. Ø§Ø¶ØºØ· "ØªØ¹Ø¯ÙŠÙ„" â†’ 3. ØºÙŠÙ‘Ø± Ø§Ù„ÙƒÙ…ÙŠØ© Ù…Ù† 1 Ø¥Ù„Ù‰ 2 â†’ 4. Ø£Ø¯Ø®Ù„ Ø³Ø¨Ø¨ Ø§Ù„ØªØ¹Ø¯ÙŠÙ„ â†’ 5. ØªØ£ÙƒÙŠØ¯ |
| **Expected Results** | (1) Ø§Ù„ÙØ§ØªÙˆØ±Ø© Ø§Ù„Ø£ØµÙ„ÙŠØ© ØªÙØ¹ÙƒØ³ (reversal entries ÙÙŠ ledger). (2) ÙØ§ØªÙˆØ±Ø© Ø¬Ø¯ÙŠØ¯Ø© ØªÙÙ†Ø´Ø£ Ø¨Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…ÙØ¹Ø¯Ù‘Ù„Ø©. (3) Ø§Ù„Ù…Ø®Ø²ÙˆÙ† ÙŠØªØºÙŠØ± (ÙŠÙØ±Ø¬Ø¹ 1 + ÙŠÙØ®ØµÙ… 2 = ØµØ§ÙÙŠ -1). (4) `audit_logs` ÙŠØ­ØªÙˆÙŠ Ø³Ø¬Ù„ÙŠÙ† (Ø¹ÙƒØ³ + Ø¥Ù†Ø´Ø§Ø¡) Ù…Ø¹ `edit_reason`. (5) Ø§Ù„ÙˆØ³Ù… "Ù…ÙØ¹Ø¯Ù‘Ù„Ø©" ÙŠØ¸Ù‡Ø± Ø¹Ù„Ù‰ Ø§Ù„ÙØ§ØªÙˆØ±Ø© Ø§Ù„Ø¬Ø¯ÙŠØ¯Ø© |
| **Validates** | OP-06 (edit_invoice), `edit_invoice()` function |

---

### UAT-27: ØªØ³Ø¯ÙŠØ¯ Ø¯ÙŠÙ† Ù…ÙˆØ±Ø¯ (Supplier Payment)

| Ø§Ù„Ø¨Ù†Ø¯ | Ø§Ù„ØªÙØ§ØµÙŠÙ„ |
|-------|----------|
| **Pre-conditions** | Ù…ÙˆØ±Ø¯ Ù„Ø¯ÙŠÙ‡ Ø±ØµÙŠØ¯ Ù…Ø³ØªØ­Ù‚ â‰¥ 50,000ØŒ Ø­Ø³Ø§Ø¨ "Ø§Ù„ØµÙ†Ø¯ÙˆÙ‚" Ø¨Ù‡ Ø±ØµÙŠØ¯ ÙƒØ§ÙÙ |
| **Steps** | 1. Ø§ÙØªØ­ ØµÙØ­Ø© Ø§Ù„Ù…ÙˆØ±Ø¯ â†’ 2. Ø§Ø¶ØºØ· "ØªØ³Ø¯ÙŠØ¯" â†’ 3. Ø£Ø¯Ø®Ù„ Ø§Ù„Ù…Ø¨Ù„Øº 50,000 â†’ 4. Ø§Ø®ØªØ± Ø§Ù„Ø­Ø³Ø§Ø¨ "Ø§Ù„ØµÙ†Ø¯ÙˆÙ‚" â†’ 5. ØªØ£ÙƒÙŠØ¯ |
| **Expected Results** | (1) `supplier_payments` Ø³Ø¬Ù„ Ø¬Ø¯ÙŠØ¯. (2) `supplier.current_balance -= 50,000`. (3) `ledger_entries` = expense 50,000 Ù…Ù† Ø§Ù„ØµÙ†Ø¯ÙˆÙ‚. (4) `accounts.current_balance -= 50,000` Ù„Ù„ØµÙ†Ø¯ÙˆÙ‚. (5) `audit_logs` ÙŠØ­ØªÙˆÙŠ Ø³Ø¬Ù„ |
| **Validates** | `create_supplier_payment()`, ERR_SUPPLIER_OVERPAY |

---

## Ø§Ù„Ù…Ø¬Ù…ÙˆØ¹Ø© 11: Ø§Ù„Ø£Ù…Ø§Ù† (Security)

### UAT-28: Ù…Ø­Ø§ÙˆÙ„Ø© INSERT Ù…Ø¨Ø§Ø´Ø± ÙÙŠ Ø¬Ø¯ÙˆÙ„ invoices Ù…Ù† Ø§Ù„Ù…ØªØµÙØ­

| Ø§Ù„Ø¨Ù†Ø¯ | Ø§Ù„ØªÙØ§ØµÙŠÙ„ |
|-------|----------|
| **Pre-conditions** | Ù…Ø´Ø±ÙˆØ¹ Supabase Ù†Ø´Ø·ØŒ `anon_key` ÙÙŠ Ø§Ù„Ù…ØªØµÙØ­ |
| **Steps** | 1. ÙØªØ­ Network tab â†’ 2. ØªÙ†ÙÙŠØ° `INSERT INTO invoices(...) VALUES(...)` Ø¨Ø§Ø³ØªØ®Ø¯Ø§Ù… `anon_key` Ù…Ø¨Ø§Ø´Ø±Ø© |
| **Expected Results** | `permission denied` â€” Ù„Ø§ ÙØ§ØªÙˆØ±Ø© ØªÙÙ†Ø´Ø£ØŒ Ù„Ø§ ØªØºÙŠÙŠØ± ÙÙŠ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª |
| **Data Created** | Ù„Ø§ Ø´ÙŠØ¡ |
| **Rollback** | N/A |
| **Validates** | `REVOKE ALL ON ALL TABLES`, RLS Policies, ADR-044 |

---

### UAT-29: Ø¥Ø±Ø³Ø§Ù„ unit_price Ù…Ø²ÙŠÙ ÙÙŠ body Ø§Ù„Ø·Ù„Ø¨ Ø¥Ù„Ù‰ /api/sales

| Ø§Ù„Ø¨Ù†Ø¯ | Ø§Ù„ØªÙØ§ØµÙŠÙ„ |
|-------|----------|
| **Pre-conditions** | Ù…Ø³ØªØ®Ø¯Ù… POS Ù…Ø³Ø¬Ù‘Ù„ Ø§Ù„Ø¯Ø®ÙˆÙ„ØŒ Ù…Ù†ØªØ¬ Ù…ÙˆØ¬ÙˆØ¯ ÙÙŠ Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª |
| **Steps** | 1. Ø¥Ø±Ø³Ø§Ù„ `POST /api/sales` Ù…Ø¹ `unit_price: 1` ÙÙŠ body Ø§Ù„Ø·Ù„Ø¨ (Ø§Ù„Ø³Ø¹Ø± Ø§Ù„Ø­Ù‚ÙŠÙ‚ÙŠ 45,000) â†’ 2. ØªØ£ÙƒÙŠØ¯ Ø§Ù„ÙØ§ØªÙˆØ±Ø© |
| **Expected Results** | ÙŠÙØªØ¬Ø§Ù‡Ù„ â€” ØªÙØ³Ø¬ÙŽÙ‘Ù„ Ø§Ù„ÙØ§ØªÙˆØ±Ø© Ø¨Ù€ `sale_price` Ø§Ù„Ù…Ø³Ø­ÙˆØ¨ Ù…Ù† `products` (45,000)ØŒ ÙˆÙ„Ø§ ÙŠØ¸Ù‡Ø± `unit_price` Ø§Ù„Ù…ÙØ±Ø³ÙŽÙ„ ÙÙŠ Ø£ÙŠ Ù…ÙƒØ§Ù† |
| **Data Created** | ÙØ§ØªÙˆØ±Ø© Ø¨Ø§Ù„Ø³Ø¹Ø± Ø§Ù„ØµØ­ÙŠØ­ Ù…Ù† DB |
| **Rollback** | Ø¥Ù„ØºØ§Ø¡ Ø§Ù„ÙØ§ØªÙˆØ±Ø© |
| **Validates** | ADR-043 â€” Ø³Ø­Ø¨ Ø§Ù„Ø³Ø¹Ø± Ù…Ù† DB ÙˆÙ„ÙŠØ³ Ù…Ù† Ø§Ù„Ø¹Ù…ÙŠÙ„ |

---

### UAT-30: POS ÙŠØ³ØªØ¯Ø¹ÙŠ endpoint Ù…Ø®ØµØµ Ù„Ù„Ù€ Admin

| Ø§Ù„Ø¨Ù†Ø¯ | Ø§Ù„ØªÙØ§ØµÙŠÙ„ |
|-------|----------|
| **Pre-conditions** | Ù…Ø³ØªØ®Ø¯Ù… Ø¨Ø¯ÙˆØ± `pos_staff` Ù…Ø³Ø¬Ù‘Ù„ Ø§Ù„Ø¯Ø®ÙˆÙ„ |
| **Steps** | 1. Ø¥Ø±Ø³Ø§Ù„ `POST /api/invoices/cancel` (Ù…Ø®ØµØµ Ù„Ù€ Admin ÙÙ‚Ø·) Ù…Ù† Ø­Ø³Ø§Ø¨ POS |
| **Expected Results** | HTTP 403 + `ERR_API_ROLE_FORBIDDEN` â€” Ù„Ø§ Ø¹Ù…Ù„ÙŠØ© ØªÙÙ†ÙÙŽÙ‘Ø° |
| **Data Created** | Ù„Ø§ Ø´ÙŠØ¡ |
| **Rollback** | N/A |
| **Validates** | ADR-042 â€” ÙØ­Øµ Ø§Ù„Ø¯ÙˆØ± ÙÙŠ ÙƒÙ„ API Route |

---

## المجموعة 12: الأداء (Performance)

### UAT-31: زمن إتمام البيع (p95) ضمن الهدف

| البند | التفاصيل |
|-------|----------|
| **Pre-conditions** | بيئة تشغيل مستقرة، منتجان في المخزون، 2 أجهزة POS فعّالة |
| **Steps** | 1. تنفيذ 50 عملية `create_sale()` واقعية (سلة 3-5 عناصر) → 2. قياس زمن الاستجابة لكل عملية |
| **Expected Results** | p95 لزمن إتمام البيع ≤ 2 ثانية (مطابق لهدف الأداء) |
| **Data Created** | فواتير ودفعات وقيود صحيحة بدون تكرار |
| **Rollback** | غير مطلوب — اختبار أداء تشغيل فعلي |
| **Validates** | [13_Tech_Config.md](./13_Tech_Config.md) - Performance Targets |

---

### UAT-32: أداء بحث POS تحت حمل منتجات واقعي

| البند | التفاصيل |
|-------|----------|
| **Pre-conditions** | ≥ 500 منتج نشط، شاشة POS محمّلة مسبقاً |
| **Steps** | 1. كتابة 20 كلمة بحث مختلفة (حرفين+) → 2. قياس زمن ظهور النتائج لكل بحث |
| **Expected Results** | زمن البحث المحلي ≤ 400ms في p95، وعدد النتائج ضمن الحد المعرّف |
| **Data Created** | لا شيء (قراءة فقط) |
| **Rollback** | N/A |
| **Validates** | Product pre-loading + local instant search |

---

## المجموعة 13: توافق الأجهزة (Device Compatibility)

### UAT-33: تكافؤ الوظائف على الهاتف/التابلت/اللابتوب

| البند | التفاصيل |
|-------|----------|
| **Pre-conditions** | 3 أجهزة متاحة: هاتف (360px+)، تابلت (768px+)، لابتوب (1024px+) |
| **Steps** | 1. تسجيل الدخول من كل جهاز → 2. تنفيذ بيع بسيط + مرتجع + تسديد دين من كل جهاز |
| **Expected Results** | نفس العمليات الأساسية تنجح على الأجهزة الثلاثة بدون كسر UI أو فقد وظائف |
| **Data Created** | سجلات بيع/مرتجع/تسديد صحيحة لكل جهاز |
| **Rollback** | حسب السيناريو (إلغاء/قيد عكسي) |
| **Validates** | Device-Agnostic Web App policy في `13_Tech_Config.md` |

---

### UAT-34: جودة التفاعل باللمس والاتجاه (Touch + Orientation)

| البند | التفاصيل |
|-------|----------|
| **Pre-conditions** | هاتف + تابلت، شاشة POS مفعلة |
| **Steps** | 1. تنفيذ رحلة بيع كاملة باللمس فقط → 2. تدوير الشاشة Portrait/Landscape أثناء الاستخدام |
| **Expected Results** | لا Overflow أفقي، الأزرار الرئيسية قابلة للمس، لا اختفاء لأزرار الإجراء عند تغيير الاتجاه |
| **Data Created** | لا شيء إضافي (اختبار UX سلوكي) |
| **Rollback** | N/A |
| **Validates** | Responsive/Touch contract في `03` و`11` |

---

### UAT-35: تثبيت Web App على الجهاز (Installability)

| البند | التفاصيل |
|-------|----------|
| **Pre-conditions** | متصفح يدعم التثبيت (Chrome/Edge أو Add to Home Screen على الهاتف) |
| **Steps** | 1. فتح النظام من المتصفح → 2. تثبيت التطبيق (A2HS/Install App) → 3. تشغيله من الأيقونة |
| **Expected Results** | التطبيق يفتح في نافذة/وضع تطبيق مستقل، ويسجل دخولًا طبيعيًا، ويعمل بنفس الصلاحيات |
| **Data Created** | لا شيء (تشغيلي فقط) |
| **Rollback** | إلغاء التثبيت من الجهاز |
| **Validates** | Web Installability policy في `13_Tech_Config.md` |

---

## المجموعة 14: المصروفات والإشعارات (V2)

### UAT-36: تسجيل مصروف كامل مع أثر مالي صحيح

| البند | التفاصيل |
|-------|----------|
| **Pre-conditions** | فئة مصروف نشطة + حساب دفع نشط + مستخدم Admin أو POS بحسب الصلاحية |
| **Steps** | 1. إرسال `POST /api/expenses` بمبلغ صحيح → 2. التحقق من `expenses`, `ledger_entries`, و`audit_logs` → 3. فتح التقارير/اللقطة اليومية |
| **Expected Results** | المصروف يُسجل مرة واحدة، الرصيد يُخصم من الحساب الصحيح، `total_expenses` و`net_profit` يتغيران كما هو متوقع |
| **Data Created** | expense + ledger entry + audit log |
| **Rollback** | قيد عكسي/بيئة اختبار |
| **Validates** | `PX-08-T01/T03/T05` + تكامل المصروفات مع الربح |

---

### UAT-37: إدارة فئات المصروفات دون كسر Blind POS

| البند | التفاصيل |
|-------|----------|
| **Pre-conditions** | مستخدم Admin ومستخدم POS نشطان |
| **Steps** | 1. Admin ينشئ/يعطل فئة مصروف → 2. POS يطلب القائمة التشغيلية → 3. محاولة POS لتعديل الفئة |
| **Expected Results** | Admin فقط يكتب، POS يقرأ الفئات النشطة فقط عند الحاجة التشغيلية، وأي محاولة كتابة من POS تُرفض |
| **Data Created** | فئة جديدة أو تعديل حالة |
| **Rollback** | إعادة الحالة السابقة |
| **Validates** | `PX-08-T02` + authority scoping |

---

### UAT-38: مركز الإشعارات و`mark as read`

| البند | التفاصيل |
|-------|----------|
| **Pre-conditions** | إشعارات موجودة لـ Admin وPOS |
| **Steps** | 1. فتح `/notifications` أو surface المكافئة → 2. تعليم إشعار واحد ثم `mark all as read` → 3. فتح الإشعار المرتبط |
| **Expected Results** | Admin يرى كل إشعاراته التشغيلية، POS يرى إشعاراته فقط، `unread_count` يتحدث بشكل صحيح، والضغط يفتح المرجع المرتبط |
| **Data Created** | تحديث `is_read/read_at` فقط |
| **Rollback** | غير مطلوب |
| **Validates** | `PX-08-T04` |

---

## المجموعة 15: التواصل وروابط الإيصالات (V2)

### UAT-39: رابط إيصال عام آمن

| البند | التفاصيل |
|-------|----------|
| **Pre-conditions** | فاتورة موجودة + token صالح |
| **Steps** | 1. إنشاء `receipt_url` → 2. فتح الرابط من متصفح غير مسجل → 3. محاولة عرض حقول داخلية أو تعديل الرابط |
| **Expected Results** | الإيصال يُعرض للقراءة فقط، ولا تظهر `cost/profit/internal notes/current balances`، وtoken غير صالح/منتهي يعطي خطأ صريحًا دون تسريب |
| **Data Created** | token / access log |
| **Rollback** | revoke token |
| **Validates** | `PX-09-T01/T02/T05` |

---

### UAT-40: Scheduler تذكير الدين بدون تكرار

| البند | التفاصيل |
|-------|----------|
| **Pre-conditions** | ديون `due` و`overdue` موجودة + نافذة تذكير معرفة |
| **Steps** | 1. تشغيل `/api/notifications/debts/run` مرتين لنفس التاريخ → 2. فحص `notifications/delivery log` |
| **Expected Results** | التذكير يُنشأ مرة واحدة لكل حالة/نافذة، والمحاولة الثانية تسجل suppression أو no-op واضح |
| **Data Created** | notifications أو reminder log |
| **Rollback** | حذف سجلات الاختبار |
| **Validates** | `PX-09-T03` + dedupe policy |

---

### UAT-41: سجل إرسال واتساب

| البند | التفاصيل |
|-------|----------|
| **Pre-conditions** | adapter مفعل أو mock provider |
| **Steps** | 1. إرسال رسالة receipt أو reminder → 2. فحص `delivery_log` → 3. اختبار فشل مزود الاتصال |
| **Expected Results** | status ينتقل `queued/sent/failed` بشكل صحيح، ولا تُخزن بيانات أكثر من اللازم، والفشل يعيد `ERR_WHATSAPP_DELIVERY_FAILED` عند الاقتضاء |
| **Data Created** | delivery log |
| **Rollback** | غير مطلوب |
| **Validates** | `PX-09-T04/T05` |

---

## المجموعة 16: الصلاحيات الدقيقة والتقارير (V2)

### UAT-42: منع الوصول وفق permission bundle

| البند | التفاصيل |
|-------|----------|
| **Pre-conditions** | مستخدمون بأدوار مختلفة بعد `PX-10` |
| **Steps** | 1. محاولة دخول شاشة أو route غير مصرح بها → 2. تجربة شاشة مسموحة → 3. مراجعة navigation |
| **Expected Results** | فقط bundles المسموحة تصل إلى الشاشات والroutes المناسبة، ولا يوجد fallback permissive |
| **Data Created** | audit access entries عند الحاجة |
| **Rollback** | إعادة الدور السابق |
| **Validates** | `PX-10-T02/T03` |

---

### UAT-43: حوكمة الخصم حسب الدور

| البند | التفاصيل |
|-------|----------|
| **Pre-conditions** | نظام خصومات مفعل + roles متعددة |
| **Steps** | 1. POS يرسل خصم أعلى من حدّه → 2. Role أعلى يجرب نفس الطلب → 3. مراجعة audit |
| **Expected Results** | الطلب الأول يُرفض بـ `ERR_DISCOUNT_APPROVAL_REQUIRED` أو ما يعادله، والثاني يمر فقط وفق bundle المعتمد مع audit واضح |
| **Data Created** | sale/edit attempts + audit |
| **Rollback** | إلغاء الفاتورة أو بيئة اختبار |
| **Validates** | `PX-10-T04` |

---

### UAT-44: تقرير مقارنة فترتين

| البند | التفاصيل |
|-------|----------|
| **Pre-conditions** | بيانات تشغيلية لفترتين مختلفتين |
| **Steps** | 1. فتح تقرير compare → 2. اختيار فترتين → 3. مراجعة totals والنسب |
| **Expected Results** | المقارنة تعرض `sales/profit/expenses` لكل فترة بشكل صحيح مع delta واضح |
| **Data Created** | لا شيء |
| **Rollback** | N/A |
| **Validates** | `PX-11-T01/T02` |

---

### UAT-45: parity بين التقرير والتصدير

| البند | التفاصيل |
|-------|----------|
| **Pre-conditions** | تقرير متقدم ظاهر على الشاشة + export مفعل |
| **Steps** | 1. تطبيق نفس الفلاتر → 2. فتح التقرير → 3. تنزيل export → 4. مقارنة الأرقام |
| **Expected Results** | totals الأساسية في الشاشة والتصدير متطابقة 100% |
| **Data Created** | ملف تصدير |
| **Rollback** | حذف ملف الاختبار |
| **Validates** | `PX-11-T04/T05` |

---

## المجموعة 17: النقل والاستعادة (V2)

### UAT-46: package تصدير Admin-only

| البند | التفاصيل |
|-------|----------|
| **Pre-conditions** | Admin login + بيانات قابلة للتصدير |
| **Steps** | 1. إنشاء package تصدير → 2. تنزيلها خلال مدة الصلاحية → 3. محاولة تنزيلها بعد الانتهاء أو من مستخدم غير مخول |
| **Expected Results** | Admin فقط ينشئ وينزل package، والروابط المنتهية تفشل بـ `ERR_EXPORT_PACKAGE_EXPIRED` أو ما يعادله |
| **Data Created** | export package + audit entry |
| **Rollback** | حذف package |
| **Validates** | `PX-12-T01/T04/T05` |

---

### UAT-47: import products بنمط `dry-run ثم commit`

| البند | التفاصيل |
|-------|----------|
| **Pre-conditions** | ملف import صالح وآخر به أخطاء |
| **Steps** | 1. dry-run على الملفين → 2. commit للملف الصالح فقط → 3. محاولة commit مباشرة بلا dry-run صالح |
| **Expected Results** | dry-run يكشف الصفوف الخاطئة، وcommit ينجح فقط بعد dry-run صالح، والمحاولة الثالثة تفشل بـ `ERR_IMPORT_DRY_RUN_REQUIRED` أو ما يعادله |
| **Data Created** | import job + products مضافة |
| **Rollback** | rollback/import cleanup |
| **Validates** | `PX-12-T02` |

---

### UAT-48: restore drill على بيئة معزولة

| البند | التفاصيل |
|-------|----------|
| **Pre-conditions** | backup معروف + بيئة معزولة |
| **Steps** | 1. تشغيل restore drill → 2. فحص `RTO` → 3. تشغيل `fn_verify_balance_integrity` أو ما يعادله |
| **Expected Results** | الاستعادة تنجح في البيئة المعزولة فقط، و`drift = 0` بعد الاستعادة |
| **Data Created** | restore drill logs |
| **Rollback** | حذف البيئة المعزولة |
| **Validates** | `PX-12-T03` + release safety |

---

## المجموعة 18: البحث والتنبيهات والأداء (V2)

### UAT-49: البحث الشامل ضمن p95 الهدف

| البند | التفاصيل |
|-------|----------|
| **Pre-conditions** | بيانات تشغيلية واقعية + global search مفعل |
| **Steps** | 1. تنفيذ 20 استعلام بحث على كيانات مختلفة → 2. قياس p95 → 3. مراجعة relevance |
| **Expected Results** | `p95` ضمن الهدف الموثق، والنتائج grouped correctly by entity، والاستعلامات القصيرة جدًا تُرفض بشكل صحيح |
| **Data Created** | لا شيء |
| **Rollback** | N/A |
| **Validates** | `PX-13-T02/T04` |

---

### UAT-50: مركز التنبيهات المجمّع مع dedupe

| البند | التفاصيل |
|-------|----------|
| **Pre-conditions** | low stock + overdue debts + unread notifications + maintenance ready |
| **Steps** | 1. فتح مركز التنبيهات → 2. مراجعة التلخيص → 3. إعادة تشغيل مصادر التنبيه |
| **Expected Results** | تظهر التنبيهات المجمعة مرة واحدة لكل cluster تشغيلي، وتقل الضوضاء بدون فقدان إشارة مهمة |
| **Data Created** | read model / aggregated counters |
| **Rollback** | N/A |
| **Validates** | `PX-13-T03` |

---

### UAT-51: regression متعدد الأجهزة بعد optimization

| البند | التفاصيل |
|-------|----------|
| **Pre-conditions** | caching/search optimizations مفعلة |
| **Steps** | 1. تشغيل flows حرجة على phone/tablet/laptop → 2. مراجعة overflow/touch/search/report render |
| **Expected Results** | لا regressions على الأجهزة الثلاثة بعد التحسينات |
| **Data Created** | بيانات تشغيلية محدودة حسب flow |
| **Rollback** | حسب السيناريو |
| **Validates** | `PX-13-T05` |

---

## ðŸ”— Ø§Ù„Ù…Ù„ÙØ§Øª Ø§Ù„Ù…Ø±ØªØ¨Ø·Ø©

- [04_Core_Flows.md](./04_Core_Flows.md) - ØªÙØ§ØµÙŠÙ„ ÙƒÙ„ Ø¹Ù…Ù„ÙŠØ©
- [08_SOPs.md](./08_SOPs.md) - Ø¥Ø¬Ø±Ø§Ø¡Ø§Øª Ø§Ù„ØªØ´ØºÙŠÙ„
- [16_Error_Codes.md](./16_Error_Codes.md) - Ø±Ù…ÙˆØ² Ø§Ù„Ø£Ø®Ø·Ø§Ø¡ Ø§Ù„Ù…ØªÙˆÙ‚Ø¹Ø©
- [05_Database_Design.md](./05_Database_Design.md) - Ø§Ù„Ø¬Ø¯Ø§ÙˆÙ„ Ø§Ù„Ù…ØªØ£Ø«Ø±Ø©
- [10_ADRs.md](./10_ADRs.md) - ADR-042/043/044 (Ø§Ù„Ø£Ø³Ø§Ø³ Ø§Ù„Ù…Ø±Ø¬Ø¹ÙŠ Ù„Ø³ÙŠÙ†Ø§Ø±ÙŠÙˆÙ‡Ø§Øª Ø§Ù„Ø£Ù…Ø§Ù†)

---

## المجموعة 19: Product Copy + Navigation + IA (Post-V2 Productization)

### UAT-52: no internal terminology leakage

| البند | التفاصيل |
|-------|----------|
| **Pre-conditions** | تفعيل أسطح `home/login/POS/invoices/debts/reports/settings` بعد product copy cleanup |
| **Steps** | 1. فتح الأسطح الأساسية على `phone/tablet/laptop` 2. البحث بصريًا ونصيًا عن `PX`, `baseline`, `SOP`, `idempotency_key`, أو أي labels تشغيلية 3. مراجعة empty states والعناوين |
| **Expected Results** | لا يظهر أي مصطلح داخلي للمستخدم النهائي، والعناوين/empty states تقدم لغة منتج واضحة |
| **Data Created** | لا شيء |
| **Rollback** | N/A |
| **Validates** | `PX-15-T01/T02/T03/T04` |

---

### UAT-53: role-aware landing and page context

| البند | التفاصيل |
|-------|----------|
| **Pre-conditions** | وجود مستخدم `Admin` ومستخدم `POS` فعّالين |
| **Steps** | 1. تسجيل الدخول بكل دور 2. مراجعة landing surface 3. التنقل بين 3 صفحات على الأقل 4. التحقق من titles/breadcrumbs/context headers |
| **Expected Results** | كل دور يرى context مناسبًا له، وكل صفحة توضّح المكان الحالي والانتقال السابق/التالي بوضوح |
| **Data Created** | جلسات مستخدم فقط |
| **Rollback** | logout |
| **Validates** | `PX-15-T03`, `PX-16-T02/T03` |

---

### UAT-54: navigation responsive usability

| البند | التفاصيل |
|-------|----------|
| **Pre-conditions** | sidebar/drawer navigation مفعّلة |
| **Steps** | 1. فتح التطبيق على `360px`, `768px`, و`1280px` 2. فتح/إغلاق drawer أو sidebar 3. الوصول إلى `POS`, `Invoices`, `Reports`, `Settings` خلال 3 نقرات أو أقل |
| **Expected Results** | التنقل قابل للاستخدام على المقاسات الثلاثة، ولا يوجد flat overflow أو ازدحام يمنع الوصول السريع |
| **Data Created** | لا شيء |
| **Rollback** | N/A |
| **Validates** | `PX-16-T01` |

---

### UAT-55: IA decomposition on crowded screens

| البند | التفاصيل |
|-------|----------|
| **Pre-conditions** | إعادة تنظيم `invoices`, `inventory`, `notifications`, `reports`, `settings`, `debts` |
| **Steps** | 1. تنفيذ flow رئيسي في كل شاشة 2. قياس عدد الأفعال المتنافسة على الشاشة 3. مراجعة discoverability للأفعال الحرجة |
| **Expected Results** | الشاشات المزدحمة أصبحت أوضح، والأفعال الأساسية تظهر دون إغراق بصري أو تداخل مربك |
| **Data Created** | حسب السيناريو |
| **Rollback** | حسب السيناريو |
| **Validates** | `PX-16-T04` |

---

### UAT-56: global search discoverability and scoping

| البند | التفاصيل |
|-------|----------|
| **Pre-conditions** | global search موجودة في app shell أو موضع discoverable |
| **Steps** | 1. تشغيل البحث من `Admin` و`POS` 2. تجربة queries صحيحة وقصيرة جدًا 3. التحقق من scoping على invoices/results |
| **Expected Results** | البحث سهل الوصول، query القصيرة تُرفض، ونتائج `POS` تبقى ضمن scope الدور |
| **Data Created** | لا شيء |
| **Rollback** | N/A |
| **Validates** | `PX-16-T05` |

---

## المجموعة 20: Async UX + Action Safety

### UAT-57: loading skeletons and non-blank transitions

| البند | التفاصيل |
|-------|----------|
| **Pre-conditions** | تفعيل loading states أو Suspense fallbacks على الأسطح الحرجة |
| **Steps** | 1. محاكاة تباطؤ الشبكة أو الخادم 2. فتح `reports`, `inventory`, `notifications`, `suppliers` 3. مراجعة ما يظهر أثناء التحميل |
| **Expected Results** | لا تظهر الشاشة فارغة أو جامدة؛ يظهر loading state واضح ويحافظ على structure مفهوم |
| **Data Created** | لا شيء |
| **Rollback** | إعادة network profile للوضع الطبيعي |
| **Validates** | `PX-17-T01` |

---

### UAT-58: persistent error state with retry

| البند | التفاصيل |
|-------|----------|
| **Pre-conditions** | وجود path قابلة للفشل المؤقت أو محاكاة failure |
| **Steps** | 1. إجبار request على الفشل 2. مراقبة error state 3. الضغط على "إعادة المحاولة" 4. التحقق من عدم فقد الإدخال |
| **Expected Results** | يظهر خطأ مفهوم وثابت، مع retry واضح، ودون الاعتماد على toast عابرة فقط |
| **Data Created** | لا شيء |
| **Rollback** | إزالة failure injection |
| **Validates** | `PX-17-T02` |

---

### UAT-59: destructive actions require confirmation

| البند | التفاصيل |
|-------|----------|
| **Pre-conditions** | تفعيل confirmation dialogs للأفعال الحساسة |
| **Steps** | 1. محاولة `cancel invoice` أو `revoke package` أو فعل حساس مماثل 2. التحقق من ظهور dialog 3. إلغاء العملية 4. إعادة المحاولة وتأكيدها |
| **Expected Results** | كل فعل تخريبي أو حساس يطلب confirmation واضحًا، وإلغاء dialog لا يغير البيانات |
| **Data Created** | حسب السيناريو |
| **Rollback** | حسب السيناريو |
| **Validates** | `PX-17-T04` |

---

### UAT-60: navigation transitions without full reload

| البند | التفاصيل |
|-------|----------|
| **Pre-conditions** | login/navigation transitions تعتمد App Router بدل full reload |
| **Steps** | 1. تسجيل الدخول 2. الانتقال بين صفحتين أو أكثر 3. مراقبة hydration/state continuity وعدم حصول refresh كامل |
| **Expected Results** | لا يوجد full page reload غير لازم، والانتقال يبقى سريعًا ويحافظ على state المناسبة |
| **Data Created** | جلسة دخول |
| **Rollback** | logout |
| **Validates** | `PX-17-T03` |

---

## المجموعة 21: Visual System + Accessibility

### UAT-61: visual consistency and page metadata

| البند | التفاصيل |
|-------|----------|
| **Pre-conditions** | typography/tokens/page metadata مطبقة |
| **Steps** | 1. فتح `home/login/POS/reports/settings` 2. مراجعة الخطوط والألوان والمسافات والـ titles 3. مقارنة card/table/form states |
| **Expected Results** | الهوية البصرية متسقة، وtitles/metadata تعكس الصفحة الحالية بدل عنوان عام واحد |
| **Data Created** | لا شيء |
| **Rollback** | N/A |
| **Validates** | `PX-18-T01/T02/T03` |

---

### UAT-62: keyboard/focus/touch accessibility

| البند | التفاصيل |
|-------|----------|
| **Pre-conditions** | a11y pass مطبق على العناصر التفاعلية الأساسية |
| **Steps** | 1. التنقل بالـ keyboard عبر login/navigation/forms 2. التحقق من `focus-visible` وlabels 3. مراجعة touch targets على الهاتف |
| **Expected Results** | focus واضح، labels موجودة، ولا توجد عناصر تفاعلية صغيرة أو inaccessible |
| **Data Created** | لا شيء |
| **Rollback** | N/A |
| **Validates** | `PX-18-T04` |

---

### UAT-63: dark mode/motion/device regression

| البند | التفاصيل |
|-------|----------|
| **Pre-conditions** | dark mode أو motion policy مفعلة إن كانت ضمن النطاق |
| **Steps** | 1. التبديل بين الثيمات إذا وُجدت 2. تشغيل flows أساسية على `phone/tablet/laptop` 3. مراجعة readability/performance/motion |
| **Expected Results** | الثيم أو الحركة لا تضر القراءة أو الأداء أو device contract |
| **Data Created** | لا شيء |
| **Rollback** | العودة للثيم الافتراضي |
| **Validates** | `PX-18-T05` + device safety |

---

## المجموعة 22: Security / Runtime / Deployment Hardening

### UAT-64: security headers and rate limiting smoke

| البند | التفاصيل |
|-------|----------|
| **Pre-conditions** | تطبيق security headers وrate limiting على المسارات المناسبة |
| **Steps** | 1. فحص response headers 2. تنفيذ burst requests على route حرجة 3. مراجعة error body في حالات الفشل |
| **Expected Results** | headers الأساسية موجودة، rate limiting يعمل دون كسر العقود، وerror body لا تسرّب تفاصيل داخلية |
| **Data Created** | request logs فقط |
| **Rollback** | N/A |
| **Validates** | `PX-19-T02` |

---

### UAT-65: env/deployment compatibility and cron policy

| البند | التفاصيل |
|-------|----------|
| **Pre-conditions** | env policy ودليل deployment محددان بوضوح |
| **Steps** | 1. تشغيل التطبيق في بيئة نظيفة أو smoke env 2. التحقق من سلوك الأسرار الناقصة 3. مراجعة cron auth policy وcompatibility decision |
| **Expected Results** | البيئة لا تفشل بصمت، والـ production secrets الإلزامية واضحة، وcron policy محكمة |
| **Data Created** | لا شيء |
| **Rollback** | إزالة env المؤقتة |
| **Validates** | `PX-19-T03` |

---

### UAT-66: runtime/cart/test hardening regression

| البند | التفاصيل |
|-------|----------|
| **Pre-conditions** | تطبيق runtime/cart hardening وتوسيع الاختبارات |
| **Steps** | 1. مراجعة POS cart long session behavior 2. اختبار stale stock/idempotency bootstrap 3. تشغيل component/runtime tests الجديدة |
| **Expected Results** | لا تظهر regressions على cart/runtime، وتغطي الاختبارات الجديدة gaps التي وثقتها التقارير |
| **Data Created** | بيانات جلسة محلية |
| **Rollback** | reset محلي |
| **Validates** | `PX-19-T04/T05` |

---

## المجموعة 23: Productization Release Gate

### UAT-67: post-V2 productization walkthrough

| البند | التفاصيل |
|-------|----------|
| **Pre-conditions** | اكتمال `PX-15 .. PX-19` |
| **Steps** | 1. تنفيذ walkthrough كامل على `home → login → POS → invoices → reports → settings` 2. مراجعة UX/device/a11y/security/deployment proofs 3. توثيق Go/No-Go |
| **Expected Results** | لا technical leakage، navigation واضحة، feedback states مكتملة، hardening gates مجتازة، والقرار النهائي موثق |
| **Data Created** | تقرير release gate فقط |
| **Rollback** | N/A |
| **Validates** | `PX-20-T01/T02/T03/T04` |

---

## المجموعة 24: UI Foundation + Shell + Auth Entry

### UAT-68: shell navigation and grouped workflows walkthrough

| البند | التفاصيل |
|-------|----------|
| **Pre-conditions** | اكتمال `PX-21-T01/T02/T03` |
| **Steps** | 1. فتح shell على `desktop/tablet/mobile` 2. التحقق من grouped navigation 3. التحقق من breadcrumbs + page header + role-aware shortcuts |
| **Expected Results** | shell RTL واضحة، التنقل grouped حسب workflow، ولا يوجد role confusion |
| **Data Created** | screenshots/e2e proof فقط |
| **Rollback** | N/A |
| **Validates** | `PX-21-T02/T03/T05` |

### UAT-69: home and login product-facing clarity

| البند | التفاصيل |
|-------|----------|
| **Pre-conditions** | اكتمال `PX-21-T04` |
| **Steps** | 1. فتح `/` و`/login` 2. مراجعة content hierarchy 3. التأكد من غياب اللغة التقنية 4. التحقق من CTA clarity |
| **Expected Results** | الصفحة الرئيسية وتسجيل الدخول تبدوان product-facing وواضحتين وغير تقنيتين |
| **Data Created** | screenshots/review notes |
| **Rollback** | N/A |
| **Validates** | `PX-21-T04` |

### UAT-70: RTL page context and metadata integrity

| البند | التفاصيل |
|-------|----------|
| **Pre-conditions** | اكتمال `PX-21` |
| **Steps** | 1. مراجعة shell, breadcrumbs, page titles, and directional actions 2. التحقق من native RTL behavior |
| **Expected Results** | اتجاه الصفحة والعناوين والـ breadcrumbs والـ icons يشعر بأنه RTL أصيل |
| **Data Created** | screenshots + metadata checks |
| **Rollback** | N/A |
| **Validates** | `PX-21-T01/T02/T05` |

---

## المجموعة 25: Transactional UX

### UAT-71: POS speed and cart clarity walkthrough

| البند | التفاصيل |
|-------|----------|
| **Pre-conditions** | اكتمال `PX-22-T01/T02/T05` |
| **Steps** | 1. البحث عن منتج 2. إضافته للسلة 3. تعديل الكمية/الخصم 4. اختيار الحساب 5. مراجعة checkout hierarchy |
| **Expected Results** | flow قصير وواضح، cart مرئية، totals مفهومة، والـ CTA الرئيسية واضحة |
| **Data Created** | e2e/runtime screenshots |
| **Rollback** | reset محلي |
| **Validates** | `PX-22-T01/T02/T05` |

### UAT-72: invoices readability and safe action grouping

| البند | التفاصيل |
|-------|----------|
| **Pre-conditions** | اكتمال `PX-22-T03` |
| **Steps** | 1. فتح invoice list/detail 2. مراجعة receipt actions 3. مراجعة return/cancel grouping 4. التحقق من risk styling |
| **Expected Results** | invoice detail أوضح، actions grouped، وadmin actions آمنة بصريًا |
| **Data Created** | screenshots/review notes |
| **Rollback** | N/A |
| **Validates** | `PX-22-T03` |

### UAT-73: debts summary and payment flow clarity

| البند | التفاصيل |
|-------|----------|
| **Pre-conditions** | اكتمال `PX-22-T04` |
| **Steps** | 1. فتح debts 2. اختيار عميل 3. مراجعة summary 4. تنفيذ/محاكاة payment action |
| **Expected Results** | debt summary واضحة، payment panel بارزة، وflow أقل ارتباكًا |
| **Data Created** | screenshots/e2e proof |
| **Rollback** | reset محلي |
| **Validates** | `PX-22-T04` |

---

## المجموعة 26: Operational Workspaces

### UAT-74: notifications inbox / alerts / search clarity

| البند | التفاصيل |
|-------|----------|
| **Pre-conditions** | اكتمال `PX-23-T01` |
| **Steps** | 1. فتح notifications 2. مراجعة inbox 3. مراجعة alerts summary 4. مراجعة search grouping |
| **Expected Results** | الأقسام الثلاثة واضحة ومفصولة، والتنقل إلى linked records سهل |
| **Data Created** | screenshots/review notes |
| **Rollback** | N/A |
| **Validates** | `PX-23-T01` |

### UAT-75: products catalog and admin usability

| البند | التفاصيل |
|-------|----------|
| **Pre-conditions** | اكتمال `PX-23-T02` |
| **Steps** | 1. التصفح بالـ grid/list 2. الفلترة حسب الفئة 3. مراجعة stock visibility 4. مراجعة admin controls |
| **Expected Results** | catalog قابلة للتصفح بصريًا، والـ admin controls grouped وواضحة |
| **Data Created** | screenshots/e2e proof |
| **Rollback** | N/A |
| **Validates** | `PX-23-T02` |

### UAT-76: operational master-detail ergonomics

| البند | التفاصيل |
|-------|----------|
| **Pre-conditions** | اكتمال `PX-23-T03/T04/T05` |
| **Steps** | 1. مراجعة inventory/suppliers/expenses/maintenance/operations 2. قياس سهولة الانتقال بين list/detail/action areas |
| **Expected Results** | الأسطح التشغيلية structured، أقل ازدحامًا، وأسهل قراءة على desktop/tablet/mobile |
| **Data Created** | screenshots/device notes |
| **Rollback** | N/A |
| **Validates** | `PX-23-T03/T04/T05` |

---

## المجموعة 27: Analytical + Configuration Surfaces

### UAT-77: reports filter-first analytical readability

| البند | التفاصيل |
|-------|----------|
| **Pre-conditions** | اكتمال `PX-24-T01/T02` |
| **Steps** | 1. فتح reports 2. تعديل filters 3. مراجعة KPI row 4. مراجعة charts/comparisons/tables |
| **Expected Results** | reports calmer، filter-first، وinsight-driven بدل flat data dump |
| **Data Created** | screenshots/review notes |
| **Rollback** | N/A |
| **Validates** | `PX-24-T01/T02` |

### UAT-78: settings and permissions safe hierarchy

| البند | التفاصيل |
|-------|----------|
| **Pre-conditions** | اكتمال `PX-24-T03` |
| **Steps** | 1. فتح settings/permissions 2. مراجعة groupings 3. مراجعة risk-aware sections 4. مراجعة confirmation hierarchy |
| **Expected Results** | الإعدادات أوضح، الصلاحيات أقل رهبة، والأفعال الحساسة بارزة كخطر |
| **Data Created** | screenshots/review notes |
| **Rollback** | N/A |
| **Validates** | `PX-24-T03` |

### UAT-79: portability and configuration progressive disclosure

| البند | التفاصيل |
|-------|----------|
| **Pre-conditions** | اكتمال `PX-24-T04/T05` |
| **Steps** | 1. فتح portability/configuration sections 2. مراجعة cards والوصف 3. مراجعة advanced detail reveal |
| **Expected Results** | configuration surfaces مفهومة مع progressive disclosure وبدون intimidation زائدة |
| **Data Created** | screenshots/device notes |
| **Rollback** | N/A |
| **Validates** | `PX-24-T04/T05` |

---

## المجموعة 28: Frontend UX Release Gate

### UAT-80: frontend redesign end-to-end walkthrough

| البند | التفاصيل |
|-------|----------|
| **Pre-conditions** | اكتمال `PX-21 .. PX-24` |
| **Steps** | 1. walkthrough كامل على `home → login → POS → notifications → products → invoices/debts → reports → settings` 2. مراجعة device/RTL/a11y/non-regression evidence 3. إصدار Go/No-Go |
| **Expected Results** | redesign cohesive، workflows سليمة، ولا يوجد technical leakage أو UX/device blockers |
| **Data Created** | report نهائي فقط |
| **Rollback** | N/A |
| **Validates** | `PX-25-T01/T02/T03/T04` |

---

**الإصدار:** 1.9
**تاريخ التحديث:** 13 مارس 2026
**التغييرات:** v1.9 — إضافة UAT-68..80 لتغطية حزمة Post-PX-20 Frontend Redesign (`PX-21 .. PX-25`) بما يشمل shell foundation, transactional UX, operational IA, analytical/configuration readability, وfrontend UX gate النهائي. v1.8 — إضافة UAT-52..67 لتغطية حزمة `Post-PX-14 Productization` (`PX-15 .. PX-20`) بما يشمل copy cleanup, navigation/IA, async feedback, accessibility/visual system, security/runtime/deployment hardening, وrelease gate النهائي. v1.7 — إضافة UAT-36..51 لتغطية `PX-08 .. PX-14` (المصروفات، الإشعارات، receipt links, WhatsApp, permissions, advanced reports, portability, restore drill, search, alert aggregation). v1.6 — إضافة UAT-33/34/35 لتغطية توافق الأجهزة (هاتف/تابلت/لابتوب) + اختبار تثبيت Web App.



