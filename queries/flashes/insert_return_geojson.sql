INSERT INTO flashes (user_com, user_id, geom)
VALUES (%s, %s, ST_SetSRID(ST_MakePoint(%s,%s), 4326))
RETURNING ST_AsGeoJSON(flashes.*, id_column => 'flash_id')::json;