
--DROP FUNCTION register(character varying,character varying,text,character varying,character varying,text,date,character varying,character varying);

CREATE OR REPLACE FUNCTION register(
    name character varying,
    last_name character varying,
    email character varying,
    password character varying,
	profile_pic text DEFAULT NULL,
    address text DEFAULT NULL,
    birth_date date DEFAULT NULL,
    educational_level character varying(50) DEFAULT NULL,
    educational_field character varying(100) DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    new_user_id INT;
BEGIN
    -- Insert the user into the users table
    INSERT INTO users (
        name, last_name, profile_pic, email, password, address, 
        birth_date, status, educational_level, educational_field
    ) VALUES (
        name, last_name, profile_pic, email, 
        password, address, birth_date, 'active', 
        educational_level, educational_field
    )
    RETURNING user_id INTO new_user_id;

    -- Return the newly created user's details as JSON
    RETURN (
        SELECT row_to_json(user_row)
        FROM (
            SELECT 
                users.user_id,
                users.name,
                users.last_name,
                users.profile_pic,
                users.email,
                users.address,
                users.birth_date,
                users.status,
                users.creation_date,
                users.educational_level,
                users.educational_field
            FROM users
            WHERE users.user_id = new_user_id
        ) AS user_row
    );
END;
$$ LANGUAGE plpgsql;