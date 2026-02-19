CREATE OR REPLACE FUNCTION add_experiment_description(
    p_experiment_id INT,
    p_description_type_id INT,
    p_value VARCHAR(50)
) RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
    -- Ensure the referenced experiment exists
    IF NOT EXISTS (
        SELECT 1 FROM experiments WHERE experiment_id = p_experiment_id
    ) THEN
        RAISE EXCEPTION 'Experiment ID % does not exist.', p_experiment_id;
    END IF;

    -- Ensure the referenced description type exists
    IF NOT EXISTS (
        SELECT 1 FROM experiment_description_types WHERE description_type_id = p_description_type_id
    ) THEN
        RAISE EXCEPTION 'Description type ID % does not exist.', p_description_type_id;
    END IF;

    -- Insert the new experiment description
    INSERT INTO experiment_descriptions (experiment_id, description_type_id, value)
    VALUES (p_experiment_id, p_description_type_id, p_value)
    RETURNING json_build_object(
        'description_id', description_id,
        'experiment_id', experiment_id,
        'description_type_id', description_type_id,
        'value', value
    ) INTO v_result;

    -- Return the inserted description as JSON
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;
