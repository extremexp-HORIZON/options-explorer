CREATE OR REPLACE FUNCTION get_experiments_with_count(p_experiment_ids INT[])
RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
    -- Aggregate all experiments with their details and counts into a JSON array
    SELECT json_agg(
        json_build_object(
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
                        'value', ed.value,
						 'name', edt.name,
                         'type', edt.type
                    )
                )
                FROM experiment_descriptions ed
                JOIN experiment_description_types edt
                ON ed.description_type_id = edt.description_type_id
                WHERE ed.experiment_id = e.experiment_id
            ), '[]'::JSON),
            'experiment_count', c.experiment_count
        )
    ) INTO v_result
    FROM (
        -- Count the occurrences of each experiment_id in search_history
        SELECT experiment_id, COUNT(*) AS experiment_count
        FROM search_history
        WHERE experiment_id = ANY (p_experiment_ids)
        GROUP BY experiment_id
    ) c
    JOIN experiments e ON e.experiment_id = c.experiment_id
    WHERE e.status != 'deleted';

    -- Return the aggregated JSON result
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;
