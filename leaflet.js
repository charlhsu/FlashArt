
async function load_geojson(bbox = null){

    const bboxStr = bbox
        ?[
            bbox.getWest(),
            bbox.getSouth(),
            bbox.getEast(),
            bbox.getNorth()
        ].join(",")
        : ""

    try{
        const base_url = "http://127.0.0.1:5000/api/flash?bbox="
        const URI = base_url.concat(bboxStr)
        const response = await fetch(`http://127.0.0.1:5000/api/flash?bbox=${bboxStr}`, {
            method : "GET",
            headers : {"Content-Type" : "application/json"}
        })
        return response
    } catch(error) {
        console.log("erreur dans load_json")
        console.log(error)
        return null
    }

}

async function show_points_in_bbox(){
    //Get the map bounding box and returns loads a geojson filtered with the bounds into a layer

    const bbox = map.getBounds()

    const response = await load_geojson(bbox)

    const data = await response.json()

    const features = data.features

    console.log(features)

    if (flashLayer){
        map.removeLayer(flashLayer)
    }

    function popup_setup(layer){
        const popup_msg = `<b>id</b>: ${layer.feature.id}<br><b>commentaire</b>: ${layer.feature.properties.user_com}`
        return popup_msg
    }

    flashLayer = L.geoJSON(features).bindPopup(popup_setup).addTo(map);
}

async function post_point(lat, lng){

    try{
        const response = await fetch("http://127.0.0.1:5000/api/flash", {
            method : "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body : JSON.stringify({
                user_com: "ceci est un test JS",
                user_id: 1,
                latitude: lat,
                longitude: lng
                })
        })
        return response
    } catch(error){
        console.error('Echec de la récupération:', error.message)
        return null
    }

}

async function onMapClick(e) {
    const latlng = e.latlng
    const ok = confirm("Ajouter un point à la carte ?")

    if (ok == true){
        try{
            const response = await post_point(latlng.lat, latlng.lng)
            if(!response.ok){
                const errorData = await response.json()
                throw new Error(errorData.error || "Erreur serveur")
            }

            await show_points_in_bbox()

        }catch(error){
            console.log(error)
            return null
        }
    }else{
        //Nothing happens
    }
}

async function onZoomEnd(){
    show_points_in_bbox()
}

async function onMoveEnd(){
    show_points_in_bbox()
}

var map = L.map('map').setView([43.6112539, 3.8700000], 17);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

var flashLayer

await show_points_in_bbox()

map.on('click', onMapClick);
map.on('zoomend', onZoomEnd)
map.on('moveend', onMoveEnd)

//Les objets layer sont des objets js basiques, similaire à des dict python.
//Quand ils sont créés via un geojson ils ont automatiquement la structure du geojson (features, properties, geometry)
//Quand ils sont créés via L.Marker par exemple on peut leur ajouter des clefs manuellement : Layer.newData = {"city" : Paris}


