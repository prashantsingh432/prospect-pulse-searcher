
-- Step 1: Set the 18 SIMs that SHOULD be Spam to Spam status
UPDATE sim_master 
SET current_status = 'Spam', 
    spam_count = GREATEST(spam_count, 1),
    last_spam_date = COALESCE(last_spam_date, now())
WHERE sim_number IN (
  '+919258208049',
  '+919258208095',
  '+919258208099',
  '+919258208662',
  '+919520650675',
  '+919258208645',
  '+919258208647',
  '+919258208649',
  '+919258208656',
  '+919258208657',
  '+919258208661',
  '+919258208664',
  '+919258237050',
  '+919520650676',
  '+919520650677',
  '+919520650686',
  '+919520650688',
  '+919520650690'
);

-- Step 2: Set SIMs currently marked Spam that are NOT in the user's spam list back to Active
UPDATE sim_master 
SET current_status = 'Active'
WHERE current_status = 'Spam'
AND sim_number NOT IN (
  '+919258208049',
  '+919258208095',
  '+919258208099',
  '+919258208662',
  '+919520650675',
  '+919258208645',
  '+919258208647',
  '+919258208649',
  '+919258208656',
  '+919258208657',
  '+919258208661',
  '+919258208664',
  '+919258237050',
  '+919520650676',
  '+919520650677',
  '+919520650686',
  '+919520650688',
  '+919520650690'
);
