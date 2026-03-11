# FlashArt

**Demo live:** LINK

Ce projet a eu pour but de me former sur les technologies suivantes   
-**Description du projet**-  
-Flask API et le développement d'API  
-PostgreSQL   
-PostGIS  
-html  
-JavaScript  
-Leaflet  

## Stack 
-PostgreSQL/PostGIS  
-Flask API  
-Leaflet  
-JS async fetch  

## Installation  
### Prérequis 
-Python  
-PostgreSQL avec PostGIS

### Etapes
```Bash
git clone  https://github.com/charlhsu/FlashArt.git   
pip install -r requirements.txt
``` 
-Création d'une base vide à remplir avec `db.sql` (à créer pour recréer la base)  
-Creation d'un fichier `.flaskenv`   
`FLASKAPP=app`  
-creation d'un fichier `.env`  
`DATABASE_URL = "postgresql://user:mdp@localhost:5432/FlashArt"`  
```bash  
flask run
```




