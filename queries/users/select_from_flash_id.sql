SELECT f.user_com, u.user_name
FROM flashes f
JOIN users u
ON f.user_id = u.user_id
WHERE f.flash_id = %s