CREATE OR REPLACE FUNCTION add_search_history(
    p_user_id INT,
    p_experiment_id INT
)
RETURNS BOOLEAN AS $$
DECLARE
    inserted BOOLEAN;
BEGIN
    -- Try inserting the record
    INSERT INTO search_history (user_id, experiment_id)
    VALUES (p_user_id, p_experiment_id);

    -- Set the return value to TRUE after successful insertion
    inserted := TRUE;

    RETURN inserted;
EXCEPTION
    WHEN OTHERS THEN
        -- In case of any error, return NULL
        RETURN NULL;
END;
$$ LANGUAGE plpgsql;