# F1 Backfill Execution Log — 2026-04-29

Backfill for pentest finding F1 (Monday 11876217234). Encrypts 8 PII booking fields that were stored as plaintext.

---

## Pre-flight

| Metric | Value |
|--------|-------|
| Total bookings | 21 |
| Real-account bookings | 11 |
| Test-account bookings | 10 |

### Non-null field counts (pre-backfill)

| Field | Non-null rows | All plaintext? |
|-------|--------------|----------------|
| location_address | 4 | Yes |
| prep_notes | 3 | Yes |
| onsite_contact_name | 3 | Yes |
| onsite_contact_phone | 3 | Yes |
| onsite_contact_email | 3 | Yes |
| meeting_link | 2 | Yes |
| requester_name | 21 | Yes |
| context_video_url | 0 | N/A |

---

## Dry Run

```
Mode: DRY-RUN (read only)
Found 21 rows with at least one plaintext PII field
Scanned: 21
Updated: 21
Skipped: 0 (already encrypted)
Failed:  0
```

---

## Apply Run

```
Mode: APPLY (will write changes)
Found 21 rows with at least one plaintext PII field

Batch 1 (rows 1–21):
  98e5fb5f — 1 field (requester_name) -> Updated
  c1693b7b — 6 fields (location_address, prep_notes, onsite_contact_name, onsite_contact_phone, onsite_contact_email, requester_name) -> Updated
  4c1b7c1f — 2 fields (location_address, requester_name) -> Updated
  5157cb40 — 5 fields (prep_notes, onsite_contact_name, onsite_contact_phone, onsite_contact_email, requester_name) -> Updated
  e37e9510 — 1 field (requester_name) -> Updated
  26a23558 — 1 field (requester_name) -> Updated
  a4382e43 — 2 fields (meeting_link, requester_name) -> Updated
  c0a49feb — 1 field (requester_name) -> Updated
  edb82116 — 1 field (requester_name) -> Updated
  1cfef1c5 — 2 fields (meeting_link, requester_name) -> Updated
  7d615c90 — 1 field (requester_name) -> Updated
  c4cbe2c8 — 1 field (requester_name) -> Updated
  20295ef3 — 2 fields (location_address, requester_name) -> Updated
  885667c1 — 1 field (requester_name) -> Updated
  60230a5e — 2 fields (location_address, requester_name) -> Updated
  df8ae249 — 1 field (requester_name) -> Updated
  3330e9f0 — 1 field (requester_name) -> Updated
  346302ca — 5 fields (prep_notes, onsite_contact_name, onsite_contact_phone, onsite_contact_email, requester_name) -> Updated
  0cf52fbe — 1 field (requester_name) -> Updated
  a37f7ecd — 1 field (requester_name) -> Updated
  7320faa7 — 1 field (requester_name) -> Updated

Summary:
  Scanned: 21
  Updated: 21
  Skipped: 0 (already encrypted)
  Failed:  0
```

---

## Verification

### Zero-plaintext check (all must be 0)

| Field | Plaintext remaining |
|-------|-------------------|
| location_address | **0** |
| prep_notes | **0** |
| onsite_contact_name | **0** |
| onsite_contact_phone | **0** |
| onsite_contact_email | **0** |
| meeting_link | **0** |
| requester_name | **0** |
| context_video_url | **0** |

### Raw DB read (3 sample rows — ciphertext confirmed)

| Row ID | Field | Raw DB value |
|--------|-------|-------------|
| 1cfef1c5 | requester_name | `enc:ZHX4dz0qv5/QFSNn7M14mw==:vPl9ChLwKnCEFerSWpuW6w==:AJzZPN7uyEJDshDO2Vj4vwDN` |
| c1693b7b | location_address | `enc:oDBpS5yw+z7/nh1EDl+qdg==:+SvY2V83tVwNOFcFrlrSdw==:Q/YiN8oUBEqqEY6sFn8=` |
| 346302ca | onsite_contact_name | `enc:Za9aQJIhsmGXC1qSjS0cOQ==:zvXfYBZxdnvy/3yYs5gFYg==:eJZX1CtMnZLZVwnZHg==` |

### Decryption round-trip (3 samples)

| Row ID | Field | Decrypted plaintext |
|--------|-------|-------------------|
| 1cfef1c5 | requester_name | Molly Sano-Mahgoub |
| c1693b7b | location_address | 616 N 47th St. |
| 346302ca | onsite_contact_name | Jordan Rivera |

### Idempotency check

Re-running the script in dry-run mode after backfill:
```
Scanned: 21
Updated: 0
Skipped: 21 (already encrypted)
Failed:  0
```

---

## Final state

Zero plaintext remains on any of the 8 PII booking fields. All non-null values are AES-256-GCM encrypted with `enc:` prefix. Decryption verified end-to-end.
