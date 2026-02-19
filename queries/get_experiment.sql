CREATE OR REPLACE FUNCTION get_experiment(
    p_experiment_id INT
) RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
    -- Fetch the experiment details along with descriptions and their types
    SELECT json_build_object(
        'experiment_id', e.experiment_id,
        'user_id', e.user_id,
        'title', e.title,
        'domain', e.domain,
        'intent', e.intent,
        'algorithm', e.algorithm,
        'method', e.method,
        'model', e.model,
        'status', e.status,
        'date', e.date,
        'descriptions', COALESCE((
            SELECT json_agg(
                json_build_object(
                    'description_id', ed.description_id,
                    'description_type_id', ed.description_type_id,
                    'value', ed.value,
                    'description_type', json_build_object(
                        'name', edt.name,
                        'type', edt.type
                    )
                )
            )
            FROM experiment_descriptions ed
            JOIN experiment_description_types edt
            ON ed.description_type_id = edt.description_type_id
            WHERE ed.experiment_id = e.experiment_id
        ), '[]'::JSON)
    ) INTO v_result
    FROM experiments e
    WHERE e.experiment_id = p_experiment_id AND e.status != 'deleted';

    -- If no result is found, return NULL
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;
