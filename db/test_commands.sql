-- Issue book
DECLARE v_borrow NUMBER; 
BEGIN lexora_circulation.issue_book(1,1,v_borrow);
DBMS_OUTPUT.PUT_LINE('Borrow ID: '||v_borrow); 
END;
/

-- Return book
DECLARE v_fine NUMBER; 
BEGIN lexora_circulation.return_book(1,v_fine);
DBMS_OUTPUT.PUT_LINE('Fine: '||v_fine); 
END;
/

-- Views
SELECT * FROM v_available_books;
SELECT * FROM v_member_active_loans;
SELECT * FROM v_overdue_loans;
