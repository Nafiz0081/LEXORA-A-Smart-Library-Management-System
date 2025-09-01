-- Simple PL/SQL Functions for LEXORA Library Management System

-- Function 1: Count total books by a specific author
CREATE OR REPLACE FUNCTION fn_count_books_by_author(p_author VARCHAR2)
RETURN NUMBER
IS
    v_count NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM books
    WHERE UPPER(author) = UPPER(p_author);
    
    RETURN v_count;
EXCEPTION
    WHEN OTHERS THEN
        RETURN 0;
END fn_count_books_by_author;
/

-- Function 2: Get member's total borrowed books count
CREATE OR REPLACE FUNCTION fn_member_total_borrows(p_member_id NUMBER)
RETURN NUMBER
IS
    v_total NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_total
    FROM borrowings
    WHERE member_id = p_member_id;
    
    RETURN v_total;
EXCEPTION
    WHEN OTHERS THEN
        RETURN 0;
END fn_member_total_borrows;
/