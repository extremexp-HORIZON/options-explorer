CREATE OR REPLACE FUNCTION get_experiment_descriptions(
    p_experiment_id INT
) RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
    -- Ensure the experiment exists
    IF NOT EXISTS (
        SELECT 1 FROM experiments WHERE experiment_id = p_experiment_id
    ) THEN
        RAISE EXCEPTION 'Experiment ID % does not exist.', p_experiment_id;
    END IF;

    -- Fetch all descriptions for the given experiment_id and return as JSON array
    SELECT json_agg(
        json_build_object(
            'description_id', description_id,
            'experiment_id', experiment_id,
            'description_type_id', description_type_id,
            'value', value
        )
    )
    INTO v_result
    FROM experiment_descriptions
    WHERE experiment_id = p_experiment_id;

    -- Return the result (return empty JSON array if no descriptions found)
    RETURN COALESCE(v_result, '[]'::JSON);
END;
$$ LANGUAGE plpgsql;
