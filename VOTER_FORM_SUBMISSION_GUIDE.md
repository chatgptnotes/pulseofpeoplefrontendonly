# Voter Form Submission Guide

## Quick Start

### Step 1: Create the Function (One-time setup)
Run this in your database to create the form submission function:

```sql
-- Copy the function definition from submit_voter_form.sql (lines 31-134)
-- Or run the entire file
```

### Step 2: Submit Form Data
Use this simple query format:

```sql
SELECT * FROM insert_voter_from_form(
    p_full_name := 'Rajesh Kumar',
    p_age := 35,
    p_gender := 'Male',
    p_voter_id_card := 'TN12345678901',
    p_phone_number := '+91-9876543210',
    p_email := 'rajesh@example.com',
    p_caste := 'OBC',
    p_religion := 'Hindu',
    p_education := 'Graduate',
    p_occupation := 'Engineer',
    p_constituency := 'Chennai North',
    p_booth := 'Booth-42',
    p_address := '123, Anna Nagar, Chennai',
    p_political_interests := '["Infrastructure", "Education"]'::jsonb
);
```

## Form Field Mapping

**IMPORTANT:** Your database only has `first_name` column. The `last_name` and `middle_name` columns don't exist in your actual database.

| Form Field | Database Column | Transformation |
|------------|----------------|----------------|
| Full Name | `first_name` | Entire name stored in first_name (no splitting) |
| Age | `age` | Direct |
| Gender | `gender` | Converted to lowercase |
| Voter ID Card | `voter_id` | Direct |
| Phone Number | `phone` | Direct |
| Email | `email` | Direct |
| Caste | `caste` | Direct |
| Religion | `religion` | Direct |
| Education | `education` | Direct |
| Occupation | `occupation` | Direct |
| Constituency | `constituency_id` | Looks up constituency ID by name |
| Booth | `ward` | Direct |
| Address | `address_line1` | Direct |
| Political Interests (checkboxes) | `tags` | Converted to JSONB array |

## Political Interests Examples

```sql
-- No interests selected
p_political_interests := '[]'::jsonb

-- One interest
p_political_interests := '["Infrastructure"]'::jsonb

-- Multiple interests
p_political_interests := '["Infrastructure", "Education", "Healthcare"]'::jsonb

-- All interests
p_political_interests := '["Infrastructure", "Education", "Healthcare", "Employment", "Women Safety", "Economic Policy", "Environment", "Technology"]'::jsonb
```

## Response Format

The function returns three columns:

| Column | Type | Description |
|--------|------|-------------|
| `success` | BOOLEAN | `true` if successful, `false` if error |
| `message` | TEXT | Success message or error description |
| `voter_id` | UUID | ID of inserted voter (NULL on error) |

### Success Response
```
success | message                     | voter_id
--------|-----------------------------|---------------------------------
true    | Voter added successfully    | 550e8400-e29b-41d4-a716-446655440000
```

### Error Response
```
success | message                  | voter_id
--------|--------------------------|----------
false   | Voter ID already exists  | NULL
```

## Schema Mismatch Issues

**Your database schema differs from the migration files!**

- **Migration files suggest:** `first_name`, `middle_name`, `last_name` columns
- **Your actual database has:** `first_name` column only
- **Solution:** All SQL files have been updated to work with your actual schema

If you want to add the missing columns to match the migration files, run:
```bash
check_voters_schema.sql         # First, verify your schema
add_missing_voter_columns.sql   # Then add columns (optional)
```

## Common Errors & Solutions

### Error: "column last_name does not exist"
**Cause:** Trying to use old SQL files that reference non-existent columns
**Solution:** Use the updated SQL files (all references to `last_name` and `middle_name` have been removed)

### Error: "Voter ID already exists"
**Solution:** Each voter_id must be unique. Check if the voter already exists:
```sql
SELECT * FROM voters WHERE voter_id = 'TN12345678901';
```

### Error: "Constituency not found"
**Solution:** Check available constituencies:
```sql
SELECT name FROM constituencies ORDER BY name;
```

### Error: "Function does not exist"
**Solution:** Create the function first by running the `submit_voter_form.sql` file.

## Alternative: Direct INSERT (Without Function)

If you don't want to use the function:

```sql
INSERT INTO voters (
    voter_id,
    first_name,
    last_name,
    age,
    gender,
    phone,
    email,
    caste,
    religion,
    education,
    occupation,
    constituency_id,
    ward,
    address_line1,
    tags,
    party_affiliation,
    sentiment,
    is_active,
    is_verified
)
VALUES (
    'TN12345678901',
    'Rajesh',
    'Kumar',
    35,
    'male',
    '+91-9876543210',
    'rajesh@example.com',
    'OBC',
    'Hindu',
    'Graduate',
    'Engineer',
    (SELECT id FROM constituencies WHERE name = 'Chennai North' LIMIT 1),
    'Booth-42',
    '123, Anna Nagar, Chennai',
    '["Infrastructure", "Education"]'::jsonb,
    'neutral',
    'neutral',
    true,
    false
);
```

## Frontend Integration (Supabase)

```javascript
const formData = {
  fullName: 'Rajesh Kumar',
  age: 35,
  gender: 'Male',
  voterIdCard: 'TN12345678901',
  phoneNumber: '+91-9876543210',
  email: 'rajesh@example.com',
  caste: 'OBC',
  religion: 'Hindu',
  education: 'Graduate',
  occupation: 'Engineer',
  constituency: 'Chennai North',
  booth: 'Booth-42',
  address: '123, Anna Nagar, Chennai',
  politicalInterests: ['Infrastructure', 'Education']
};

const { data, error } = await supabase.rpc('insert_voter_from_form', {
  p_full_name: formData.fullName,
  p_age: parseInt(formData.age),
  p_gender: formData.gender.toLowerCase(),
  p_voter_id_card: formData.voterIdCard,
  p_phone_number: formData.phoneNumber,
  p_email: formData.email || null,
  p_caste: formData.caste || null,
  p_religion: formData.religion || null,
  p_education: formData.education || null,
  p_occupation: formData.occupation || null,
  p_constituency: formData.constituency || null,
  p_booth: formData.booth || null,
  p_address: formData.address || null,
  p_political_interests: JSON.stringify(formData.politicalInterests)
});

if (data && data[0].success) {
  console.log('✓ Voter added successfully');
  console.log('Voter ID:', data[0].voter_id);
  // Show success message to user
} else {
  console.error('✗ Error:', data ? data[0].message : error.message);
  // Show error message to user
}
```

## Files Created

1. **submit_voter_form.sql** - Complete SQL solution with function, examples, and documentation (UPDATED - works without last_name)
2. **VOTER_FORM_SUBMISSION_GUIDE.md** - This guide (UPDATED)
3. **insert_voter_data.sql** - INSERT query templates (UPDATED - works without last_name)
4. **drop_booth_trigger.sql** - Fix for trigger errors
5. **check_voters_schema.sql** - NEW: Diagnostic queries to verify your actual database schema
6. **add_missing_voter_columns.sql** - NEW: Optional migration to add last_name/middle_name columns

## Next Steps

1. ✅ **FIRST:** Run `check_voters_schema.sql` to verify which columns actually exist in your database
2. ✅ Run `drop_booth_trigger.sql` (if you haven't already) to remove problematic trigger
3. ✅ Run `submit_voter_form.sql` to create the form submission function (updated for your schema)
4. ✅ Test with the example queries in `submit_voter_form.sql`
5. ✅ Integrate with your frontend using the JavaScript example above
6. ⚙️ **OPTIONAL:** Run `add_missing_voter_columns.sql` if you want to add last_name/middle_name columns
