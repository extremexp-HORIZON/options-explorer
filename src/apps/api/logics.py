
from ..utils import Utils
from src.apps import GraphWorld
from src.apps import PolicyIteration
from src.apps import generate_initial_transition_model

import pandas as pd
import json
import numpy as np
import os

def make_soft_constraints(soft_constraints):
    constraints = {}
    for item in soft_constraints:
        if item['type'] == "categorical":
            constraints[item['name']] = item['value']
        elif item['type'] == "numerical":
            constraints[item['name']] = (item['min'], item['max'])

    return constraints



def create_dataset_from_experience(json_data):
    # rewards = {}
    columns = ["experiment_id", "title", "domain", "intent", "algorithm", "method", "model"]
    if json_data is not None and len(json_data) > 0:
        for item in json_data[0]['descriptions']:
            columns.append(item['name'])
            # rewards[item['name']] = (0  ,item['reward'])

        data = []
        for item in json_data:
            row = [item['experiment_id'], item['title'], item['domain'], item['intent'], item['algorithm'], item['method'], item['model']]
            for description in item['descriptions']:
                row.append(description['value'])
            data.append(row)
        dataFrame = pd.DataFrame(data, columns=columns)
        return dataFrame #, rewards
    return pd.DataFrame([] , columns=columns) #, rewards

def create_reward_from_soft_constraints(soft_constraints):
    rewards = {}
    counter = len(soft_constraints)
    for item in soft_constraints:
        rewards[item['name']] = (0 , counter)
        counter -= 1

    return rewards
def calculate_mdp(data_frame , selected_ex_df , soft_constraints , reward_values , modelArchitecture=['intent' , 'algorithm' , 'model']):

    probability_file_name = f'data/probability_{os.getpid()}.csv'
    if not os.path.exists('data'):
        os.makedirs('data')

    print("GENERATING PROBABILITY MATRIX...")
    generate_initial_transition_model(
        data_frame,
        selected_ex_df, 
        feedback_df=[],
        modelArchitecture=modelArchitecture,
        file_name=probability_file_name, modelName="MDP_2")

    print("CREATING THE GRAPH WORLD...")
    problem = GraphWorld(data_frame , modelArchitecture, probability_file_name , soft_constraints , reward_values)

    print("RUNNING MDP...")
    solver = PolicyIteration(problem, gamma=0.9 ,theta=0.005)
    # print(solver.get_utility_values())
    problem.set_utility_values(solver.get_utility_values())
    problem.set_path_utility(solver.path_utility())
    

    os.remove(probability_file_name)

    return sorted(problem.leafs)


# def add_unavaiable_description_types(file_name , all_description_types):
#     data = pd.read_csv(file_name)
#     nonExisting_description_types = []
#     dataset_columns_name = data.columns.to_list()
#     if dataset_columns_name.__contains__('title'):
#         dataset_columns_name.remove('title')
#     dataset_columns_name.remove('domain')
#     dataset_columns_name.remove('intent')
#     dataset_columns_name.remove('algorithm')
#     if dataset_columns_name.__contains__('method'):
#         dataset_columns_name.remove('method')
#     dataset_columns_name.remove('model')

#     for desc in dataset_columns_name:
#         tmp = None #next((i for i in all_description_types if i["name"] == desc) , None)
#         if tmp is None:
#             description_type = {
#                 "name" : desc,
#                 "data_type" : Utils.get_data_type_from_value(data.iloc(0)[0][desc]),
#             }
#             nonExisting_description_types.append(description_type)
#     return nonExisting_description_types


def add_unavaiable_description_types(file_name, all_description_types):
    data = pd.read_csv(file_name)
    nonExisting_description_types = []

    dataset_columns_name = data.columns.to_list()

    if 'title' in dataset_columns_name:
        dataset_columns_name.remove('title')

    dataset_columns_name.remove('domain')
    dataset_columns_name.remove('intent')
    dataset_columns_name.remove('algorithm')

    if 'method' in dataset_columns_name:
        dataset_columns_name.remove('method')

    dataset_columns_name.remove('model')

    for desc in dataset_columns_name:
        tmp = None  # placeholder for future logic

        if tmp is None:
            first_value = data[desc].dropna().iloc[0] #data.at[0, desc]   # 👈 FIXED
            description_type = {
                "name": desc,
                "data_type": Utils.get_data_type_from_value(first_value),
            }
            nonExisting_description_types.append(description_type)

    return nonExisting_description_types


def convert_uc5_to_json(file_name , experience_descriptions , user_id):
    data = pd.read_csv(file_name)
    json_list = []
    dataset_columns_name = data.columns.to_list()
    if dataset_columns_name.__contains__('title'):
        dataset_columns_name.remove('title')
    dataset_columns_name.remove('domain')
    dataset_columns_name.remove('intent')
    dataset_columns_name.remove('algorithm')
    dataset_columns_name.remove('method')
    dataset_columns_name.remove('model')

    for item in range(len(data)):
        descriptions = []
        for desc in dataset_columns_name:
            tmp = next((i for i in experience_descriptions if i["name"] == desc) , None)
            if tmp is not None:
                j_data = tmp.copy()
                j_data['value'] = convert_value_to_json_readable(data.iloc(0)[item][desc])
                descriptions.append(j_data)

        json_data = {
            "userId" : user_id,
            "title" : data.iloc(0)[item]['title'] if dataset_columns_name.__contains__('title') else data.iloc(0)[item]['domain'] ,#"Title", #data[item]['title'],
            "domain" : data.iloc(0)[item]['domain'],
            "intent" : data.iloc(0)[item]['intent'], 
            "algorithm" : data.iloc(0)[item]['algorithm'],
            "method" :data.iloc(0)[item]['method'],
            "model" : data.iloc(0)[item]['model'],
            "descriptions" : descriptions.copy()
        }
        json_list.append(json_data)
    return json_list


def convert_value_to_json_readable(value):
    if pd.isna(value):
        return None
    if isinstance(value, np.integer):
        return int(value)
    if isinstance(value, np.floating):
        return float(value)
    if isinstance(value, np.ndarray):
        return value.tolist()
    return value

class mydict(dict):
    def __str__(self):
        return json.dumps(self)

