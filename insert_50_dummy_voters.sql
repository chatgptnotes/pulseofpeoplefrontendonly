-- ============================================================================
-- 50 DUMMY VOTERS - TAMIL NADU & PONDICHERRY
-- Form Field Mapping for VoterDatabase Component
-- ============================================================================

-- ============================================================================
-- STEP 1: DROP PROBLEMATIC TRIGGER FIRST
-- ============================================================================
-- This trigger references non-existent polling_booth_id column and blocks inserts
-- Must be dropped before inserting voters

-- Drop function with CASCADE to automatically drop dependent triggers
DROP FUNCTION IF EXISTS update_booth_voter_count() CASCADE;

SELECT 'Trigger and function dropped successfully - ready to insert voters' AS status;

-- ============================================================================
-- STEP 2: INSERT 50 DUMMY VOTERS
-- ============================================================================
-- Insert 50 realistic dummy voter records
INSERT INTO voters (
    voter_id,
    first_name,
    age,
    gender,
    phone,
    email,
    caste,
    religion,
    education,
    occupation,
    ward,
    address_line1,
    tags,
    party_affiliation,
    sentiment,
    is_active,
    is_verified
) VALUES
-- Voter 1
('AC87686', 'Priyanshu Sharma', 22, 'female', '9090909090', 'anas@gmail.com', 'General', 'Hindu', 'Graduate', 'Teacher', '1', 'alangudi', '["Healthcare", "Environment"]'::jsonb, 'neutral', 'neutral', true, false),

-- Voter 2
('AC12345', 'Rajesh Kumar', 35, 'male', '9876543210', 'rajesh.k@gmail.com', 'OBC', 'Hindu', 'Post Graduate', 'Engineer', '5', '45, Anna Nagar, Chennai', '["Infrastructure", "Technology"]'::jsonb, 'neutral', 'neutral', true, false),

-- Voter 3
('AC23456', 'Lakshmi Devi', 42, 'female', '9845612378', 'lakshmi.devi@yahoo.com', 'SC', 'Hindu', 'Secondary', 'Homemaker', '12', '78, T Nagar, Chennai', '["Education", "Women Safety"]'::jsonb, 'neutral', 'neutral', true, false),

-- Voter 4
('AC34567', 'Mohammed Ali', 28, 'male', '9123456789', 'ali.mohammed@gmail.com', 'General', 'Muslim', 'Graduate', 'Business Owner', '8', '23, Perambur, Chennai', '["Economic Policy", "Employment"]'::jsonb, 'neutral', 'neutral', true, false),

-- Voter 5
('AC45678', 'Kavitha Subramanian', 31, 'female', '9234567890', 'kavitha.s@gmail.com', 'General', 'Hindu', 'Post Graduate', 'Doctor', '15', '56, Adyar, Chennai', '["Healthcare", "Education"]'::jsonb, 'neutral', 'neutral', true, false),

-- Voter 6
('AC56789', 'Arjun Patel', 25, 'male', '9345678901', 'arjun.patel@gmail.com', 'OBC', 'Hindu', 'Graduate', 'Software Developer', '3', '89, Velachery, Chennai', '["Technology", "Infrastructure"]'::jsonb, 'neutral', 'neutral', true, false),

-- Voter 7
('AC67890', 'Deepa Rani', 45, 'female', '9456789012', 'deepa.rani@yahoo.com', 'General', 'Hindu', 'Primary', 'Farmer', '20', '12, Tiruvallur District', '["Environment", "Women Safety"]'::jsonb, 'neutral', 'neutral', true, false),

-- Voter 8
('AC78901', 'Suresh Babu', 38, 'male', '9567890123', 'suresh.babu@gmail.com', 'SC', 'Hindu', 'Secondary', 'Driver', '7', '34, Tambaram, Chennai', '["Employment", "Infrastructure"]'::jsonb, 'neutral', 'neutral', true, false),

-- Voter 9
('AC89012', 'Anitha Krishnan', 29, 'female', '9678901234', 'anitha.k@gmail.com', 'General', 'Hindu', 'Post Graduate', 'Lecturer', '18', '67, Guindy, Chennai', '["Education", "Technology"]'::jsonb, 'neutral', 'neutral', true, false),

-- Voter 10
('AC90123', 'Vijay Kumar', 41, 'male', '9789012345', 'vijay.kumar@gmail.com', 'OBC', 'Hindu', 'Graduate', 'Government Employee', '22', '45, Porur, Chennai', '["Infrastructure", "Economic Policy"]'::jsonb, 'neutral', 'neutral', true, false),

-- Voter 11
('AC01234', 'Fatima Begum', 33, 'female', '9890123456', 'fatima.begum@gmail.com', 'General', 'Muslim', 'Graduate', 'Teacher', '9', '78, Royapuram, Chennai', '["Education", "Women Safety"]'::jsonb, 'neutral', 'neutral', true, false),

-- Voter 12
('AC11223', 'Ramesh Chandran', 52, 'male', '9901234567', 'ramesh.c@yahoo.com', 'General', 'Hindu', 'Secondary', 'Shop Owner', '14', '90, Mylapore, Chennai', '["Economic Policy", "Employment"]'::jsonb, 'neutral', 'neutral', true, false),

-- Voter 13
('AC22334', 'Priya Nair', 27, 'female', '9012345678', 'priya.nair@gmail.com', 'OBC', 'Hindu', 'Post Graduate', 'Banker', '6', '12, Nungambakkam, Chennai', '["Technology", "Healthcare"]'::jsonb, 'neutral', 'neutral', true, false),

-- Voter 14
('AC33445', 'Karthik Raman', 36, 'male', '9123456780', 'karthik.raman@gmail.com', 'General', 'Hindu', 'Graduate', 'Accountant', '11', '34, Kodambakkam, Chennai', '["Economic Policy", "Infrastructure"]'::jsonb, 'neutral', 'neutral', true, false),

-- Voter 15
('AC44556', 'Meera Sundaram', 48, 'female', '9234567891', 'meera.sundaram@yahoo.com', 'SC', 'Hindu', 'Primary', 'Tailor', '25', '56, Saidapet, Chennai', '["Employment", "Women Safety"]'::jsonb, 'neutral', 'neutral', true, false),

-- Voter 16
('AC55667', 'Arun Prakash', 32, 'male', '9345678902', 'arun.prakash@gmail.com', 'General', 'Hindu', 'Post Graduate', 'Architect', '4', '78, Besant Nagar, Chennai', '["Infrastructure", "Environment"]'::jsonb, 'neutral', 'neutral', true, false),

-- Voter 17
('AC66778', 'Divya Menon', 26, 'female', '9456789013', 'divya.menon@gmail.com', 'OBC', 'Hindu', 'Graduate', 'Nurse', '17', '90, Kilpauk, Chennai', '["Healthcare", "Education"]'::jsonb, 'neutral', 'neutral', true, false),

-- Voter 18
('AC77889', 'Sanjay Kumar', 44, 'male', '9567890124', 'sanjay.kumar@gmail.com', 'General', 'Hindu', 'Graduate', 'Police Officer', '21', '12, Ashok Nagar, Chennai', '["Infrastructure", "Technology"]'::jsonb, 'neutral', 'neutral', true, false),

-- Voter 19
('AC88990', 'Geetha Lakshmi', 39, 'female', '9678901235', 'geetha.lakshmi@yahoo.com', 'SC', 'Hindu', 'Secondary', 'Domestic Worker', '13', '34, Virugambakkam, Chennai', '["Employment", "Women Safety"]'::jsonb, 'neutral', 'neutral', true, false),

-- Voter 20
('AC99001', 'Naveen Kumar', 30, 'male', '9789012346', 'naveen.kumar@gmail.com', 'OBC', 'Hindu', 'Post Graduate', 'Marketing Manager', '19', '56, Egmore, Chennai', '["Economic Policy", "Technology"]'::jsonb, 'neutral', 'neutral', true, false),

-- Voter 21
('AC10112', 'Selvi Murugan', 55, 'female', '9890123467', 'selvi.murugan@gmail.com', 'General', 'Hindu', 'Primary', 'Farmer', '28', '78, Tiruvallur', '["Environment", "Infrastructure"]'::jsonb, 'neutral', 'neutral', true, false),

-- Voter 22
('AC21223', 'Abdul Rahman', 43, 'male', '9901234578', 'abdul.rahman@gmail.com', 'General', 'Muslim', 'Graduate', 'Electrician', '10', '90, Anna Nagar, Chennai', '["Employment", "Technology"]'::jsonb, 'neutral', 'neutral', true, false),

-- Voter 23
('AC32334', 'Bhavani Devi', 34, 'female', '9012345689', 'bhavani.devi@yahoo.com', 'OBC', 'Hindu', 'Graduate', 'Social Worker', '16', '12, Triplicane, Chennai', '["Women Safety", "Healthcare"]'::jsonb, 'neutral', 'neutral', true, false),

-- Voter 24
('AC43445', 'Murali Krishna', 37, 'male', '9123456791', 'murali.krishna@gmail.com', 'General', 'Hindu', 'Post Graduate', 'Professor', '23', '34, Madhavaram, Chennai', '["Education", "Infrastructure"]'::jsonb, 'neutral', 'neutral', true, false),

-- Voter 25
('AC54556', 'Sangeetha Rao', 29, 'female', '9234567892', 'sangeetha.rao@gmail.com', 'SC', 'Hindu', 'Graduate', 'Designer', '2', '56, Palavakkam, Chennai', '["Technology", "Education"]'::jsonb, 'neutral', 'neutral', true, false),

-- Voter 26
('AC65667', 'Prakash Reddy', 46, 'male', '9345678903', 'prakash.reddy@gmail.com', 'General', 'Hindu', 'Secondary', 'Mechanic', '27', '78, Ambattur, Chennai', '["Employment", "Infrastructure"]'::jsonb, 'neutral', 'neutral', true, false),

-- Voter 27
('AC76778', 'Nisha Pillai', 24, 'female', '9456789014', 'nisha.pillai@gmail.com', 'OBC', 'Hindu', 'Post Graduate', 'Journalist', '8', '90, Kotturpuram, Chennai', '["Education", "Technology"]'::jsonb, 'neutral', 'neutral', true, false),

-- Voter 28
('AC87889', 'Ravi Shankar', 50, 'male', '9567890125', 'ravi.shankar@yahoo.com', 'General', 'Hindu', 'Graduate', 'Businessman', '30', '12, Coimbatore', '["Economic Policy", "Infrastructure"]'::jsonb, 'neutral', 'neutral', true, false),

-- Voter 29
('AC98990', 'Malathi Sundaram', 40, 'female', '9678901236', 'malathi.sundaram@gmail.com', 'SC', 'Hindu', 'Primary', 'Cook', '14', '34, Kanchipuram', '["Employment", "Women Safety"]'::jsonb, 'neutral', 'neutral', true, false),

-- Voter 30
('AC09001', 'Dinesh Kumar', 33, 'male', '9789012347', 'dinesh.kumar@gmail.com', 'OBC', 'Hindu', 'Graduate', 'Salesman', '26', '56, Vellore', '["Employment", "Economic Policy"]'::jsonb, 'neutral', 'neutral', true, false),

-- Voter 31
('AC19112', 'Saranya Krishnan', 28, 'female', '9890123468', 'saranya.krishnan@gmail.com', 'General', 'Hindu', 'Post Graduate', 'Research Scholar', '7', '78, Anna University, Chennai', '["Education", "Technology"]'::jsonb, 'neutral', 'neutral', true, false),

-- Voter 32
('AC29223', 'Venkatesh Iyer', 41, 'male', '9901234579', 'venkatesh.iyer@gmail.com', 'General', 'Hindu', 'Graduate', 'Auditor', '15', '90, West Mambalam, Chennai', '["Economic Policy", "Infrastructure"]'::jsonb, 'neutral', 'neutral', true, false),

-- Voter 33
('AC39334', 'Radhika Balan', 35, 'female', '9012345690', 'radhika.balan@yahoo.com', 'OBC', 'Hindu', 'Graduate', 'HR Manager', '11', '12, Teynampet, Chennai', '["Employment", "Women Safety"]'::jsonb, 'neutral', 'neutral', true, false),

-- Voter 34
('AC49445', 'Subramaniam Pillai', 58, 'male', '9123456792', 'subramaniam.pillai@gmail.com', 'General', 'Hindu', 'Post Graduate', 'Retired Officer', '32', '34, Chengalpattu', '["Healthcare", "Infrastructure"]'::jsonb, 'neutral', 'neutral', true, false),

-- Voter 35
('AC59556', 'Janaki Ammal', 47, 'female', '9234567893', 'janaki.ammal@gmail.com', 'SC', 'Hindu', 'Secondary', 'Vegetable Vendor', '20', '56, Arumbakkam, Chennai', '["Employment", "Women Safety"]'::jsonb, 'neutral', 'neutral', true, false),

-- Voter 36
('AC69667', 'Balaji Natarajan', 31, 'male', '9345678904', 'balaji.natarajan@gmail.com', 'General', 'Hindu', 'Post Graduate', 'Data Analyst', '5', '78, Velachery, Chennai', '["Technology", "Education"]'::jsonb, 'neutral', 'neutral', true, false),

-- Voter 37
('AC79778', 'Parvathi Devi', 36, 'female', '9456789015', 'parvathi.devi@gmail.com', 'OBC', 'Hindu', 'Graduate', 'Bank Manager', '18', '90, Adambakkam, Chennai', '["Economic Policy", "Healthcare"]'::jsonb, 'neutral', 'neutral', true, false),

-- Voter 38
('AC89889', 'Senthil Kumar', 45, 'male', '9567890126', 'senthil.kumar@yahoo.com', 'General', 'Hindu', 'Secondary', 'Auto Driver', '24', '12, Madurai', '["Employment", "Infrastructure"]'::jsonb, 'neutral', 'neutral', true, false),

-- Voter 39
('AC99990', 'Revathi Sundaram', 32, 'female', '9678901237', 'revathi.sundaram@gmail.com', 'SC', 'Hindu', 'Graduate', 'Pharmacist', '9', '34, Chrompet, Chennai', '["Healthcare", "Education"]'::jsonb, 'neutral', 'neutral', true, false),

-- Voter 40
('AC00101', 'Harish Venkat', 27, 'male', '9789012348', 'harish.venkat@gmail.com', 'OBC', 'Hindu', 'Post Graduate', 'Civil Engineer', '13', '56, Pallavaram, Chennai', '["Infrastructure", "Environment"]'::jsonb, 'neutral', 'neutral', true, false),

-- Voter 41
('AC11212', 'Sumathi Rajan', 49, 'female', '9890123469', 'sumathi.rajan@gmail.com', 'General', 'Hindu', 'Primary', 'Daily Wage Worker', '29', '78, Sholinganallur, Chennai', '["Employment", "Women Safety"]'::jsonb, 'neutral', 'neutral', true, false),

-- Voter 42
('AC22323', 'Ibrahim Khan', 38, 'male', '9901234580', 'ibrahim.khan@gmail.com', 'General', 'Muslim', 'Graduate', 'Textile Merchant', '12', '90, Trichy', '["Economic Policy", "Employment"]'::jsonb, 'neutral', 'neutral', true, false),

-- Voter 43
('AC33434', 'Shanthi Mani', 30, 'female', '9012345691', 'shanthi.mani@yahoo.com', 'OBC', 'Hindu', 'Graduate', 'Beautician', '16', '12, Chromepet, Chennai', '["Employment", "Women Safety"]'::jsonb, 'neutral', 'neutral', true, false),

-- Voter 44
('AC44545', 'Ganesh Moorthy', 42, 'male', '9123456793', 'ganesh.moorthy@gmail.com', 'General', 'Hindu', 'Post Graduate', 'Scientist', '22', '34, IIT Madras Campus, Chennai', '["Technology", "Education"]'::jsonb, 'neutral', 'neutral', true, false),

-- Voter 45
('AC55656', 'Vasanthi Rao', 37, 'female', '9234567894', 'vasanthi.rao@gmail.com', 'SC', 'Hindu', 'Secondary', 'Anganwadi Worker', '19', '56, Poonamallee, Chennai', '["Healthcare", "Women Safety"]'::jsonb, 'neutral', 'neutral', true, false),

-- Voter 46
('AC66767', 'Mohan Das', 51, 'male', '9345678905', 'mohan.das@gmail.com', 'General', 'Hindu', 'Graduate', 'Insurance Agent', '25', '78, Salem', '["Economic Policy", "Infrastructure"]'::jsonb, 'neutral', 'neutral', true, false),

-- Voter 47
('AC77878', 'Lavanya Menon', 26, 'female', '9456789016', 'lavanya.menon@gmail.com', 'OBC', 'Hindu', 'Post Graduate', 'Content Writer', '6', '90, Puducherry', '["Technology", "Education"]'::jsonb, 'neutral', 'neutral', true, false),

-- Voter 48
('AC88989', 'Krishnan Nair', 44, 'male', '9567890127', 'krishnan.nair@yahoo.com', 'General', 'Hindu', 'Secondary', 'Security Guard', '31', '12, Kancheepuram', '["Employment", "Infrastructure"]'::jsonb, 'neutral', 'neutral', true, false),

-- Voter 49
('AC99090', 'Padmini Kumar', 39, 'female', '9678901238', 'padmini.kumar@gmail.com', 'SC', 'Hindu', 'Primary', 'House Maid', '17', '34, Thiruvanmiyur, Chennai', '["Employment", "Women Safety"]'::jsonb, 'neutral', 'neutral', true, false),

-- Voter 50
('AC00201', 'Vignesh Raja', 29, 'male', '9789012349', 'vignesh.raja@gmail.com', 'OBC', 'Hindu', 'Post Graduate', 'Mobile App Developer', '4', '56, OMR, Chennai', '["Technology", "Infrastructure"]'::jsonb, 'neutral', 'neutral', true, false);

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- Run this after insertion to verify all 50 voters were added

SELECT COUNT(*) as total_inserted FROM voters
WHERE voter_id IN (
    'AC87686', 'AC12345', 'AC23456', 'AC34567', 'AC45678',
    'AC56789', 'AC67890', 'AC78901', 'AC89012', 'AC90123',
    'AC01234', 'AC11223', 'AC22334', 'AC33445', 'AC44556',
    'AC55667', 'AC66778', 'AC77889', 'AC88990', 'AC99001',
    'AC10112', 'AC21223', 'AC32334', 'AC43445', 'AC54556',
    'AC65667', 'AC76778', 'AC87889', 'AC98990', 'AC09001',
    'AC19112', 'AC29223', 'AC39334', 'AC49445', 'AC59556',
    'AC69667', 'AC79778', 'AC89889', 'AC99990', 'AC00101',
    'AC11212', 'AC22323', 'AC33434', 'AC44545', 'AC55656',
    'AC66767', 'AC77878', 'AC88989', 'AC99090', 'AC00201'
);

-- View sample of inserted voters
SELECT
    voter_id,
    first_name as full_name,
    age,
    gender,
    phone,
    occupation,
    ward as booth,
    tags as political_interests
FROM voters
WHERE voter_id IN ('AC87686', 'AC12345', 'AC23456', 'AC34567', 'AC45678')
ORDER BY voter_id;

-- ============================================================================
-- STATISTICS
-- ============================================================================

-- Gender distribution
SELECT gender, COUNT(*) as count
FROM voters
WHERE voter_id LIKE 'AC%'
GROUP BY gender;

-- Caste distribution
SELECT caste, COUNT(*) as count
FROM voters
WHERE voter_id LIKE 'AC%'
GROUP BY caste
ORDER BY count DESC;

-- Education distribution
SELECT education, COUNT(*) as count
FROM voters
WHERE voter_id LIKE 'AC%'
GROUP BY education
ORDER BY count DESC;

-- Age groups
SELECT
    CASE
        WHEN age BETWEEN 18 AND 25 THEN '18-25'
        WHEN age BETWEEN 26 AND 35 THEN '26-35'
        WHEN age BETWEEN 36 AND 45 THEN '36-45'
        WHEN age BETWEEN 46 AND 55 THEN '46-55'
        ELSE '56+'
    END as age_group,
    COUNT(*) as count
FROM voters
WHERE voter_id LIKE 'AC%'
GROUP BY age_group
ORDER BY age_group;
