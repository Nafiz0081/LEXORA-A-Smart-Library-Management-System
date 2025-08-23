CREATE OR REPLACE VIEW v_available_books AS
SELECT * FROM books WHERE status = 'AVAILABLE';

CREATE OR REPLACE VIEW v_member_active_loans AS
SELECT m.member_id, m.full_name, b.borrow_id, k.title, b.issue_date, b.due_date
FROM members m
JOIN borrowings b ON b.member_id = m.member_id AND b.status = 'ISSUED'
JOIN books k ON k.book_id = b.book_id;

CREATE OR REPLACE VIEW v_overdue_loans AS
SELECT b.borrow_id, m.full_name, k.title, b.issue_date, b.due_date
FROM borrowings b
JOIN members m ON m.member_id = b.member_id
JOIN books k ON k.book_id = b.book_id
WHERE b.status = 'ISSUED' AND b.due_date < TRUNC(SYSDATE);
