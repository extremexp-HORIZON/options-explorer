CREATE OR REPLACE FUNCTION delete_experiment(
    p_experiment_id INT
) RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
    -- Update the experiment status to 'deleted'
    UPDATE experiments
    SET status = 'deleted'
    WHERE experiment_id = p_experiment_id;

    -- Fetch the updated experiment details
    SELECT json_build_object(
        'experiment_id', experiment_id,
        'user_id', user_id,
        'title', title,
        'domain', domain,
        'intent', intent,
        'algorithm', algorithm,
        'method', method,
        'model', model,
        'status', status,
        'date', date,
        'descriptions', (
            SELECT json_agg(
                json_build_object(
                    'description_id', description_id,
                    'description_type_id', description_type_id,
                    'value', value
                )
            )
            FROM experiment_descriptions
            WHERE experiment_id = p_experiment_id
        )
    )
    INTO v_result
    FROM experiments
    WHERE experiment_id = p_experiment_id;

    -- Return the updated experiment details with 'removed' status
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;
