
-- Insert new SIMs that don't exist, or update existing ones to Deactivated
INSERT INTO sim_master (sim_number, operator, current_status, assigned_agent_id, project_name)
VALUES
  ('+919258208653', 'Airtel', 'Deactivated', NULL, NULL),
  ('+919258207098', 'Airtel', 'Deactivated', NULL, NULL),
  ('+919258257200', 'Airtel', 'Deactivated', NULL, NULL),
  ('+919258208097', 'Airtel', 'Deactivated', NULL, NULL),
  ('+919258208665', 'Airtel', 'Deactivated', NULL, NULL),
  ('+919258237049', 'Airtel', 'Deactivated', NULL, NULL),
  ('+919528177492', 'Airtel', 'Deactivated', NULL, NULL),
  ('+919258208046', 'Airtel', 'Deactivated', NULL, NULL),
  ('+919258207384', 'Airtel', 'Deactivated', NULL, NULL),
  ('+919258208650', 'Airtel', 'Deactivated', NULL, NULL),
  ('+919258207386', 'Airtel', 'Deactivated', NULL, NULL),
  ('+919258207097', 'Airtel', 'Deactivated', NULL, NULL),
  ('+919258208658', 'Airtel', 'Deactivated', NULL, NULL),
  ('+919258207099', 'Airtel', 'Deactivated', NULL, NULL),
  ('+919259537568', 'Airtel', 'Deactivated', NULL, NULL),
  ('+919258208659', 'Airtel', 'Deactivated', NULL, NULL),
  ('+919258257194', 'Airtel', 'Deactivated', NULL, NULL)
ON CONFLICT (sim_number) DO UPDATE SET 
  current_status = 'Deactivated',
  assigned_agent_id = NULL,
  project_name = NULL;

-- Also update the remaining SIMs from the list that already exist
UPDATE sim_master SET current_status = 'Deactivated', assigned_agent_id = NULL, project_name = NULL
WHERE sim_number IN (
  '+919258208654',
  '+919258208099',
  '+919258208664',
  '+919258208663',
  '+919258208656',
  '+919258208647'
);
