CREATE OR REPLACE PACKAGE lexora_circulation AS
  PROCEDURE add_book(p_isbn VARCHAR2, p_title VARCHAR2, p_author VARCHAR2, p_category VARCHAR2, p_year NUMBER, p_total NUMBER);
  PROCEDURE update_book_copies(p_book_id NUMBER, p_total NUMBER);
  PROCEDURE register_member(p_name VARCHAR2, p_email VARCHAR2, p_phone VARCHAR2, o_member_id OUT NUMBER);
  PROCEDURE issue_book(p_member_id NUMBER, p_book_id NUMBER, o_borrow_id OUT NUMBER);
  PROCEDURE return_book(p_borrow_id NUMBER, o_fine OUT NUMBER);
END lexora_circulation;
/
CREATE OR REPLACE PACKAGE BODY lexora_circulation AS
  PROCEDURE add_book(p_isbn VARCHAR2, p_title VARCHAR2, p_author VARCHAR2, p_category VARCHAR2, p_year NUMBER, p_total NUMBER) IS
  BEGIN
    INSERT INTO books(isbn,title,author,category,published_year,total_copies,available_copies)
    VALUES(p_isbn,p_title,p_author,p_category,p_year,p_total,p_total);
  END;

  PROCEDURE update_book_copies(p_book_id NUMBER, p_total NUMBER) IS
  BEGIN
    UPDATE books SET total_copies=p_total, available_copies=p_total WHERE book_id=p_book_id;
  END;

  PROCEDURE register_member(p_name VARCHAR2, p_email VARCHAR2, p_phone VARCHAR2, o_member_id OUT NUMBER) IS
  BEGIN
    INSERT INTO members(full_name,email,phone) VALUES(p_name,p_email,p_phone)
    RETURNING member_id INTO o_member_id;
  END;

  PROCEDURE issue_book(p_member_id NUMBER, p_book_id NUMBER, o_borrow_id OUT NUMBER) IS
  BEGIN
    INSERT INTO borrowings(member_id,book_id) VALUES(p_member_id,p_book_id)
    RETURNING borrow_id INTO o_borrow_id;
  END;

  PROCEDURE return_book(p_borrow_id NUMBER, o_fine OUT NUMBER) IS
    v_due DATE;
    v_ret DATE := TRUNC(SYSDATE);
  BEGIN
    SELECT due_date INTO v_due FROM borrowings WHERE borrow_id=p_borrow_id FOR UPDATE;
    o_fine := compute_fine(v_due,v_ret);
    UPDATE borrowings SET return_date=v_ret,status='RETURNED',fine_amount=o_fine WHERE borrow_id=p_borrow_id;
  END;
END lexora_circulation;
/
