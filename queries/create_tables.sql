CREATE TABLE users (
    user_id SERIAL PRIMARY KEY, 
    name VARCHAR(100),           
    last_name VARCHAR(100),      
    profile_pic TEXT,             
    email VARCHAR(255) UNIQUE,    
    password VARCHAR(255),        
    address TEXT,                 
    birth_date DATE,
    status VARCHAR(10),
    creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    educational_level VARCHAR(50),
    educational_field VARCHAR(100)
);


CREATE TABLE experiments (
    experiment_id SERIAL PRIMARY KEY,  
    user_id INT,
    title VARCHAR(250),
    domain VARCHAR(100),                      
    intent VARCHAR(100),                     
    algorithm VARCHAR(100), 
    method VARCHAR(100), 
    model VARCHAR(100),
    status VARCHAR(10),
    date DATE,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE experiment_description_types (
    description_type_id SERIAL PRIMARY KEY,  
    name VARCHAR(50),                     
    type VARCHAR(50)                     
);

CREATE TABLE experiment_descriptions (
    description_id SERIAL PRIMARY KEY,      
    experiment_id INT,                      
    description_type_id INT,                
    value VARCHAR(50),                      
    FOREIGN KEY (experiment_id) REFERENCES experiments(experiment_id)
        ON DELETE CASCADE,
    FOREIGN KEY (description_type_id) REFERENCES experiment_description_types(description_type_id)
);

CREATE TABLE search_history (
    id SERIAL PRIMARY KEY,                      
    user_id INT,                                
    experiment_id INT,                          
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (experiment_id) REFERENCES experiments(experiment_id)
        ON DELETE CASCADE
);

CREATE TABLE user_ratings (
    id SERIAL PRIMARY KEY,                      
    user_id INT,                                
    experiment_id INT,
    rating FLOAT,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (experiment_id) REFERENCES experiments(experiment_id)
        ON DELETE CASCADE
);



