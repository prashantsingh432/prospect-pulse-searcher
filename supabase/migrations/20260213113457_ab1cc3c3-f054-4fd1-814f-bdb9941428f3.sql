-- Strip +91 prefix from all existing sim numbers
UPDATE sim_master SET sim_number = REPLACE(sim_number, '+91', '') WHERE sim_number LIKE '+91%';

-- Also fix any that start with just '91' and are 12 digits
UPDATE sim_master SET sim_number = SUBSTRING(sim_number FROM 3) WHERE LENGTH(sim_number) = 12 AND sim_number LIKE '91%';

-- Auto-fix operator based on number prefix
UPDATE sim_master SET operator = 'Jio' WHERE sim_number LIKE '92%' AND operator != 'Jio';
UPDATE sim_master SET operator = 'Airtel' WHERE sim_number LIKE '95%' AND operator != 'Airtel';