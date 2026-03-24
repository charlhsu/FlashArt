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
import cloudinary
import cloudinary.uploader
from cloudinary import CloudinaryImage
import uuid


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


#Cloudinary setup
cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
api_key = os.getenv("CLOUDINARY_API_KEY")
api_secret = os.getenv("CLOUDINARY_API_SECRET")
cloudinary.config(
    cloud_name = cloud_name,
    api_key = api_key,
    api_secret = api_secret,
    secure=True
)

def load_query(table, name):
    with open(f"queries/{table}/{name}.sql") as f:
        return f.read()


# @app.post("/api/flash")
# def create_flash():

#     try:
#         data = request.get_json()
#         com = data["user_com"]
#         user_id = data["user_id"]
#         longitude = data["longitude"]
#         latitude = data["latitude"]
#         with connection:
#             with connection.cursor() as cursor:
#                 cursor.execute(load_query("flashes", "create_table"))
#                 cursor.execute(load_query("flashes", "insert_return_geojson"), (com, user_id, longitude, latitude))

#                 data = cursor.fetchone()[0]

#                 flash_id = data["id"]

#                 cursor.execute(load_query("users","select_from_flash_id"), (flash_id,))

#                 user_com, user_name = cursor.fetchone()

#         return {"feature": data,
#                 "message": f'User "{user_name}" inserted Flash with comment "{user_com}"'
#                 }, 201
#     except Exception as e:
#         return{
#             "error": str(e)
#         }, 500


@app.post("/api/flash")
def create_flash():
    #Cet endpoint permet de créer une entrée dans la base de donnée et envoie l'image associée dans la base cloudinary
    
    #Gestion des mauvaises requètes
    if "file" not in request.files:
            return jsonify({"error" : "No file part"}), 400
    
    #Gestion du fetch cloudinary
    try:
        #Récupération du fichier contenu dans request.files
        file = request.files["file"]

        #generating unique id for image
        img_id = str(uuid.uuid4())

        #upload cloudinary
        cloudinary.uploader.upload(
            file, 
            public_id = img_id, 
            unique_filename = False, 
            overwrite = True, 
            quality = "auto:eco", 
            fetch_format = "auto",
            height = 800,
            crop = "scale"
        )
        srcURL = CloudinaryImage(img_id).build_url()

    except Exception as e:
        return {
            "message" : str(e)
        }, 500
    
    #Gestion du fetch postgres
    try:
        com = request.form["user_com"]
        user_id = request.form["user_id"]
        longitude = request.form["longitude"]
        latitude = request.form["latitude"]
        with connection:
            with connection.cursor() as cursor:

                #Creation de la table si elle n'existe pas
                cursor.execute(load_query("flashes", "create_table"))

                #Envoie des données à la base
                cursor.execute(load_query("flashes", "insert_return_geojson"), (com, user_id, longitude, latitude, srcURL))

                data = cursor.fetchone()[0]

                flash_id = data["id"]

                #Récupération des user_name dans la table users et user_com dans la table flash via flash_id
                cursor.execute(load_query("users","select_from_flash_id"), (flash_id,))
                user_com, user_name = cursor.fetchone()

        return {"feature": data,
                "message": f'User "{user_name}" inserted Flash with comment "{user_com}"'
                }, 201
    except Exception as e:
        return{
            "error while fetching postgres": str(e)
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

@app.post("/cloudinary/image")
def fetch_image_to_cloudinary():
    #endpoint de test pour fetch des données à cloudinary
    try:
        
        if "file" not in request.files:
            return jsonify({"error" : "No file part"},), 400
        
        #On récupère un objet formData qui contient un fichier
        file = request.files["file"]

        cloudinary.uploader.upload(file, public_id = "test", unique_filename = False, overwrite = True)
        srcURL = CloudinaryImage("test").build_url()

        return {"srcURL" : srcURL}, 200
    except Exception as e:
        return{
            "error: ": str(e)
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
