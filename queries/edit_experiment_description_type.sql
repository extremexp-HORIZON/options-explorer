CREATE OR REPLACE FUNCTION edit_experiment_description_type(
    p_description_type_id INT,
    p_name VARCHAR(50),
    p_type VARCHAR(50)
) RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
    -- Update the experiment description type
    UPDATE experiment_description_types
    SET 
        name = p_name,
        type = p_type
        WHERE description_type_id = p_description_type_id
    RETURNING json_build_object(
        'description_type_id', description_type_id,
        'name', name,
        'type', type
    ) INTO v_result;

    -- Return the updated description type as JSON
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;
