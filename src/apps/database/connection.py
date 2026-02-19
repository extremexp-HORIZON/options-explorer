import psycopg2
import json
import os

class PostgreSQLConnection:
    def __init__(self):
        self.dbname = os.getenv("DB_NAME")
        self.user = os.getenv("DB_USER")
        self.password = os.getenv("DB_PASSWORD")
        self.host = os.getenv("DB_HOST", "age")
        self.port = os.getenv("DB_PORT", "5432") 
        self.connection = None        
    def connect(self):
        try:
            self.connection = psycopg2.connect(
                dbname=self.dbname,
                user=self.user,
                password=self.password,
                host=self.host,
                port=self.port
            )
            print("Connection to PostgreSQL DB successful")
        except Exception as error:
            print(f"Error connecting to PostgreSQL database: {error}")

    def close(self):
        if self.connection:
            self.connection.close()
            print("PostgreSQL connection closed")
        else :
            print("Could not close PostgreSQL connection")


    def call_function(self , function_name, *args):

        try:
            self.connect()
            cursor = self.connection.cursor()

            query = f"SELECT {function_name}({', '.join(['%s'] * len(args))});"

            cursor.execute(query, args)
    
            ####CONVERT TO JSON
            columns = [desc[0] for desc in cursor.description]
            rows = cursor.fetchall()
            results = [dict(zip(columns, row)) for row in rows]

            ########

            self.connection.commit()

            #result = cursor.fetchone()
            #return results
            return json.dumps(results, indent=4)


        except psycopg2.Error  as error:
            print(error.pgcode)
            print(f"Error calling PostgreSQL function: {error}")
            return None
        finally:
            cursor.close()
            self.close()