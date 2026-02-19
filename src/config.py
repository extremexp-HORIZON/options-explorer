import os
import datetime as dt

class Config:
    DATASET_FOLDER = os.getenv("DATASET_FOLDER")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
    PROFILE_FOLDER = os.getenv("PROFILE_FOLDER")
    HASH_SAULT = os.getenv("HASH_SAULT")
    JWT_ACCESS_TOKEN_EXPIRES = dt.timedelta(days=1)
    JWT_REFRESH_TOKEN_EXPIRES = dt.timedelta(weeks=1)