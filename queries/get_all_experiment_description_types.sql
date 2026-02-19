CREATE OR REPLACE FUNCTION get_all_experiment_description_types() 
RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
    -- Select all experiment description types and return them as a JSON array
    SELECT json_agg(
        json_build_object(
            'description_type_id', description_type_id,
            'name', name,
            'type', type
        )
    )
    INTO v_result
    FROM experiment_description_types;

    -- Return the result
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;
