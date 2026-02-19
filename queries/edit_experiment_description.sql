CREATE OR REPLACE FUNCTION edit_experiment_description(
    p_description_id INT,
    p_value VARCHAR(50)
) RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
    -- Ensure the experiment description exists
    IF NOT EXISTS (
        SELECT 1 FROM experiment_descriptions WHERE description_id = p_description_id
    ) THEN
        RAISE EXCEPTION 'Description ID % does not exist.', p_description_id;
    END IF;

    -- Update the experiment description
    UPDATE experiment_descriptions
    SET value = p_value
    WHERE description_id = p_description_id
    RETURNING json_build_object(
        'description_id', description_id,
        'experiment_id', experiment_id,
        'description_type_id', description_type_id,
        'value', value
    ) INTO v_result;

    -- Return the updated description as JSON
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;
