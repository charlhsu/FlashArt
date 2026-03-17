# -*- coding: utf-8 -*-
"""
Created on Tue Feb 24 17:08:42 2026

@author: Charl
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import psycopg2
from dotenv import load_dotenv

CREATE_USERS_TABLE = """
CREATE TABLE IF NOT EXISTS public.users
(
    user_id integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
    user_name character varying(255) COLLATE pg_catalog."default",
    CONSTRAINT users_pkey PRIMARY KEY (user_id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.users
    OWNER to postgres;
"""
INSERT_USER_RETURN_ID = "INSERT INTO users (user_name) VALUES (%s) RETURNING user_id"
FLASH_COUNT = """SELECT COUNT(DISTINCT flash_id) AS nb_flashes FROM Flashes"""



INSERT_WGS84_POINT = "INSERT INTO flashes (geom) VALUES(ST_GeomFromText('POINT(%s, %s)', 4326) WHERE"




# Récuère les paramètres du fichier env
load_dotenv()

app = Flask(__name__)

CORS(app, origins = ["http://localhost:63342", "http://127.0.0.1:5500"])
# Récupère l'url de connection depuis le fichier env
url = os.getenv("DATABASE_URL")
connection = psycopg2.connect(url)

def load_query(table, name):
    with open(f"queries/{table}/{name}.sql") as f:
        return f.read()

@app.post("/api/flash")
def create_flash():

    try:
        data = request.get_json()
        com = data["user_com"]
        user_id = data["user_id"]
        longitude = data["longitude"]
        latitude = data["latitude"]
        with connection:
            with connection.cursor() as cursor:
                cursor.execute(load_query("flashes", "create_table"))
                cursor.execute(load_query("flashes", "insert_return_geojson"), (com, user_id, longitude, latitude))

                data = cursor.fetchone()[0]

                flash_id = data["id"]

                cursor.execute(load_query("users","select_from_flash_id"), (flash_id,))

                user_com, user_name = cursor.fetchone()

        return {"feature": data,
                "message": f'User "{user_name}" inserted Flash with comment "{user_com}"'
                }, 201
    except Exception as e:
        return{
            "error": str(e)
        }, 500

@app.get("/api/flash")
def get_table_as_geojson():
    try:
        bbox = request.args.get("bbox") #Permet de passer un argument dans l'url : /api/flash&bbox=2.3,48.8,2.4,48.9

        with connection:
            with connection.cursor() as cursor:

                if bbox:
                    west, south, east, north = bbox.split(",")
                    cursor.execute(load_query("flashes", "select_as_geojson_bbox"), (west, south, east, north))
                else:
                    cursor.execute(load_query("flashes", "select_as_geojson_all"))

                gjson_data = cursor.fetchone()[0]

        return {"features": gjson_data}, 201
    except Exception as e:
        return {
            "error": str(e)
        }, 500

@app.post("/api/user")
def create_user():
    data = request.get_json()
    user_name = data["user_name"]
    with connection:
        with connection.cursor() as cursor:
            cursor.execute(CREATE_USERS_TABLE)
            cursor.execute(INSERT_USER_RETURN_ID, (user_name,))

            user_id = cursor.fetchone()[0]

    return {"user_id": user_id, "message": f"User \"{user_name}\" created"}, 201
