-- Book status auto-update
CREATE OR REPLACE TRIGGER trg_books_status
BEFORE INSERT OR UPDATE OF total_copies, available_copies ON books
FOR EACH ROW
BEGIN
  IF :NEW.available_copies > 0 THEN
    :NEW.status := 'AVAILABLE';
  ELSE
    :NEW.status := 'UNAVAILABLE';
  END IF;
END;
/

-- Borrow validation
CREATE OR REPLACE TRIGGER trg_bor_before_ins
BEFORE INSERT ON borrowings
FOR EACH ROW
DECLARE
  v_limit NUMBER;
  v_active_loans NUMBER;
  v_avail NUMBER;
BEGIN
  v_limit := get_int_setting('BORROW_LIMIT_PER_MEMBER');

  SELECT available_copies INTO v_avail FROM books WHERE book_id = :NEW.book_id FOR UPDATE;
  IF v_avail <= 0 THEN
    RAISE_APPLICATION_ERROR(-20013, 'No available copies');
  END IF;

  SELECT COUNT(*) INTO v_active_loans
  FROM borrowings
  WHERE member_id = :NEW.member_id AND status = 'ISSUED';

  IF v_active_loans >= v_limit THEN
    RAISE_APPLICATION_ERROR(-20014, 'Borrow limit exceeded');
  END IF;

  :NEW.issue_date := TRUNC(SYSDATE);
  :NEW.due_date   := compute_due_date(:NEW.issue_date);
  :NEW.status     := 'ISSUED';
END;
/

-- After issue → decrement available
CREATE OR REPLACE TRIGGER trg_bor_after_ins
AFTER INSERT ON borrowings
FOR EACH ROW
BEGIN
  UPDATE books SET available_copies = available_copies - 1 WHERE book_id = :NEW.book_id;
END;
/

-- Before return → compute fine
CREATE OR REPLACE TRIGGER trg_bor_before_upd
BEFORE UPDATE OF return_date, status ON borrowings
FOR EACH ROW
BEGIN
  IF NVL(:OLD.status,'X') <> 'RETURNED' AND :NEW.status = 'RETURNED' THEN
    :NEW.return_date := TRUNC(SYSDATE);
    :NEW.fine_amount := compute_fine(:OLD.due_date, :NEW.return_date);
  END IF;
END;
/

-- After return → increment available
CREATE OR REPLACE TRIGGER trg_bor_after_upd
AFTER UPDATE OF return_date, status ON borrowings
FOR EACH ROW
BEGIN
  IF NVL(:OLD.status,'X') <> 'RETURNED' AND :NEW.status = 'RETURNED' THEN
    UPDATE books SET available_copies = available_copies + 1 WHERE book_id = :NEW.book_id;
  END IF;
END;
/
