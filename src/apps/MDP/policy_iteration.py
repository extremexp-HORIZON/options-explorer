import numpy as np
from .graph_world import GraphWorld
class PolicyIteration:
    def __init__(self, graph_world: GraphWorld, gamma , theta):
        self.graph = graph_world
        self.reward_function = np.nan_to_num(graph_world.reward_function)
        self.probability_matrix = graph_world.transition_model
        self.gamma = gamma
        self.theta = theta
        self.data = graph_world.data
        self.modelArchitecture = graph_world.modelArchitecture

    def get_utility_values(self):
        utilities = np.zeros(self.graph.num_states)
        converge = False
        counter = 0
        while not converge:
            temp_utilities = utilities.copy()
            for i in range(self.graph.num_states):
                utilities[i] = self.reward_function[i] +  (self.gamma  * np.sum(self.probability_matrix[i, :] * temp_utilities))
            delta = np.max(np.abs(temp_utilities - utilities))
            if delta < self. theta:
                converge = True
            counter += 1
        print(f"Policy Iteration converged in {counter} iterations.")
        return utilities
    

    def calculate_utility_values(self):
        pass

    def calculate_path_utility(self):
        pass

    
    def path_utility(self):
        # def get_child_utility(state):
        #     if state.children is None or len(state.children) == 0:
        #         return utilities[state.key]
        #     else:
        #         child_values = np.array([])
        #         for item in state.children:
        #             child_values = np.append(child_values , utilities[state.key] + get_child_utility(item))
        #             print(item.value , child_values)
        #         return child_values
            
        # utilities = self.get_utility_values()
        # return get_child_utility(self.graph.states[0])

        #TODO:CHANGE TO RECURSIVE FUNCTION
        path_utilility = np.zeros(len(self.graph.leafs))
        inner_nodes_children = [item.get_action_number() for item in self.graph.get_inner_nodes()]

        utilities = self.get_utility_values()
        cummod = np.concatenate([[0], np.cumsum(inner_nodes_children)])
        
        inner_nodes_number = len(inner_nodes_children)

        for i in range(inner_nodes_number):
            j = np.arange(cummod[i], cummod[i + 1])
            path_utilility[j] = utilities[0] + utilities[i + 1] + utilities[inner_nodes_number+j+1]
        return path_utilility


    def path_order(self , data, modelArchitecture):
        path_util_df = self.path_utility(data,data , modelArchitecture)
        return path_util_df.sort_values(by='path_util', ascending=False).reset_index(drop=True)
