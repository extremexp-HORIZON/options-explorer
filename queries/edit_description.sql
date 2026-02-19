CREATE OR REPLACE FUNCTION edit_experiment(
    p_experiment_id INT,
    p_title VARCHAR(250) DEFAULT NULL,
    p_domain VARCHAR(100) DEFAULT NULL,
    p_intent VARCHAR(100) DEFAULT NULL,
    p_algorithm VARCHAR(100) DEFAULT NULL,
    p_method VARCHAR(100) DEFAULT NULL,
    p_model VARCHAR(100) DEFAULT NULL,
    p_descriptions JSON[] DEFAULT NULL -- Descriptions to add or update
) RETURNS JSON AS $$
DECLARE
    v_result JSON;
    v_description JSON;
    v_existing_description_ids INT[];
BEGIN
    -- Update the experiment, excluding the status field and ensuring no change to user_id or experiment_id
    UPDATE experiments
    SET
        title = COALESCE(p_title, title),
        domain = COALESCE(p_domain, domain),
        intent = COALESCE(p_intent, intent),
        algorithm = COALESCE(p_algorithm, algorithm),
        method = COALESCE(p_method, method),
        model = COALESCE(p_model, model)
    WHERE experiment_id = p_experiment_id;

    -- Fetch current descriptions associated with the experiment
    SELECT array_agg(description_id)
    INTO v_existing_description_ids
    FROM experiment_descriptions
    WHERE experiment_id = p_experiment_id;

    -- Remove descriptions that are not in the provided JSON (extra descriptions in the table)
    IF v_existing_description_ids IS NOT NULL THEN
        DELETE FROM experiment_descriptions
        WHERE experiment_id = p_experiment_id
        AND description_id NOT IN (SELECT (v_description->>'description_id')::INT FROM json_array_elements(p_descriptions) AS v_description);
    END IF;

    -- Add descriptions from the JSON if they don't exist in the table
    IF p_descriptions IS NOT NULL THEN
        -- Iterate through the descriptions in the JSON
        FOREACH v_description IN ARRAY p_descriptions LOOP
            -- Check if the description already exists
            IF NOT EXISTS (
                SELECT 1
                FROM experiment_descriptions
                WHERE experiment_id = p_experiment_id
                AND description_type_id = (v_description->>'description_type_id')::INT
                AND value = v_description->>'value'
            ) THEN
                -- Insert the new description if it doesn't exist
                INSERT INTO experiment_descriptions (
                    experiment_id, description_type_id, value
                ) VALUES (
                    p_experiment_id,
                    (v_description->>'description_type_id')::INT,
                    v_description->>'value'
                );
            END IF;
        END LOOP;
    END IF;

    -- Fetch the updated experiment details along with descriptions
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

    -- Return the updated experiment details as JSON
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;
