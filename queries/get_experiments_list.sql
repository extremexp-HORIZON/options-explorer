CREATE OR REPLACE FUNCTION get_filtered_experiments(
    p_domain VARCHAR DEFAULT NULL,
    p_intent VARCHAR DEFAULT NULL,
    p_algorithm VARCHAR DEFAULT NULL,
    p_method VARCHAR DEFAULT NULL,
    p_description_filters JSON DEFAULT NULL -- JSON array of description_type_id, value, and comparison_type
) RETURNS JSON AS $$
BEGIN
    RETURN (
        SELECT COALESCE(json_agg(
            json_build_object(
                'experiment_id', e.experiment_id,
                'title', e.title,
                'domain', e.domain,
                'intent', e.intent,
                'algorithm', e.algorithm,
                'method', e.method,
                'model', e.model,
                'status', e.status,
                'date', e.date,
                'descriptions', (
                    SELECT COALESCE(json_agg(
                        json_build_object(
                            'name', edt.name,
                            'value', ed.value,
                            'type', edt.type
                        )
                    ), '[]'::JSON)
                    FROM experiment_descriptions ed
                    INNER JOIN experiment_description_types edt
                        ON ed.description_type_id = edt.description_type_id
                    WHERE ed.experiment_id = e.experiment_id
                )
            )
        ), '[]'::JSON) -- Ensure empty array instead of NULL
        FROM experiments e
        WHERE 
            (e.status = 'active') AND
            (p_domain IS NULL OR e.domain = p_domain) AND
            (p_intent IS NULL OR e.intent = p_intent) AND
            (p_algorithm IS NULL OR e.algorithm = p_algorithm) AND
            (p_method IS NULL OR e.method = p_method) AND
            (
                p_description_filters IS NULL OR NOT EXISTS (
                    SELECT 1
                    FROM json_array_elements(p_description_filters) AS filter
                    WHERE NOT EXISTS (
                        SELECT 1
                        FROM experiment_descriptions ed
                        WHERE ed.experiment_id = e.experiment_id
                          AND ed.description_type_id = (filter->>'description_type_id')::INT
                          AND (
                              -- Compare numerical values
                              CASE 
                                  WHEN (filter->>'comparison_type') = 'numerical' THEN
                                      CASE
                                          WHEN (filter->>'operator') = '>=' THEN ed.value::NUMERIC >= (filter->>'value')::NUMERIC
                                          WHEN (filter->>'operator') = '<=' THEN ed.value::NUMERIC <= (filter->>'value')::NUMERIC
                                          WHEN (filter->>'operator') = '=' THEN ed.value::NUMERIC = (filter->>'value')::NUMERIC
                                          ELSE FALSE
                                      END
                                  -- Compare categorical values
                                  WHEN (filter->>'comparison_type') = 'categorical' THEN
                                      ed.value = (filter->>'value')
                                  ELSE
                                      FALSE
                              END
                          )
                    )
                )
            )
    );
END;
$$ LANGUAGE plpgsql;
