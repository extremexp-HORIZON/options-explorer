CREATE OR REPLACE FUNCTION add_user_rating(
    p_user_id INT,                    -- User ID for the rating
    p_experiment_id INT,              -- Experiment ID for the rating
    p_rating FLOAT                    -- Rating value for the experiment
)
RETURNS INT AS $$
DECLARE
    v_rating_id INT;                  -- Variable to store the existing or newly created rating ID
BEGIN
    -- Check if the rating already exists for the given user and experiment
    IF EXISTS (
        SELECT 1
        FROM user_ratings
        WHERE user_id = p_user_id
        AND experiment_id = p_experiment_id
    ) THEN
        -- If the rating exists, update the rating value
        UPDATE user_ratings
        SET rating = p_rating, date = CURRENT_TIMESTAMP
        WHERE user_id = p_user_id
        AND experiment_id = p_experiment_id
        RETURNING id INTO v_rating_id;  -- Return the existing rating ID

    ELSE
        -- If the rating doesn't exist, insert a new record
        INSERT INTO user_ratings (user_id, experiment_id, rating)
        VALUES (p_user_id, p_experiment_id, p_rating)
        RETURNING id INTO v_rating_id;  -- Return the new rating ID
    END IF;

    -- Return the rating ID (whether newly created or updated)
    RETURN v_rating_id;
END;
$$ LANGUAGE plpgsql;
