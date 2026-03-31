INSERT INTO flashes (user_com, user_id, geom, img)
VALUES (%s, %s, ST_SetSRID(ST_MakePoint(%s,%s), 4326), %s)
RETURNING ST_AsGeoJSON(flashes.*, id_column => 'flash_id')::json;