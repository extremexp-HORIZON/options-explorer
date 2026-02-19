import numpy as np
import pandas as pd 


def generate_initial_transition_model(data: pd.DataFrame, 
                                    selected_df : pd.DataFrame,
                                    feedback_df: pd.DataFrame,
                                    modelArchitecture :list,
                                    file_name: str = "data/graph_world00.csv",
                                    modelName: str = "MDP_3"):
    
    data_array = []
    state_pos_dic = {}
    pos = 0
    for item in modelArchitecture:
        children = list(data[item].value_counts().index)
        children.sort(key=str.lower)
        for child in children:
            state_pos_dic[child] = pos
            pos+=1
        data_array.append(children)
    
    total_states = sum([len(x) for x in data_array])
    initial_transitions = np.zeros((total_states , total_states))

    for i in range(len(data_array)-1):
        for j in range(len(data_array[i])):
            parent = data_array[i][j]
            children = data[modelArchitecture[i+1]][data[modelArchitecture[i]] == parent].value_counts().keys().to_numpy()
            parent_pos = state_pos_dic[parent]

            
            if len(selected_df) > 0:
                selected_parent_child_df = selected_df[selected_df[modelArchitecture[i]] == parent].groupby(modelArchitecture[i+1])['experiment_count'].sum()
                total_length = len(data[modelArchitecture[i+1]][data[modelArchitecture[i]] == parent])  + selected_parent_child_df.sum() #len(children)  +
            else:
                total_length = len(data[modelArchitecture[i+1]][data[modelArchitecture[i]] == parent]) 
            
            for child in children:                
                child_count = len(data[modelArchitecture[i+1]][(data[modelArchitecture[i]] == parent) & (data[modelArchitecture[i+1]] == child)])
                if len(selected_df) > 0:
                    prob = (child_count+selected_parent_child_df.get(child , default=0))/total_length
                else:
                    prob = (child_count)/total_length
                child_pos = state_pos_dic[child]
                initial_transitions[parent_pos][child_pos] = prob
                if i == len(data_array)-2:
                    try:
                        feedback = feedback_df[feedback_df[modelArchitecture[-1]] == child]['feedback'].values[0]
                        feedback_count = feedback_df[feedback_df[modelArchitecture[-1]] == child]['count'].values[0]
                        max_number = feedback_df['count'].max()

                        transition_value = combine_probablity_with_feedback(prob,
                                                            feedback,
                                                            feedback_count,
                                                            max_number,
                                                            alpha=0.5)
                    except:
                        transition_value = combine_probablity_with_feedback(prob,
                                                            0,
                                                            0,
                                                            0,
                                                            alpha=0.5)
                        
                    if modelName == "MDP_3":
                        initial_transitions[child_pos][child_pos] = transition_value
                    elif modelName == "MDP_2":
                        initial_transitions[child_pos][child_pos] = prob
                    else:   
                        initial_transitions[child_pos][child_pos] = 1.0

    ## assign 1.0 probability to each leaf
    # for i in range(len(data_array[-1])):
    #         leaf = data_array[len(data_array)-1][i]
    #         leaf_pos = state_pos_dic[leaf]
    #         initial_transitions[leaf_pos][leaf_pos] = 1.0


    columns = dict((v,k) for k,v in state_pos_dic.items())
    df = pd.DataFrame(initial_transitions , columns=[columns[i] for i  in range(initial_transitions.shape[0])] \
                    ,index=[columns[i] for i  in range(initial_transitions.shape[0])])
    df.to_csv(file_name)


    # sdf = df.astype(pd.SparseDtype("float", 0.0))

    # print('dense : {:0.2f} bytes'.format(df.memory_usage().sum() / 1e3))
    # print('sparse: {:0.2f} bytes'.format(sdf.memory_usage().sum() / 1e3))


    return initial_transitions


def combine_probablity_with_feedback(prob, feedback, feedback_count, max_number, alpha=0.5):
    if feedback is None:
        f_hat = 0.5
    else:
        f_hat = feedback
    w_i = feedback_count / max_number if max_number > 0 else 0.0
    F_i = alpha * f_hat * w_i + (1 - alpha)
    P_tilde = prob * F_i
    return P_tilde

