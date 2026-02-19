CREATE OR REPLACE FUNCTION edit_experiment(
    p_experiment_id INT,
    p_title VARCHAR,
    p_domain VARCHAR,
    p_intent VARCHAR,
    p_algorithm VARCHAR,
    p_method VARCHAR,
    p_model VARCHAR,
    p_descriptions JSON
) RETURNS JSON AS $$
DECLARE
    v_description JSON;
	v_result JSON;
BEGIN
    -- Update experiment details
    UPDATE experiments
    SET
        title = p_title,
        domain = p_domain,
        intent = p_intent,
        algorithm = p_algorithm,
        method = p_method,
        model = p_model
    WHERE experiment_id = p_experiment_id;

    -- Delete existing descriptions for this experiment
    DELETE FROM experiment_descriptions
    WHERE experiment_id = p_experiment_id;

    -- Insert new descriptions from JSON array
    FOR v_description IN SELECT * FROM json_array_elements(p_descriptions)
    LOOP
        INSERT INTO experiment_descriptions (experiment_id, description_type_id, value)
        VALUES (
            p_experiment_id,
            (v_description->>'description_type_id')::INT,
            v_description->>'value'
        );
    END LOOP;

	v_result := json_build_object(
        'experiment_id', p_experiment_id,
        'title', p_title,
        'domain', p_domain,
        'intent', p_intent,
        'algorithm', p_algorithm,
        'method', p_method,
        'model', p_model,
        'descriptions', p_descriptions
    );

    -- Return the JSON result
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;
