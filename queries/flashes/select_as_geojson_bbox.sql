SELECT json_build_object(
    'type', 'FeatureCollection',
    'features', COALESCE(
        json_agg(ST_AsGeoJSON(f.*, id_column => 'flash_id')::json),
        '[]'::json
    )
)
FROM flashes f
WHERE geom && ST_MakeEnvelope(%s, %s, %s, %s, 4326)