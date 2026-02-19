CREATE OR REPLACE FUNCTION get_domains_with_counts()
RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'domain', t.domain,
            'experiment_count', t.experiment_count
        )
    )
    INTO v_result
    FROM (
        SELECT
            e.domain,
            COUNT(*) AS experiment_count
        FROM experiments e
        WHERE
            e.domain IS NOT NULL
            AND e.status != 'deleted'
        GROUP BY e.domain
        ORDER BY e.domain
    ) AS t;

    RETURN COALESCE(v_result, '[]'::JSON);
END;
$$ LANGUAGE plpgsql;
