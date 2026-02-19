import json
from pathlib import Path
import os
import pandas as pd

from flask import Blueprint , request , abort
from flask_jwt_extended import jwt_required, get_jwt_identity

from werkzeug.utils import secure_filename

from config import Config
from ..controllers import (
    ADD_EXPERIENCE, 
    GET_EXPERIENCE,
    ADD_EXPERIENCE_DESCRIPTION_TYPE, 
    GET_ALL_EXPERIENCE_DESCRIPTION_TYPES, 
    GET_FILTERED_EXPERIENCES,
    ADD_SEARCH_EXPERIMENT_HISTORY,
    GET_SELECTED_EXPERIMENTS,
    ADD_USER_FEEDBACK,
    GET_DOMAINS_WITH_COUNTS,
    DELETE_EXPERIMENT_DESCRIPTION_TYPE,
    DELETE_EXPERIMENT
)

from ..logics import (
    create_dataset_from_experience,
    make_soft_constraints,
    calculate_mdp, 
    convert_uc5_to_json,
    add_unavaiable_description_types,
    create_reward_from_soft_constraints
)

from ..utils import response_handler , allowed_file
import uuid

bp = Blueprint('experiment', __name__)


#TODO: CALL MDP constraints
#TODO: EDIT EXPERIENCE
#TODO: DELETE EXPERIENCE
#TODO: EDIT EXPERIENCE DESCRIPTION TYPE
#TODO: DELETE EXPERIENCE DESCRIPTION TYPE
#TODO: GET USER RATINGS IN EXPERIMENTS
#TODO: Add select experiment and feedback to the call_mdp
#TODO: FIX TRANSITION MATRIX PROBLEM


@bp.route('/add_experiment', methods=['POST'])
@jwt_required()
def add_experiment():
    if request.method == 'POST':
        userId = json.loads(get_jwt_identity())['user_id']
        data = json.loads(request.get_data(as_text=True))
        title = data['title']
        domain = data['domain']
        intent = data['intent']
        algorithm = data['algorithm']
        method = data['method']
        model = data['model']
        descriptions = data['descriptions']
        response = ADD_EXPERIENCE(
            userId,
            title,
            domain,
            intent,
            algorithm,
            method,
            model,
            descriptions
        )
        if response:
            return response_handler(response)
        else:
            abort(401)


@bp.route('/get_experiment', methods=['GET'])
@jwt_required()
def get_experience():
    if request.method == 'GET':
        experiment_id = request.args.get('experiment_id')
        response = GET_EXPERIENCE(experiment_id)
        if response:
            return response_handler(response)
        else:    
            abort(404 , description="Experiment not found")


@bp.route('/add_experiment_description_type', methods=['POST'])
@jwt_required()
def add_experiment_description_type():
    if request.method == 'POST':
        name = request.form['name']
        type_ = request.form['type']
        response = ADD_EXPERIENCE_DESCRIPTION_TYPE(name, type_)
        if response:
            return response_handler(response)
        else:
            abort(401)


@bp.route('/get_experiment_description_types', methods=['GET'])
@jwt_required()
def get_description_types():
    if request.method == 'GET':
        response = GET_ALL_EXPERIENCE_DESCRIPTION_TYPES()
        if response:
            return response_handler(response)
        else:
            abort(404)



@bp.route('/call_mdp', methods=['POST'])
@jwt_required()
def call_mdp():
    if request.method == 'POST':
        json_data = json.loads(request.get_data(as_text=True))
        domain = json_data['domain']
        intent = json_data['intent']
        algorithm = json_data['algorithm']
        method = json_data['method']
        if algorithm is not None and algorithm.strip() == "":
            algorithm = None
        if method is not None and method.strip() == "":
            method = None
        hard_constraints = json_data['hard_constraints']
        soft_constraints = json_data['soft_constraints']
        if intent is None and domain is None and algorithm is None and method is None and \
            (hard_constraints is None or len(hard_constraints) == 0):
                return response_handler(error="At least one hard constraints are required", status_code=400)
        
        if soft_constraints is None or len(soft_constraints) == 0:
            return response_handler(error="At least one soft constraints are required", status_code=400)
        

        filtered_response = GET_FILTERED_EXPERIENCES(
            domain,
            intent,
            algorithm,
            method,
            hard_constraints
        )
        
        experiment_ids_list =  [item['experiment_id'] for item in filtered_response]
        selected_response = GET_SELECTED_EXPERIMENTS(experiment_ids_list)
        if filtered_response is not None:
            if len(filtered_response) == 0:
                return response_handler(error="No experiences found with the given constraints", status_code=404)
            data_frame  = create_dataset_from_experience(filtered_response)
            
            #to avoid duplicate models
            data_frame['model_id'] = data_frame['model'] + "_" + data_frame['experiment_id'].astype(str)
            
            selected_df =  create_dataset_from_experience(selected_response)
            if selected_df is not None and len(selected_df) > 0:
                selected_df['experiment_count'] = [item['experiment_count'] for item in selected_response]
                #to avoid duplicate models
                selected_df['model_id'] = selected_df['model'] + "_" + selected_df['experiment_id'].astype(str)
            rewards = create_reward_from_soft_constraints(soft_constraints)

            print("rewards:", rewards)
            sorted_graph = calculate_mdp(data_frame ,selected_df,
                                        make_soft_constraints(soft_constraints),
                                        rewards,
                                        ['intent' , 'algorithm' , 'model_id'])
            json_array = []
            for item in sorted_graph:
                temp = item.data.to_dict()
                temp['utility_value'] = item.utility_value
                temp['path_utility'] = item.utility_path
                del temp['model_id']
                json_array.append(temp)

            print("MDP calculation completed.", len(json_array), "results found.")
            # print(json.dumps(json_array , indent=4))
            return response_handler(json_array)

@bp.route('/select_experiment' ,  methods=['GET'])
@jwt_required()
def click_experiment():
    if request.method == 'GET':
        experiment_id = request.args.get('experiment_id')
        user_id = json.loads(get_jwt_identity())['user_id']
        if experiment_id is None:
            abort(400 ,description='missing experiment_id' )
        
        response = ADD_SEARCH_EXPERIMENT_HISTORY(
            user_id,
            experiment_id
        )

        if response is not None:
            return response_handler()
        else:
            return abort(404 , description='Experiment not found')
    else:
        abort(405)

@bp.route('/get_selected_experiments' , methods=['POST'])
@jwt_required()
def get_selected_experiments():
    if request.method == "POST":
        experiment_ids = json.loads(request.get_data(as_text=True))['experiment_ids']
        if experiment_ids is None or len(experiment_ids) == 0:
            abort(404 , "missing experiment_ids")
        
        list_ids = [item['id'] for item in experiment_ids]
        response = GET_SELECTED_EXPERIMENTS(list_ids)
        if response is not None:
            return response_handler(response)
        else:
            abort(404)
    else:
        abort(405)


@bp.route('/add-uc5-dataset', methods=['POST'])
@jwt_required()
def add_uc5():   
    if request.method == 'POST':
        if 'file' not in request.files:
            abort(400, description="No file part")
        file = request.files['file']
        if file.filename == '':
            abort(400, description="No selected file")
        if file and allowed_file(file.filename , ['csv']):
            FILE_SIZE_LIMIT = 1024 * 1024
            file.seek(0, 2) 
            fileSize = file.tell()
            file.seek(0) 
            if fileSize > FILE_SIZE_LIMIT:
                abort(400, description=f"File size exceeds the maximum limit of {FILE_SIZE_LIMIT/1024/1024} MB")
            filename = secure_filename(file.filename)
            dataset_dir = Config.DATASET_FOLDER
            Path(dataset_dir).mkdir(parents=True, exist_ok=True)
            file_dir = os.path.join(dataset_dir, filename)
            file.save(file_dir)
            user_id = json.loads(get_jwt_identity())['user_id']
            add_non_existig_description_types = request.form.get('add_non_existing_description_types' , 'false')
            all_description_types = GET_ALL_EXPERIENCE_DESCRIPTION_TYPES()
            if add_non_existig_description_types.lower() == 'true':
                non_existing_description_types = add_unavaiable_description_types(file_dir , all_description_types)
                for desc in non_existing_description_types:
                    ADD_EXPERIENCE_DESCRIPTION_TYPE(
                        desc['name'],
                        desc['data_type']
                    )
            all_description_types = GET_ALL_EXPERIENCE_DESCRIPTION_TYPES()
            json_list_data = convert_uc5_to_json(file_dir , all_description_types , user_id)
            response_list = []
            maxSize = len(json_list_data)
            counter = 0
            for item in json_list_data:
                counter += 1
                response = ADD_EXPERIENCE(
                    item['userId'],
                    item['title'],
                    item['domain'],
                    item['intent'],
                    item['algorithm'],
                    item['method'],
                    item['model'],
                    item['descriptions']
                )
                response_list.append(response)
                print(f'Processed {counter} of {maxSize} ')
            os.remove(file_dir)
            if len(response_list) > 0:
                exist_list = []
                for item in response_list:  
                    if item.get('message') is not None:
                        exist_list.append(item['experiment_id'])
                if (len(response_list) - len(exist_list)) > 0 and len(exist_list) > 0:
                    message_ = f'{len(response_list) - len(exist_list)} experiment added successfully' \
                    f' and experience_ids {exist_list} already exist'
                elif len(response_list) - len(exist_list) > 0:
                    message_ = f'{len(response_list) - len(exist_list)} experiments added successfully'
                else:
                    message_ = f'All experiments already exist'
                return response_handler(message=message_)
        else:
            return abort(400 ,description="File type not allowed")
    else:
        abort(405)

@bp.route('/get_domains_with_counts', methods=['GET'])
@jwt_required()
def get_domains_with_counts():
    if request.method == 'GET':
        response = GET_DOMAINS_WITH_COUNTS()
        if response is not None:
            return response_handler(response)
        else:
            abort(404)
    else:
        abort(405)
@bp.route('/add_user_feedback', methods=['POST'])
@jwt_required()
def add_user_feedback():
    if request.method == 'POST':
        user_id = json.loads(get_jwt_identity())['user_id']
        experiment_id = request.form['experiment_id']
        rating = request.form['rating']
        # print(experiment_id , rating)
        if (experiment_id is None) or (rating is None):
            abort(400)
        response = ADD_USER_FEEDBACK(user_id, experiment_id, rating)
        if response is not None:
            return response_handler()
        else:
            abort(400)
    else:
        abort(405)