# 🔧 FINAL FIX - Admin Permission के लिए

## ⚡ बस यह SQL चलाओ (2 minutes)

### Step 1: Supabase Dashboard खोलो
https://supabase.com/dashboard/project/eepwbydlfecosaqdysho/sql/new

### Step 2: यह SQL copy-paste करो:

```sql
-- Fix RLS function to allow seed admins to create voters
DROP FUNCTION IF EXISTS get_current_user_role();

CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
    user_email TEXT;
BEGIN
    -- First try by auth_user_id (normal way)
    SELECT role INTO user_role
    FROM users
    WHERE auth_user_id = auth.uid();

    -- If not found, try by email (for seed accounts)
    IF user_role IS NULL THEN
        SELECT email INTO user_email
        FROM auth.users
        WHERE id = auth.uid();

        IF user_email IS NOT NULL THEN
            SELECT role INTO user_role
            FROM users
            WHERE email = user_email;
        END IF;
    END IF;

    RETURN COALESCE(user_role, 'viewer');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Step 3: "Run" button दबाओ

✅ Success message आना चाहिए!

### Step 4: Browser में जाओ और page refresh करो (F5)

### Step 5: Voter add करो

✅ **अब काम करेगा!** Permission error नहीं आएगी!

---

## 🎯 यह क्या करता है?

यह RLS function को update करता है जो अब **दो तरीकों** से check करता है:

1. **पहले:** auth_user_id से match करता है (normal way)
2. **अगर नहीं मिला:** Email से match करता है (seed accounts के लिए)

इससे **सभी admin accounts** (जिनका role 'admin' है database में) voter create कर सकेंगे, चाहे उनका auth_user_id match करे या न करे!

---

## ✅ After Running:

- shanthi.sundaram.admin1@tvk.com ✅ काम करेगा
- bhuppendrabalapure@gmail.com ✅ काम करेगा
- कोई भी admin role वाला account ✅ काम करेगा

**बस SQL run करो और test करो!** 🚀
