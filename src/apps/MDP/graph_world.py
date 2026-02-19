import numpy as np
import pandas as pd
import networkx as nx
import matplotlib.pyplot as plt

class GraphWorld():
    def __init__(
            self,
            data, 
            modelArchitecture,
            probability_file_name,
            constraints,
            reward_values
        ):

        print("REWARD_VALUES:", reward_values)

        self.data = data.sort_values(modelArchitecture[-1])
        self.probability_matrix = pd.read_csv(probability_file_name , index_col=0)
        self.num_states = self.probability_matrix.shape[0]
        self.modelArchitecture = modelArchitecture
        self.inner_node_num = self.__get_inner_nodes_num__()
        self.reward_function = self.get_reward_function(self.data , constraints , reward_values)
        self.transition_model = self.probability_matrix.to_numpy()
        
        # self.states = self.__get_states__()
        self.states = self.__create_graph__()
        self.leafs = self.__get_leafs__()

    def __create_graph__(self):
        graph_states = []
        item_count = 0
        for i in range(len(self.modelArchitecture)):
            column = self.modelArchitecture[i]
            columns_values = list(self.data[column].value_counts().index)
            columns_values.sort(key=str.lower)
            for value in columns_values:
                children = None
                type_ = column
                data_ = None
                if i < len(self.modelArchitecture) - 1:
                    children = self.data[self.modelArchitecture[i+1]][self.data[self.modelArchitecture[i]] == value].value_counts().keys().to_numpy()
                else:    
                    data_ = self.data[self.data[column] == value].iloc[0]
                state = GraphState(
                    item_count,
                    children if children is not None else [],
                    value,
                    reward=self.reward_function[item_count],
                    type_ = type_,
                    data=data_,)
                graph_states.append(state)
                item_count += 1            
        for state in graph_states:
            children_states = []
            for child in state.children:
                for s in graph_states:
                    if s.value == child:
                        children_states.append(s)
                        break
            state.children = children_states
        return graph_states
    
    def __get_inner_nodes_num__(self):
        inner_node_num = 0
        for i in range(len(self.modelArchitecture)-1):
            children = list(self.data[self.modelArchitecture[i]].value_counts().index)
            inner_node_num += len(children)
        return inner_node_num

    def __get_leafs__(self):
        return [state for state in self.states if state.get_type() == self.modelArchitecture[-1]]


    def __get_tree_structure__(self):
        data_array = []
        tree_structure = {}
        for item in self.modelArchitecture:
            children = list(self.data[item].value_counts().index)
            children.sort(key=str.lower)
            data_array.append(children)
        
        for i in range(len(data_array)-1):
            for j in range(len(data_array[i])):
                parent = data_array[i][j]
                children = self.data[self.modelArchitecture[i+1]][self.data[self.modelArchitecture[i]] == parent].value_counts().keys().to_numpy()
                if len(children) > 0:
                    tree_structure[parent] = children
                else:
                    tree_structure[parent] = []

        return tree_structure

    def get_inner_nodes(self):
        inner_nodes = []
        for state in self.states:
            if state.get_type() is not self.modelArchitecture[-1] \
            and  state.get_type() is not self.modelArchitecture[0]:
                    inner_nodes.append(state)    
        return inner_nodes

    def __get_states__(self):
#        inner_node_num = self.num_states - len(self.data)
        states_array = []
        i, c = np.where(self.probability_matrix.apply(lambda x: x != 0))
        print(len(i), len(c))
        a = list(zip(i, c))
        a = [(int(i) , int(j)) for (i , j) in a ]
        
        for item in range(self.num_states):
            value = None if item < self.__get_inner_nodes_num__() else self.data.iloc[item-self.__get_inner_nodes_num__()]
            reward = self.reward_function[item]
            state = GraphState(item , [ j for ( i , j) in a if i == item] , value , reward)
            states_array.append(state)
        
        return states_array

    def get_reward_function(self , data , constraints , reward_values):
        #inner_node_num = self.num_states - len(data)
        reward_function =  np.concatenate(
            (np.zeros((self.__get_inner_nodes_num__() , ) , dtype='float64'),  
            self.get_rewards(data , constraints , reward_values)),
            axis=0
        )
        return reward_function
    

    def rewards_num_calc(self , data, constraints=(None, None), rewards=(0, 1)):
        data = np.array(data, dtype=float)
        if constraints[0] is None:
            constraints = (data.min(), constraints[1])
        if constraints[1] is None:
            constraints = (constraints[0], data.max())

        reward_array = np.full(len(data), rewards[0], dtype=float)
        reward_array[(data >= constraints[0]) & (data <= constraints[1])] = rewards[1]

        return reward_array

    def rewards_cat_calc(self , data, categories=None, rewards=(0, 1)):
        data = np.array(data, dtype=str)
        reward_array = np.full(len(data), rewards[0], dtype=float)
        reward_array[np.isin(data, categories)] = rewards[1]
        return reward_array


    def get_rewards(self , data, constraints=None, reward_values=None):
        cumulative_rewards = np.zeros(len(data))
        for col in data.columns:
            if col in constraints:
                constraint = constraints.get(col)
                if constraint is None:
                    continue
                reward = reward_values.get(col, (0, 1))

                print("Processing column:", constraint, "with reward:", isinstance(constraint, str))
                if isinstance(constraint, str):  # Categorical constraint
                    cumulative_rewards += self.rewards_cat_calc(data[col], categories=[constraint], rewards=reward)
                elif isinstance(constraint, tuple) and len(constraint) == 2:  # Numeric constraint
                    cumulative_rewards += self.rewards_num_calc(data[col], constraints=constraint, rewards=reward)
                else:
                    raise ValueError(f"Invalid constraint for column {col}: {constraint}")

        return cumulative_rewards

    def set_utility_values(self , utility_values):
        if len(utility_values) != self.num_states:
            raise ValueError(f"The length of the utility_values array and states array are not the same!")
        for item in self.states:
            item.utility_value = utility_values[item.key]

    def set_path_utility(self , path_utility):
        if len(path_utility) != len(self.leafs):
            raise ValueError(f"The length of the utility_values array and states array are not the same!")
        counter = 0
        for item in self.leafs:
            item.utility_path = path_utility[counter]
            counter += 1


    def set_states_rewards(self , reward_function):
        if len(reward_function) != self.num_states:
            raise ValueError(f"The length of the reward array and states array are not the same!")
        
        for item in self.states:
            item.reward = reward_function[item.key]
    
class GraphState():
    def __init__(
            self,key,
            children,
            value : pd.Series = None,
            reward = None, 
            type_ = None,
            utility_value = 0.0, 
            utility_path=0.0,
            data=None,
        ):
        self.children = children
        self.key = key  
        self.reward = reward
        self.utility_value = utility_value
        self.utility_path = utility_path
        self.value = value
        self.type_ = type_
        self.data = data

    def get_action_number(self):
        return len(self.children)
    
    def get_type(self):
        return self.type_

    def __str__(self):
        return str(self.__dict__)
    

    def __lt__(self, other):

        if self.utility_path is not None and other.utility_path is not None:
            if self.utility_path >= other.utility_path:
                return True
            else:
                return False
        else:
            return False
            # elif self.utility_value == other.utility_value:
            #     if self.data is None or other.data is None:
            #         return self.utility_value >= other.utility_value
            #     else:
            #         return self.data.accuracy >= other.data.accuracy
        
        # if self.data is None or other.data is None:
        #     return self.utility_value >= other.utility_value
        # else:
        #     if self.utility_value > other.utility_value:
        #         return True
        #     elif self.utility_value == other.utility_value:
        #         return self.value.accuracy >= other.value.accuracy 
        #     else:
        #         return False