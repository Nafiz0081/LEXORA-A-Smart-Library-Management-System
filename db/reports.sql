CREATE OR REPLACE PACKAGE lexora_reports AS
  FUNCTION borrow_outstanding(p_borrow_id NUMBER) RETURN NUMBER;
  FUNCTION member_outstanding(p_member_id NUMBER) RETURN NUMBER;
END lexora_reports;
/
CREATE OR REPLACE PACKAGE BODY lexora_reports AS
  FUNCTION borrow_outstanding(p_borrow_id NUMBER) RETURN NUMBER IS
    v_fine NUMBER; v_paid NUMBER;
  BEGIN
    SELECT NVL(fine_amount,0) INTO v_fine FROM borrowings WHERE borrow_id=p_borrow_id;
    SELECT NVL(SUM(paid_amount),0) INTO v_paid FROM fine_payments WHERE borrow_id=p_borrow_id;
    RETURN v_fine - v_paid;
  END;

  FUNCTION member_outstanding(p_member_id NUMBER) RETURN NUMBER IS
    v_total NUMBER;
  BEGIN
    SELECT NVL(SUM(lexora_reports.borrow_outstanding(b.borrow_id)),0)
    INTO v_total
    FROM borrowings b
    WHERE b.member_id=p_member_id;
    RETURN v_total;
  END;
END lexora_reports;
/
