SELECT json_build_object(
    'type', 'FeatureCollection',
    'features', json_agg(ST_AsGeoJSON(f.*, id_column => 'flash_id')::json)
    )
FROM flashes f;