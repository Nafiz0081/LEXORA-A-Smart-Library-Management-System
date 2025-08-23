-- Default system rules
INSERT INTO lexora_settings VALUES ('BORROW_LIMIT_PER_MEMBER', '3');
INSERT INTO lexora_settings VALUES ('LOAN_PERIOD_DAYS', '14');
INSERT INTO lexora_settings VALUES ('FINE_PER_DAY', '10');
INSERT INTO lexora_settings VALUES ('FINE_GRACE_DAYS', '0');

-- Sample members
INSERT INTO members(full_name, email, phone) VALUES ('Alice Rahman','alice@example.com','017xxxxxxxx');
INSERT INTO members(full_name, email, phone) VALUES ('Bakar Hossain','bakar@example.com','018xxxxxxxx');

-- Sample books
INSERT INTO books(isbn,title,author,category,published_year,total_copies,available_copies)
VALUES('9780140449136','The Odyssey','Homer','Epic',1996,5,5);
INSERT INTO books(isbn,title,author,category,published_year,total_copies,available_copies)
VALUES('9780140449266','The Iliad','Homer','Epic',1998,3,3);
INSERT INTO books(isbn,title,author,category,published_year,total_copies,available_copies)
VALUES('9780679760801','Crime and Punishment','Fyodor Dostoevsky','Novel',1993,4,4);

COMMIT;
