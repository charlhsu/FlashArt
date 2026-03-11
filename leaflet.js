
async function load_geojson(){
    try{
        const response = await fetch("http://127.0.0.1:5000/api/flash", {
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
async function create_layer(){
    try{

        const response = await load_geojson()

        const data = await response.json()

        let features = data.features
        console.log("in show point", features)
        const flashLayer = L.geoJSON(features).bindPopup(function (layer) {
            return layer.feature.properties.flash_id;
        }).addTo(map);

        return {flashLayer : flashLayer, features : features}

    }catch(error){
        console.log("erreur dans create_layer")
        console.log(error)
        return null
    }
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

function append_features_to_layer(feature){

    map.removeLayer(flashLayer)
    features.features.push(feature)
    L.geoJSON(features).bindPopup(function (layer) {
            return layer.feature.properties.flash_id;
        }).addTo(map);
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
            const data = await response.json()

            const feature = data.feature

            append_features_to_layer(feature)

        }catch(error){
            console.log(error)
            return null
        }
    }else{
        //Nothing happens
    }
}

var map = L.map('map').setView([43.6112539, 3.8700000], 17);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

var flashLayer
var features

create_layer().then(({flashLayer : layer, features : feats}) => {
    flashLayer = layer
    features = feats
    console.log("in global: ", features)
});

map.on('click', onMapClick);


