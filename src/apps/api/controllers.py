from ..database import PostgreSQLConnection
import json


def LOGIN(email:str , password:str)-> json:
    connection = PostgreSQLConnection()
    user_info = connection.call_function('login' ,email , password)
    if user_info == None:
        return None
    return json.loads(user_info)[0]['login']

def REGISTER(
        name: str, 
        lastname: str,
        email: str,
        password: str,
        profile_pic:  str =None,
        address:  str=None,
        birth_date: str=None,
        educational_level: str=None,
        educational_field: str=None
        ) -> json:
    
    connection = PostgreSQLConnection()
    user_info = connection.call_function(
        'register'
        ,name,
        lastname,
        email, 
        password,
        profile_pic,
        address,
        birth_date,
        educational_level,
        educational_field)
    if user_info == None:
        return None
    return json.loads(user_info)[0]['register']


#TODO GET USER BY ID
#TODO EDIT USER
#TODO DEACTIVATE USER
#TODO ACTIVATE USER
#TODO CHANGE PASSWORD
#TODO GET USER SEARCH HISTORY
#TODO SELEC EXPERIMENT BY USER

#TODO CRAETE SEARCH QUERY TABLE
#TODO RECORD SEARCH QUERY
#TODO GET ADDED USER EXPERIMENTS

#TODO CREATE USER LOG TABLE
#TODO ADD USER LOG
#TODO GET USER LOGS

#TODO GET ADD USER_ID
def ADD_EXPERIENCE(
        userId : int,
        title: str, 
        domain: str,
        intent: str,
        algorithm: str,
        method: str,
        model: str, 
        descriptions) -> json:
    connection = PostgreSQLConnection()

    postgres_descriptions = "{" + ",".join([f'"{json.dumps(item).replace("\"", "\\\"")}"' for item in descriptions]) + "}" if descriptions else None
    # postgres_descriptions = "{{{}}}".format(",".join([json.dumps(item).replace("\"", "\\\"") for item in descriptions])) if descriptions else None
    
    experiment_info = connection.call_function(
        'add_experiment',userId,title,domain,intent,algorithm,method,model,postgres_descriptions
    )

    return json.loads(experiment_info)[0]['add_experiment']

#TODO GET ADD USER_ID
def GET_EXPERIENCE(
        experimentId: int
):
    connection = PostgreSQLConnection()
    experiment_info = connection.call_function(
        'get_experiment', experimentId
    )
    return json.loads(experiment_info)[0]['get_experiment']

#TODO GET ADD USER_ID
def EDIT_EXPERIMENT(
        experimentId: int,
        title: str, 
        domain: str,
        intent: str,
        algorithm: str,
        method: str,
        model: str, 
        descriptions: dict) -> json:
    connection = PostgreSQLConnection()

    experiment_info = connection.call_function(
        'edit_experiment',experimentId, title,domain,intent,algorithm,method,model,json.dumps(descriptions)
    )
    return json.loads(experiment_info)[0]['edit_experiment']


#TODO GET ADD USER_ID
def DELETE_EXPERIMENT(experimentId: int) -> json:
    connection = PostgreSQLConnection()
    experiment_info = connection.call_function(
        'delete_experiment',experimentId
    )
    return json.loads(experiment_info)[0]['delete_experiment']

#TODO GET ADD USER_ID
def ADD_EXPERIENCE_DESCRIPTION_TYPE(
        name: str,
        type: str,
    ) -> json:
    connection = PostgreSQLConnection()
    experiment_info = connection.call_function(
        'add_experiment_description_type',name,type
    )

    return json.loads(experiment_info)[0]['add_experiment_description_type'] if experiment_info else None

#TODO GET ADD USER_ID
def DELETE_EXPERIMENT_DESCRIPTION_TYPE(
        description_type_id: str
    ) -> json:
    connection = PostgreSQLConnection()
    experiment_info = connection.call_function(
        'delete_experiment_description_type',description_type_id
    )
    return json.loads(experiment_info)[0]['delete_experiment_description_type']

#TODO GET ADD USER_ID
def GET_ALL_EXPERIENCE_DESCRIPTION_TYPES() -> json:
    connection = PostgreSQLConnection()
    experiment_info = connection.call_function(
        'get_all_experiment_description_types'
    )

    response = json.loads(experiment_info)[0]['get_all_experiment_description_types']
    if response:
        return response
    return []     

#TODO GET ADD USER_ID
def EDIT_EXPERIMENT_DESCRIPTION_TYPE(
        description_type_id: int,
        name: str,
        type: str,
        reward
    ) -> json:
    connection = PostgreSQLConnection()
    experiment_info = connection.call_function(
        'edit_experiment_description_type',description_type_id,name,type,reward
    )
    return json.loads(experiment_info)[0]['edit_experiment_description_type']

def GET_FILTERED_EXPERIENCES(
        domain:str,
        intent:str,
        algorithm:str,
        method:str,
        description_filters: list
) -> json:
    connection = PostgreSQLConnection()
    experiment_info = connection.call_function(
        'get_filtered_experiments',
        domain,
        intent,
        algorithm,
        method,
        json.dumps(description_filters)
    )

    print("GET_FILTERED_EXPERIENCES result:" , experiment_info)
    
    return json.loads(experiment_info)[0]['get_filtered_experiments']

def ADD_SEARCH_EXPERIMENT_HISTORY(
        user_id: int,
        experiment_id: int
):
    connection = PostgreSQLConnection()
    result = connection.call_function(
        'add_search_history',
        user_id,
        experiment_id
    )

    return json.loads(result)[0]['add_search_history']

def GET_SELECTED_EXPERIMENTS(ids: list):
    connection = PostgreSQLConnection()
    result = connection.call_function(
        'get_experiments_with_count',
        ids
    )
    # return json.loads(result)[0]['get_selected_experiment_count_by_ids']
    return json.loads(result)[0]['get_experiments_with_count']
    
def DELETE_EXPERIMENT(experimentId: int) -> json:
    connection = PostgreSQLConnection()
    result = connection.call_function(
        'delete_experiment',experimentId
    )
    return json.loads(result)[0]['delete_experiment']

def ADD_USER_FEEDBACK(user_id: int , experiment_id: int , rating: float):
    connection = PostgreSQLConnection()
    result = connection.call_function(
        'add_user_rating',
        user_id,
        experiment_id,
        rating
    )
    return json.loads(result)[0]['add_user_rating']

def DELETE_EXPERIMENT_DESCRIPTION_TYPE(
        description_type_id: int
    ) -> json:
    connection = PostgreSQLConnection()
    result = connection.call_function(
        'delete_experiment_description_type',description_type_id
    )

    print("DELETE_EXPERIMENT_DESCRIPTION_TYPE result:" , result)
    return json.loads(result)[0]['delete_experiment_description_type']

def GET_DOMAINS_WITH_COUNTS():
    connection = PostgreSQLConnection()
    result = connection.call_function(
        'get_domains_with_counts'
    )
    return json.loads(result)[0]['get_domains_with_counts']