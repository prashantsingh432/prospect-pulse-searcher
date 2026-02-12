
-- Insert spam history records and update SIM master for each spam event

-- Helper: For each spam event, insert into sim_spam_history and update sim_master
-- We'll process by SIM number, inserting history entries with proper dates

DO $$
DECLARE
  v_sim_id uuid;
  v_agent_id uuid;
  v_count int;
  v_risk text;
BEGIN

  -- 9258208049 - Apoorva Chauhan - 2 spam events
  SELECT id INTO v_sim_id FROM sim_master WHERE sim_number = '+919258208049';
  SELECT id INTO v_agent_id FROM sim_agents WHERE name ILIKE '%Apoorva%' LIMIT 1;
  IF v_sim_id IS NOT NULL THEN
    INSERT INTO sim_spam_history (sim_id, agent_id, spam_date, remarks) VALUES
      (v_sim_id, v_agent_id, '2026-01-20', 'Marked spam'),
      (v_sim_id, v_agent_id, '2026-02-11', 'Marked spam');
    UPDATE sim_master SET current_status = 'Spam', spam_count = 2, last_spam_date = '2026-02-11', risk_level = 'Normal' WHERE id = v_sim_id;
  END IF;

  -- 9258208095 - Varnika - 1 spam event
  SELECT id INTO v_sim_id FROM sim_master WHERE sim_number = '+919258208095';
  SELECT id INTO v_agent_id FROM sim_agents WHERE name ILIKE '%Varnika%' LIMIT 1;
  IF v_sim_id IS NOT NULL THEN
    INSERT INTO sim_spam_history (sim_id, agent_id, spam_date, remarks) VALUES (v_sim_id, v_agent_id, '2026-02-11', 'Marked spam');
    UPDATE sim_master SET current_status = 'Spam', spam_count = 1, last_spam_date = '2026-02-11', risk_level = 'Normal' WHERE id = v_sim_id;
  END IF;

  -- 9258208099 - Sweta Gupta - 1 spam
  SELECT id INTO v_sim_id FROM sim_master WHERE sim_number = '+919258208099';
  SELECT id INTO v_agent_id FROM sim_agents WHERE name ILIKE '%Shweta Gupta%' LIMIT 1;
  IF v_sim_id IS NOT NULL THEN
    INSERT INTO sim_spam_history (sim_id, agent_id, spam_date, remarks) VALUES (v_sim_id, v_agent_id, '2026-01-12', 'Marked spam');
    UPDATE sim_master SET current_status = 'Spam', spam_count = 1, last_spam_date = '2026-01-12', risk_level = 'Normal' WHERE id = v_sim_id;
  END IF;

  -- 9258208654 - Anjali Bisht - 1 spam
  SELECT id INTO v_sim_id FROM sim_master WHERE sim_number = '+919258208654';
  SELECT id INTO v_agent_id FROM sim_agents WHERE name ILIKE '%Anjali%' LIMIT 1;
  IF v_sim_id IS NOT NULL THEN
    INSERT INTO sim_spam_history (sim_id, agent_id, spam_date, remarks) VALUES (v_sim_id, v_agent_id, '2026-01-07', 'Marked spam');
    UPDATE sim_master SET current_status = 'Spam', spam_count = 1, last_spam_date = '2026-01-07', risk_level = 'Normal' WHERE id = v_sim_id;
  END IF;

  -- 9258208662 - Co-Existing SISCo - 1 spam
  SELECT id INTO v_sim_id FROM sim_master WHERE sim_number = '+919258208662';
  SELECT id INTO v_agent_id FROM sim_agents WHERE name ILIKE '%SISCo%' LIMIT 1;
  IF v_sim_id IS NOT NULL THEN
    INSERT INTO sim_spam_history (sim_id, agent_id, spam_date, remarks) VALUES (v_sim_id, v_agent_id, '2026-02-10', 'Marked spam');
    UPDATE sim_master SET current_status = 'Spam', spam_count = 1, last_spam_date = '2026-02-10', risk_level = 'Normal' WHERE id = v_sim_id;
  END IF;

  -- 9520650675 - Apoorva Chauhan - 1 spam
  SELECT id INTO v_sim_id FROM sim_master WHERE sim_number = '+919520650675';
  SELECT id INTO v_agent_id FROM sim_agents WHERE name ILIKE '%Apoorva%' LIMIT 1;
  IF v_sim_id IS NOT NULL THEN
    INSERT INTO sim_spam_history (sim_id, agent_id, spam_date, remarks) VALUES (v_sim_id, v_agent_id, '2026-02-11', 'Marked spam');
    UPDATE sim_master SET current_status = 'Spam', spam_count = 1, last_spam_date = '2026-02-11', risk_level = 'Normal' WHERE id = v_sim_id;
  END IF;

  -- 9258207419 - Aman Bhandari - 1 spam
  SELECT id INTO v_sim_id FROM sim_master WHERE sim_number = '+919258207419';
  SELECT id INTO v_agent_id FROM sim_agents WHERE name ILIKE '%Aman%' LIMIT 1;
  IF v_sim_id IS NOT NULL THEN
    INSERT INTO sim_spam_history (sim_id, agent_id, spam_date, remarks) VALUES (v_sim_id, v_agent_id, '2026-02-09', 'Marked spam');
    UPDATE sim_master SET current_status = 'Spam', spam_count = 1, last_spam_date = '2026-02-09', risk_level = 'Normal' WHERE id = v_sim_id;
  END IF;

  -- 9258208645 - Monika Gurung - 1 spam
  SELECT id INTO v_sim_id FROM sim_master WHERE sim_number = '+919258208645';
  SELECT id INTO v_agent_id FROM sim_agents WHERE name ILIKE '%Monika%' LIMIT 1;
  IF v_sim_id IS NOT NULL THEN
    INSERT INTO sim_spam_history (sim_id, agent_id, spam_date, remarks) VALUES (v_sim_id, v_agent_id, '2026-02-11', 'Marked spam');
    UPDATE sim_master SET current_status = 'Spam', spam_count = 1, last_spam_date = '2026-02-11', risk_level = 'Normal' WHERE id = v_sim_id;
  END IF;

  -- 9258208647 - Sarika Negi - 1 spam
  SELECT id INTO v_sim_id FROM sim_master WHERE sim_number = '+919258208647';
  SELECT id INTO v_agent_id FROM sim_agents WHERE name ILIKE '%Sarika%' LIMIT 1;
  IF v_sim_id IS NOT NULL THEN
    INSERT INTO sim_spam_history (sim_id, agent_id, spam_date, remarks) VALUES (v_sim_id, v_agent_id, '2026-01-06', 'Marked spam');
    UPDATE sim_master SET current_status = 'Spam', spam_count = 1, last_spam_date = '2026-01-06', risk_level = 'Normal' WHERE id = v_sim_id;
  END IF;

  -- 9258208649 - Shweta Gupta - 1 spam
  SELECT id INTO v_sim_id FROM sim_master WHERE sim_number = '+919258208649';
  SELECT id INTO v_agent_id FROM sim_agents WHERE name ILIKE '%Shweta Gupta%' LIMIT 1;
  IF v_sim_id IS NOT NULL THEN
    INSERT INTO sim_spam_history (sim_id, agent_id, spam_date, remarks) VALUES (v_sim_id, v_agent_id, '2026-02-02', 'Marked spam');
    UPDATE sim_master SET current_status = 'Spam', spam_count = 1, last_spam_date = '2026-02-02', risk_level = 'Normal' WHERE id = v_sim_id;
  END IF;

  -- 9258208656 - Sarika Negi - 1 spam
  SELECT id INTO v_sim_id FROM sim_master WHERE sim_number = '+919258208656';
  SELECT id INTO v_agent_id FROM sim_agents WHERE name ILIKE '%Sarika%' LIMIT 1;
  IF v_sim_id IS NOT NULL THEN
    INSERT INTO sim_spam_history (sim_id, agent_id, spam_date, remarks) VALUES (v_sim_id, v_agent_id, '2026-01-08', 'Marked spam');
    UPDATE sim_master SET current_status = 'Spam', spam_count = 1, last_spam_date = '2026-01-08', risk_level = 'Normal' WHERE id = v_sim_id;
  END IF;

  -- 9258208657 - Mahima Rawat - 1 spam
  SELECT id INTO v_sim_id FROM sim_master WHERE sim_number = '+919258208657';
  SELECT id INTO v_agent_id FROM sim_agents WHERE name ILIKE '%Mahima%' LIMIT 1;
  IF v_sim_id IS NOT NULL THEN
    INSERT INTO sim_spam_history (sim_id, agent_id, spam_date, remarks) VALUES (v_sim_id, v_agent_id, '2026-02-12', 'Marked spam');
    UPDATE sim_master SET current_status = 'Spam', spam_count = 1, last_spam_date = '2026-02-12', risk_level = 'Normal' WHERE id = v_sim_id;
  END IF;

  -- 9258208661 - Sarika Negi - 1 spam
  SELECT id INTO v_sim_id FROM sim_master WHERE sim_number = '+919258208661';
  SELECT id INTO v_agent_id FROM sim_agents WHERE name ILIKE '%Sarika%' LIMIT 1;
  IF v_sim_id IS NOT NULL THEN
    INSERT INTO sim_spam_history (sim_id, agent_id, spam_date, remarks) VALUES (v_sim_id, v_agent_id, '2026-02-03', 'Marked spam');
    UPDATE sim_master SET current_status = 'Spam', spam_count = 1, last_spam_date = '2026-02-03', risk_level = 'Normal' WHERE id = v_sim_id;
  END IF;

  -- 9258208663 - Devashish Basnet - 1 spam
  SELECT id INTO v_sim_id FROM sim_master WHERE sim_number = '+919258208663';
  SELECT id INTO v_agent_id FROM sim_agents WHERE name ILIKE '%Devashish%' LIMIT 1;
  IF v_sim_id IS NOT NULL THEN
    INSERT INTO sim_spam_history (sim_id, agent_id, spam_date, remarks) VALUES (v_sim_id, v_agent_id, '2026-01-12', 'Marked spam');
    UPDATE sim_master SET current_status = 'Spam', spam_count = 1, last_spam_date = '2026-01-12', risk_level = 'Normal' WHERE id = v_sim_id;
  END IF;

  -- 9258208664 - Rishita - 1 spam (SIM may not exist yet, need to add)
  SELECT id INTO v_sim_id FROM sim_master WHERE sim_number = '+919258208664';
  IF v_sim_id IS NULL THEN
    INSERT INTO sim_master (sim_number, operator, current_status, spam_count, last_spam_date, risk_level)
    VALUES ('+919258208664', 'Jio', 'Spam', 1, '2026-01-20', 'Normal') RETURNING id INTO v_sim_id;
  END IF;
  -- Try to find agent Rishita, create if not exists
  SELECT id INTO v_agent_id FROM sim_agents WHERE name ILIKE '%Rishita%' LIMIT 1;
  IF v_agent_id IS NULL THEN
    INSERT INTO sim_agents (name, status) VALUES ('Rishita', 'Active') RETURNING id INTO v_agent_id;
  END IF;
  INSERT INTO sim_spam_history (sim_id, agent_id, spam_date, remarks) VALUES (v_sim_id, v_agent_id, '2026-01-20', 'Marked spam');
  UPDATE sim_master SET current_status = 'Spam', spam_count = 1, last_spam_date = '2026-01-20', risk_level = 'Normal', assigned_agent_id = v_agent_id WHERE id = v_sim_id;

  -- 9258237050 - Muskan Tomar - 1 spam (SIM may not exist)
  SELECT id INTO v_sim_id FROM sim_master WHERE sim_number = '+919258237050';
  SELECT id INTO v_agent_id FROM sim_agents WHERE name ILIKE '%Muskan%' LIMIT 1;
  IF v_sim_id IS NULL THEN
    INSERT INTO sim_master (sim_number, operator, current_status, spam_count, last_spam_date, risk_level, assigned_agent_id)
    VALUES ('+919258237050', 'Jio', 'Spam', 1, '2026-01-27', 'Normal', v_agent_id) RETURNING id INTO v_sim_id;
  END IF;
  INSERT INTO sim_spam_history (sim_id, agent_id, spam_date, remarks) VALUES (v_sim_id, v_agent_id, '2026-01-27', 'Marked spam');
  UPDATE sim_master SET current_status = 'Spam', spam_count = 1, last_spam_date = '2026-01-27', risk_level = 'Normal' WHERE id = v_sim_id;

  -- 9520650672 - Riya Bhatt - 1 spam
  SELECT id INTO v_sim_id FROM sim_master WHERE sim_number = '+919520650672';
  SELECT id INTO v_agent_id FROM sim_agents WHERE name ILIKE '%Riya%' LIMIT 1;
  IF v_sim_id IS NOT NULL THEN
    INSERT INTO sim_spam_history (sim_id, agent_id, spam_date, remarks) VALUES (v_sim_id, v_agent_id, '2026-02-02', 'Marked spam');
    UPDATE sim_master SET current_status = 'Spam', spam_count = 1, last_spam_date = '2026-02-02', risk_level = 'Normal' WHERE id = v_sim_id;
  END IF;

  -- 9520650673 - Monika Gurung - 1 spam
  SELECT id INTO v_sim_id FROM sim_master WHERE sim_number = '+919520650673';
  SELECT id INTO v_agent_id FROM sim_agents WHERE name ILIKE '%Monika%' LIMIT 1;
  IF v_sim_id IS NOT NULL THEN
    INSERT INTO sim_spam_history (sim_id, agent_id, spam_date, remarks) VALUES (v_sim_id, v_agent_id, '2026-01-15', 'Marked spam');
    UPDATE sim_master SET current_status = 'Spam', spam_count = 1, last_spam_date = '2026-01-15', risk_level = 'Normal' WHERE id = v_sim_id;
  END IF;

  -- 9520650674 - Shweta Gupta - 1 spam
  SELECT id INTO v_sim_id FROM sim_master WHERE sim_number = '+919520650674';
  SELECT id INTO v_agent_id FROM sim_agents WHERE name ILIKE '%Shweta Gupta%' LIMIT 1;
  IF v_sim_id IS NULL THEN
    SELECT id INTO v_agent_id FROM sim_agents WHERE name ILIKE '%Varnika%' LIMIT 1;
    -- This SIM is assigned to Varnika per original data
  END IF;
  SELECT id INTO v_sim_id FROM sim_master WHERE sim_number = '+919520650674';
  IF v_sim_id IS NOT NULL THEN
    SELECT id INTO v_agent_id FROM sim_agents WHERE name ILIKE '%Shweta Gupta%' LIMIT 1;
    INSERT INTO sim_spam_history (sim_id, agent_id, spam_date, remarks) VALUES (v_sim_id, v_agent_id, '2026-02-03', 'Marked spam');
    UPDATE sim_master SET current_status = 'Spam', spam_count = 1, last_spam_date = '2026-02-03', risk_level = 'Normal' WHERE id = v_sim_id;
  END IF;

  -- 9520650676 - Abhay/mangaal - 2 spam events
  SELECT id INTO v_sim_id FROM sim_master WHERE sim_number = '+919520650676';
  IF v_sim_id IS NULL THEN
    -- Create SIM and agents as needed
    SELECT id INTO v_agent_id FROM sim_agents WHERE name ILIKE '%Abhay%' LIMIT 1;
    INSERT INTO sim_master (sim_number, operator, current_status, spam_count, last_spam_date, risk_level, assigned_agent_id)
    VALUES ('+919520650676', 'Airtel', 'Spam', 2, '2026-02-04', 'Normal', v_agent_id) RETURNING id INTO v_sim_id;
  ELSE
    UPDATE sim_master SET current_status = 'Spam', spam_count = 2, last_spam_date = '2026-02-04', risk_level = 'Normal' WHERE id = v_sim_id;
  END IF;
  SELECT id INTO v_agent_id FROM sim_agents WHERE name ILIKE '%Abhay%' LIMIT 1;
  INSERT INTO sim_spam_history (sim_id, agent_id, spam_date, remarks) VALUES (v_sim_id, v_agent_id, '2026-01-13', 'Marked spam');
  -- mangaal agent
  SELECT id INTO v_agent_id FROM sim_agents WHERE name ILIKE '%mangaal%' LIMIT 1;
  IF v_agent_id IS NULL THEN
    INSERT INTO sim_agents (name, status) VALUES ('Mangaal', 'Active') RETURNING id INTO v_agent_id;
  END IF;
  INSERT INTO sim_spam_history (sim_id, agent_id, spam_date, remarks) VALUES (v_sim_id, v_agent_id, '2026-02-04', 'Marked spam');

  -- 9520650677 - Arnima - 1 spam
  SELECT id INTO v_sim_id FROM sim_master WHERE sim_number = '+919520650677';
  SELECT id INTO v_agent_id FROM sim_agents WHERE name ILIKE '%Arnima%' LIMIT 1;
  IF v_sim_id IS NULL THEN
    INSERT INTO sim_master (sim_number, operator, current_status, spam_count, last_spam_date, risk_level, assigned_agent_id)
    VALUES ('+919520650677', 'Airtel', 'Spam', 1, '2026-02-02', 'Normal', v_agent_id) RETURNING id INTO v_sim_id;
  ELSE
    UPDATE sim_master SET current_status = 'Spam', spam_count = 1, last_spam_date = '2026-02-02', risk_level = 'Normal' WHERE id = v_sim_id;
  END IF;
  INSERT INTO sim_spam_history (sim_id, agent_id, spam_date, remarks) VALUES (v_sim_id, v_agent_id, '2026-02-02', 'Marked spam');

  -- 9520650678 - Archana - 1 spam
  SELECT id INTO v_sim_id FROM sim_master WHERE sim_number = '+919520650678';
  SELECT id INTO v_agent_id FROM sim_agents WHERE name ILIKE '%Archana%' LIMIT 1;
  IF v_sim_id IS NOT NULL THEN
    INSERT INTO sim_spam_history (sim_id, agent_id, spam_date, remarks) VALUES (v_sim_id, v_agent_id, '2026-01-19', 'Marked spam');
    UPDATE sim_master SET current_status = 'Spam', spam_count = 1, last_spam_date = '2026-01-19', risk_level = 'Normal' WHERE id = v_sim_id;
  END IF;

  -- 9520650681 - Mahima Rawat - 1 spam
  SELECT id INTO v_sim_id FROM sim_master WHERE sim_number = '+919520650681';
  SELECT id INTO v_agent_id FROM sim_agents WHERE name ILIKE '%Mahima%' LIMIT 1;
  IF v_sim_id IS NOT NULL THEN
    INSERT INTO sim_spam_history (sim_id, agent_id, spam_date, remarks) VALUES (v_sim_id, v_agent_id, '2025-12-12', 'Marked spam');
    UPDATE sim_master SET current_status = 'Spam', spam_count = 1, last_spam_date = '2025-12-12', risk_level = 'Normal' WHERE id = v_sim_id;
  END IF;

  -- 9520650683 - Co-Existing DC/Monika - 1 spam
  SELECT id INTO v_sim_id FROM sim_master WHERE sim_number = '+919520650683';
  SELECT id INTO v_agent_id FROM sim_agents WHERE name ILIKE '%Monika%' LIMIT 1;
  IF v_sim_id IS NOT NULL THEN
    INSERT INTO sim_spam_history (sim_id, agent_id, spam_date, remarks) VALUES (v_sim_id, v_agent_id, '2026-01-27', 'Marked spam');
    UPDATE sim_master SET current_status = 'Spam', spam_count = 1, last_spam_date = '2026-01-27', risk_level = 'Normal' WHERE id = v_sim_id;
  END IF;

  -- 9520650686 - Aditi Kodari - 1 spam (SIM may not exist)
  SELECT id INTO v_sim_id FROM sim_master WHERE sim_number = '+919520650686';
  SELECT id INTO v_agent_id FROM sim_agents WHERE name ILIKE '%Aditi%' LIMIT 1;
  IF v_sim_id IS NULL THEN
    INSERT INTO sim_master (sim_number, operator, current_status, spam_count, last_spam_date, risk_level, assigned_agent_id)
    VALUES ('+919520650686', 'Airtel', 'Spam', 1, '2026-02-03', 'Normal', v_agent_id) RETURNING id INTO v_sim_id;
  ELSE
    UPDATE sim_master SET current_status = 'Spam', spam_count = 1, last_spam_date = '2026-02-03', risk_level = 'Normal' WHERE id = v_sim_id;
  END IF;
  INSERT INTO sim_spam_history (sim_id, agent_id, spam_date, remarks) VALUES (v_sim_id, v_agent_id, '2026-02-03', 'Marked spam');

  -- 9520650688 - Shubhangi - 1 spam (SIM may not exist)
  SELECT id INTO v_sim_id FROM sim_master WHERE sim_number = '+919520650688';
  SELECT id INTO v_agent_id FROM sim_agents WHERE name ILIKE '%Shubhangi%' LIMIT 1;
  IF v_sim_id IS NULL THEN
    INSERT INTO sim_master (sim_number, operator, current_status, spam_count, last_spam_date, risk_level, assigned_agent_id)
    VALUES ('+919520650688', 'Airtel', 'Spam', 1, '2026-01-22', 'Normal', v_agent_id) RETURNING id INTO v_sim_id;
  ELSE
    UPDATE sim_master SET current_status = 'Spam', spam_count = 1, last_spam_date = '2026-01-22', risk_level = 'Normal' WHERE id = v_sim_id;
  END IF;
  INSERT INTO sim_spam_history (sim_id, agent_id, spam_date, remarks) VALUES (v_sim_id, v_agent_id, '2026-01-22', 'Marked spam');

  -- 9520650690 - Mahak - 1 spam (SIM may not exist)
  SELECT id INTO v_sim_id FROM sim_master WHERE sim_number = '+919520650690';
  SELECT id INTO v_agent_id FROM sim_agents WHERE name ILIKE '%Mahak%' LIMIT 1;
  IF v_sim_id IS NULL THEN
    INSERT INTO sim_master (sim_number, operator, current_status, spam_count, last_spam_date, risk_level, assigned_agent_id)
    VALUES ('+919520650690', 'Airtel', 'Spam', 1, '2026-02-04', 'Normal', v_agent_id) RETURNING id INTO v_sim_id;
  ELSE
    UPDATE sim_master SET current_status = 'Spam', spam_count = 1, last_spam_date = '2026-02-04', risk_level = 'Normal' WHERE id = v_sim_id;
  END IF;
  INSERT INTO sim_spam_history (sim_id, agent_id, spam_date, remarks) VALUES (v_sim_id, v_agent_id, '2026-02-04', 'Marked spam');

  -- 9520650691 - mangaal - 1 spam (SIM may not exist)
  SELECT id INTO v_sim_id FROM sim_master WHERE sim_number = '+919520650691';
  SELECT id INTO v_agent_id FROM sim_agents WHERE name ILIKE '%mangaal%' LIMIT 1;
  IF v_sim_id IS NULL THEN
    INSERT INTO sim_master (sim_number, operator, current_status, spam_count, last_spam_date, risk_level, assigned_agent_id)
    VALUES ('+919520650691', 'Airtel', 'Spam', 1, '2026-02-02', 'Normal', v_agent_id) RETURNING id INTO v_sim_id;
  ELSE
    UPDATE sim_master SET current_status = 'Spam', spam_count = 1, last_spam_date = '2026-02-02', risk_level = 'Normal' WHERE id = v_sim_id;
  END IF;
  INSERT INTO sim_spam_history (sim_id, agent_id, spam_date, remarks) VALUES (v_sim_id, v_agent_id, '2026-02-02', 'Marked spam');

  -- 9258208095 - may not exist
  SELECT id INTO v_sim_id FROM sim_master WHERE sim_number = '+919258208095';
  IF v_sim_id IS NULL THEN
    SELECT id INTO v_agent_id FROM sim_agents WHERE name ILIKE '%Varnika%' LIMIT 1;
    INSERT INTO sim_master (sim_number, operator, current_status, spam_count, last_spam_date, risk_level, assigned_agent_id)
    VALUES ('+919258208095', 'Jio', 'Spam', 1, '2026-02-11', 'Normal', v_agent_id) RETURNING id INTO v_sim_id;
    INSERT INTO sim_spam_history (sim_id, agent_id, spam_date, remarks) VALUES (v_sim_id, v_agent_id, '2026-02-11', 'Marked spam');
  END IF;

  -- 9258208099 - may not exist
  SELECT id INTO v_sim_id FROM sim_master WHERE sim_number = '+919258208099';
  IF v_sim_id IS NULL THEN
    SELECT id INTO v_agent_id FROM sim_agents WHERE name ILIKE '%Shweta Gupta%' LIMIT 1;
    INSERT INTO sim_master (sim_number, operator, current_status, spam_count, last_spam_date, risk_level, assigned_agent_id)
    VALUES ('+919258208099', 'Jio', 'Spam', 1, '2026-01-12', 'Normal', v_agent_id) RETURNING id INTO v_sim_id;
    INSERT INTO sim_spam_history (sim_id, agent_id, spam_date, remarks) VALUES (v_sim_id, v_agent_id, '2026-01-12', 'Marked spam');
  END IF;

  -- 9258208645 - may not exist
  SELECT id INTO v_sim_id FROM sim_master WHERE sim_number = '+919258208645';
  IF v_sim_id IS NULL THEN
    SELECT id INTO v_agent_id FROM sim_agents WHERE name ILIKE '%Monika%' LIMIT 1;
    IF v_agent_id IS NULL THEN
      INSERT INTO sim_agents (name, status) VALUES ('Monika Gurung', 'Active') RETURNING id INTO v_agent_id;
    END IF;
    INSERT INTO sim_master (sim_number, operator, current_status, spam_count, last_spam_date, risk_level, assigned_agent_id)
    VALUES ('+919258208645', 'Jio', 'Spam', 1, '2026-02-11', 'Normal', v_agent_id) RETURNING id INTO v_sim_id;
    INSERT INTO sim_spam_history (sim_id, agent_id, spam_date, remarks) VALUES (v_sim_id, v_agent_id, '2026-02-11', 'Marked spam');
  END IF;

  -- 9258208647 - may not exist
  SELECT id INTO v_sim_id FROM sim_master WHERE sim_number = '+919258208647';
  IF v_sim_id IS NULL THEN
    SELECT id INTO v_agent_id FROM sim_agents WHERE name ILIKE '%Sarika%' LIMIT 1;
    INSERT INTO sim_master (sim_number, operator, current_status, spam_count, last_spam_date, risk_level, assigned_agent_id)
    VALUES ('+919258208647', 'Jio', 'Spam', 1, '2026-01-06', 'Normal', v_agent_id) RETURNING id INTO v_sim_id;
    INSERT INTO sim_spam_history (sim_id, agent_id, spam_date, remarks) VALUES (v_sim_id, v_agent_id, '2026-01-06', 'Marked spam');
  END IF;

  -- 9258208649 - may not exist
  SELECT id INTO v_sim_id FROM sim_master WHERE sim_number = '+919258208649';
  IF v_sim_id IS NULL THEN
    SELECT id INTO v_agent_id FROM sim_agents WHERE name ILIKE '%Shweta Gupta%' LIMIT 1;
    INSERT INTO sim_master (sim_number, operator, current_status, spam_count, last_spam_date, risk_level, assigned_agent_id)
    VALUES ('+919258208649', 'Jio', 'Spam', 1, '2026-02-02', 'Normal', v_agent_id) RETURNING id INTO v_sim_id;
    INSERT INTO sim_spam_history (sim_id, agent_id, spam_date, remarks) VALUES (v_sim_id, v_agent_id, '2026-02-02', 'Marked spam');
  END IF;

  -- 9258208656 - may not exist
  SELECT id INTO v_sim_id FROM sim_master WHERE sim_number = '+919258208656';
  IF v_sim_id IS NULL THEN
    SELECT id INTO v_agent_id FROM sim_agents WHERE name ILIKE '%Sarika%' LIMIT 1;
    INSERT INTO sim_master (sim_number, operator, current_status, spam_count, last_spam_date, risk_level, assigned_agent_id)
    VALUES ('+919258208656', 'Jio', 'Spam', 1, '2026-01-08', 'Normal', v_agent_id) RETURNING id INTO v_sim_id;
    INSERT INTO sim_spam_history (sim_id, agent_id, spam_date, remarks) VALUES (v_sim_id, v_agent_id, '2026-01-08', 'Marked spam');
  END IF;

  -- 9258208661 - may not exist
  SELECT id INTO v_sim_id FROM sim_master WHERE sim_number = '+919258208661';
  IF v_sim_id IS NULL THEN
    SELECT id INTO v_agent_id FROM sim_agents WHERE name ILIKE '%Sarika%' LIMIT 1;
    INSERT INTO sim_master (sim_number, operator, current_status, spam_count, last_spam_date, risk_level, assigned_agent_id)
    VALUES ('+919258208661', 'Jio', 'Spam', 1, '2026-02-03', 'Normal', v_agent_id) RETURNING id INTO v_sim_id;
    INSERT INTO sim_spam_history (sim_id, agent_id, spam_date, remarks) VALUES (v_sim_id, v_agent_id, '2026-02-03', 'Marked spam');
  END IF;

  -- 9520650675 - may not exist
  SELECT id INTO v_sim_id FROM sim_master WHERE sim_number = '+919520650675';
  IF v_sim_id IS NULL THEN
    SELECT id INTO v_agent_id FROM sim_agents WHERE name ILIKE '%Apoorva%' LIMIT 1;
    INSERT INTO sim_master (sim_number, operator, current_status, spam_count, last_spam_date, risk_level, assigned_agent_id)
    VALUES ('+919520650675', 'Airtel', 'Spam', 1, '2026-02-11', 'Normal', v_agent_id) RETURNING id INTO v_sim_id;
    INSERT INTO sim_spam_history (sim_id, agent_id, spam_date, remarks) VALUES (v_sim_id, v_agent_id, '2026-02-11', 'Marked spam');
  END IF;

  -- 9258208049 - may not exist
  SELECT id INTO v_sim_id FROM sim_master WHERE sim_number = '+919258208049';
  IF v_sim_id IS NULL THEN
    SELECT id INTO v_agent_id FROM sim_agents WHERE name ILIKE '%Apoorva%' LIMIT 1;
    INSERT INTO sim_master (sim_number, operator, current_status, spam_count, last_spam_date, risk_level, assigned_agent_id)
    VALUES ('+919258208049', 'Jio', 'Spam', 2, '2026-02-11', 'Normal', v_agent_id) RETURNING id INTO v_sim_id;
    INSERT INTO sim_spam_history (sim_id, agent_id, spam_date, remarks) VALUES
      (v_sim_id, v_agent_id, '2026-01-20', 'Marked spam'),
      (v_sim_id, v_agent_id, '2026-02-11', 'Marked spam');
  END IF;

END $$;
