CREATE OR REPLACE FUNCTION delete_experiment_description_type(
    p_description_type_id INT
) RETURNS JSON AS $$
DECLARE
    v_result JSON;
    v_count INT;
BEGIN
    -- Check if the description type is used in the experiment_descriptions table
    SELECT COUNT(*) INTO v_count
    FROM experiment_descriptions
    WHERE description_type_id = p_description_type_id;

    -- If there are any references, raise an exception
    IF v_count > 0 THEN
        RAISE EXCEPTION 'Description type ID % is in use and cannot be deleted.', p_description_type_id;
    END IF;

    -- If not in use, delete the description type
    DELETE FROM experiment_description_types
    WHERE description_type_id = p_description_type_id
    RETURNING json_build_object(
        'description_type_id', description_type_id,
        'name', name,
        'type', type    
        ) INTO v_result;

    -- Return the result (which will be NULL if no rows were deleted)
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;
