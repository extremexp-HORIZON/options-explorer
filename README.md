# T2.2 Options Explorer

This project addresses the challenges of managing vast, complex, and uncertain data environments by developing a robust framework for experiment-driven analytics. Traditional deterministic models often fail to handle the variability and unpredictability inherent in such systems. To overcome these limitations, the project integrates advanced probabilistic methodologies, such as Bayesian Networks and Markov Decision Processes, to enhance decision-making accuracy and reliability. By aligning system configurations with user intents, the framework ensures adaptability and usability in dynamic contexts. This research also contributes novel algorithms and evaluation metrics to advance the theoretical foundations of experiment-driven analytics, ultimately providing practical tools for optimizing data-driven processes.

### Approach

This project will adopt a methodical approach involving:
- The creation of meta-models to capture variability and user requirements.
- Integration of probabilistic models to align system configurations with user intents.
- Iterative learning from experimentation to continuously refine decision-making models.

## Setup

To set up the project, follow these steps:

1. Clone the repository:
2. Create the **.env** file in the main directory and put these variables in it:
- Create **.env** file

       nano .env

- Add these vriables to .env
        
        DB_NAME=""
        DB_USER=""
        DB_PASSWORD=""
        DB_HOST=""
        DB_PORT=""
        DATASET_FOLDER=""
        PROFILE_FOLDER=""
        JWT_SECRET_KEY=""
        HASH_SAULT=""   

- Optional: For creating JWT_SECRET_KEY you can use this
    ```bash
    node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
    ```
3. Add .env to source
    ```bash
    source .env
    ```
4. Run Docker Compose to set up the necessary services:
    ```bash
    docker-compose up -d
    ```
5. Execute all queries in **/queries**

        cd queries
        cat *.sql | PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -h localhost -p $DB_PORT -d $DB_NAME
