# Test Files & Verification Prompts

This directory contains test files for validating **Readr's deterministic passage retrieval engine** across formats (`.txt`, `.csv`, `.md`).

---

## 1. `contacts.csv` (Spreadsheet Test)
**Description:** Employee contact roster in comma-separated values format.

### Recommended Test Prompts:
* **"what is Oluwatobi last name?"**
  * Expected Match: `Oluwatobi,Adebayo,42 Marina Road,Lagos...`
  * Matched tokens: `oluwatobi`, `last`, `name`
* **"what street does Oluwatobi live on?"**
  * Expected Match: `Oluwatobi,Adebayo,42 Marina Road,Lagos...`
  * Matched tokens: `street`, `oluwatobi`
* **"what is Chinedu role and street?"**
  * Expected Match: `Chinedu,Okafor,15 Admiralty Way,Lekki,Staff Engineer...`
  * Matched tokens: `chinedu`, `role`, `street`
* **"who is the Product Designer?"**
  * Expected Match: `Fatima,Bello,8 Ahmadu Bello Way,Abuja,Product Designer...`
* **"who lives in London?"**
  * Expected Result: **Nothing found** (London is not in the document)

---

## 2. `offer_letter.txt` (Letter Document Test)
**Description:** Official employment offer letter to Oluwatobi Adebayo.

### Recommended Test Prompts:
* **"what is Oluwatobi last name?"**
  * Expected Match: `Dear Oluwatobi Adebayo...`
* **"what street is Oluwatobi primary residence on?"**
  * Expected Match: `Your primary residence on record is 14 Bourdillon Street, Ikoyi.`
  * Matched tokens: `residence`, `street`, `oluwatobi`
* **"what is the starting annual base salary?"**
  * Expected Match: `Your starting annual base salary will be $140,000 effective January 15, 2026.`
  * Matched tokens: `starting`, `annual`, `base`, `salary`
* **"who does the candidate report to?"**
  * Expected Match: `Reporting directly to the CTO, you will lead the deterministic passage retrieval initiative.`
  * Matched tokens: `report`, `candidate` (or `cto`)
* **"what is the stock options grant?"**
  * Expected Result: **Nothing found** (No equity mentioned in letter)

---

## 3. `sample.txt` (Company Overview Test)
**Description:** High-level corporate overview of Acme Technologies.

### Recommended Test Prompts:
* **"when was acme founded?"**
  * Expected Match: `Acme Technologies was founded in 2018 in San Francisco.`
* **"What was the revenue in 2025?"**
  * Expected Match: `In fiscal year 2025, Acme reported an annual recurring revenue of $42.5 million.`
* **"how many engineers work at acme?"**
  * Expected Match: `The company employs 150 engineers across three continents.`
* **"what is the flagship product?"**
  * Expected Match: `Their flagship product is Readr, a deterministic document search engine.`
* **"who led the series A round?"**
  * Expected Match: `Acme raised a $12M Series A round led by Horizon Ventures.`
* **"who is the CEO of Acme?"**
  * Expected Result: **Nothing found**

---

## 4. `company_policy.md` (Markdown Test)
**Description:** Markdown document with headers and HR policy clauses.

### Recommended Test Prompts:
* **"what is the equipment stipend for new hires?"**
  * Expected Match: `Full-time staff receive a one-time home office setup grant of $2,500 during their first 30 days.`
* **"how much is the annual learning budget?"**
  * Expected Match: `Every full-time employee has access to an annual education stipend of $1,800 for books, conferences...`
* **"what are the core working hours?"**
  * Expected Match: `All engineering team members are expected to be available for team syncs between 10:00 AM and 3:00 PM UTC.`
* **"how many days of paid annual leave?"**
  * Expected Match: `Acme provides 25 days of paid annual leave in addition to statutory public holidays.`

