import pickle
import pandas as pd

class Utils():
    def save_result(data , file_name = "data/result.pickle"):
        print("Saving result to file: ", file_name)
        with open(file_name, 'wb') as handle:
            pickle.dump(data, handle, protocol=pickle.HIGHEST_PROTOCOL)

        print("FINISHED SAVING")



    def load_result(file_name = "data/result.pickle"):
        with open(file_name, 'rb') as handle:
            return pickle.load(handle)
        return None


    def filter_dataFrame(df : pd.DataFrame, hard_constraints : dict):
        data_frame = df.copy()
        for col, condition in hard_constraints.items():
            if isinstance(condition, tuple): 
                low, high = condition
                if low is not None:
                    data_frame = data_frame[data_frame[col] >= low]
                if high is not None:
                    data_frame = data_frame[data_frame[col] <= high]
            else: 
                data_frame = data_frame[data_frame[col] == condition]

        
        return data_frame
    
    def get_data_type_from_value(value):
        if value is None:
            return "unknown"

        if isinstance(value, bool):
            return "categorical"

        if isinstance(value, (int, float)):
            return "numerical"

        if isinstance(value, str):
            try:
                float(value)
                return "numerical"
            except ValueError:
                return "categorical"

        return "categorical"

    # def get_data_type_from_value(value):
    #     try:
    #         if isinstance(value, str):
    #             try:
    #                 float(value)
    #                 return "numerical"
    #             except:
    #                 return "categorical"
    #         else:
    #             return "numerical"
    #     except:
    #         return "numerical"