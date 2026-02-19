CREATE OR REPLACE FUNCTION add_experiment_description_type(
    p_name VARCHAR(50),
    p_type VARCHAR(50)
) RETURNS JSON AS $$
DECLARE
    v_result JSON;
    v_exists BOOLEAN;
BEGIN
    -- Check if the name already exists
    SELECT EXISTS (
        SELECT 1 FROM experiment_description_types WHERE name = p_name
    ) INTO v_exists;

    -- If the name exists, return a message and do not insert
    IF v_exists THEN
        RETURN json_build_object(
            'status', 'error',
            'message', 'Name already exists'
        );
    END IF;

    -- Insert a new record if the name does not exist
    INSERT INTO experiment_description_types (name, type)
    VALUES (p_name, p_type)
    RETURNING json_build_object(
        'status', 'success',
        'description_type_id', description_type_id,
        'name', name,
        'type', type
    ) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql;
