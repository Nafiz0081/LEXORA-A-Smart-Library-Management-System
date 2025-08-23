-- Utility functions
CREATE OR REPLACE FUNCTION get_int_setting(p_key VARCHAR2) RETURN NUMBER IS
  v_val NUMBER;
BEGIN
  SELECT TO_NUMBER(setting_value) INTO v_val FROM lexora_settings WHERE setting_key = p_key;
  RETURN v_val;
END;
/

CREATE OR REPLACE FUNCTION get_num_setting(p_key VARCHAR2) RETURN NUMBER IS
  v_val NUMBER;
BEGIN
  SELECT TO_NUMBER(setting_value) INTO v_val FROM lexora_settings WHERE setting_key = p_key;
  RETURN v_val;
END;
/

CREATE OR REPLACE FUNCTION compute_due_date(p_issue_date DATE) RETURN DATE IS
  v_days NUMBER;
BEGIN
  v_days := get_int_setting('LOAN_PERIOD_DAYS');
  RETURN TRUNC(p_issue_date) + v_days;
END;
/

CREATE OR REPLACE FUNCTION compute_fine(p_due_date DATE, p_return_date DATE) RETURN NUMBER IS
  v_fine_per_day NUMBER := get_num_setting('FINE_PER_DAY');
  v_grace_days   NUMBER := get_int_setting('FINE_GRACE_DAYS');
  v_days_over    NUMBER;
BEGIN
  v_days_over := GREATEST(TRUNC(p_return_date) - TRUNC(p_due_date) - v_grace_days, 0);
  RETURN v_days_over * v_fine_per_day;
END;
/
