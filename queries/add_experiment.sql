CREATE OR REPLACE FUNCTION add_experiment(
    p_user_id INT,
    p_title VARCHAR(250),
    p_domain VARCHAR(100),
    p_intent VARCHAR(100),
    p_algorithm VARCHAR(100),
    p_method VARCHAR(100),
    p_model VARCHAR(100),
    p_descriptions JSON[]
) RETURNS JSON AS $$
DECLARE
    v_experiment_id INT;
    v_result JSON;
    v_description JSON;
BEGIN
    -- Check if the experiment already exists
    SELECT experiment_id INTO v_experiment_id
    FROM experiments
    WHERE title = p_title
        AND domain = p_domain
        AND intent = p_intent
        AND algorithm = p_algorithm
        AND method = p_method
        AND model = p_model;

    -- If exists, return existing experiment info
    IF v_experiment_id IS NOT NULL THEN
        v_result := json_build_object(
            'experiment_id', v_experiment_id,
            'message', 'Experiment already exists'
        );
        RETURN v_result;
    END IF;

    -- Insert new experiment
    INSERT INTO experiments (
        user_id, title, domain, intent, algorithm, method, model, status, date
    ) VALUES (
        p_user_id, p_title, p_domain, p_intent, p_algorithm, p_method, p_model, 'active', CURRENT_DATE
    ) RETURNING experiment_id INTO v_experiment_id;

    -- Insert descriptions for the new experiment
    FOREACH v_description IN ARRAY p_descriptions LOOP
        INSERT INTO experiment_descriptions (
            experiment_id, description_type_id, value
        ) VALUES (
            v_experiment_id, 
            (v_description->>'description_type_id')::INT, 
            v_description->>'value'
        );
    END LOOP;

    -- Construct the JSON result
    v_result := json_build_object(
        'experiment_id', v_experiment_id,
        'user_id', p_user_id,
        'title', p_title,
        'domain', p_domain,
        'intent', p_intent,
        'algorithm', p_algorithm,
        'method', p_method,
        'model', p_model,
        'date', CURRENT_DATE,
        'descriptions', p_descriptions
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql;
