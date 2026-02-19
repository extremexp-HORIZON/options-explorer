
--DROP FUNCTION login(character varying,character varying);
CREATE OR REPLACE FUNCTION login(
    p_email VARCHAR,
    password_ VARCHAR
)
RETURNS JSON AS $$
BEGIN
    RETURN (
        SELECT row_to_json(user_row)
        FROM (
            SELECT 
                user_id,
                name,
                last_name,
                profile_pic,
                email,
                address,
                birth_date,
                status,
                creation_date,
                educational_level,
                educational_field
            FROM users
            WHERE users.email = p_email AND users.password = password_
        ) AS user_row
    );
END;
$$ LANGUAGE plpgsql;