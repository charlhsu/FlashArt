const photoButton = document.getElementById("photo_button") //Bouton de créatuion de flash
const uploadScreen = document.getElementById("uploadScreen") //div de gestion de l'upload d'image
const mapScreen = document.getElementById("map") //div d'afficahge de la carte
const returnButton = document.getElementById("cancelButton") //Bouton retour en arrière sur l'uplaod page
const saveButton = document.getElementById("saveButton")
const fileInput = document.getElementById("uploadTag") //Balise input pour l'image
const previsualisation = document.getElementById("output")

photoButton.addEventListener('click', FlashButtonClick)
returnButton.addEventListener("click", ReturnButtonClick)
fileInput.addEventListener('change', AddFile)
saveButton.addEventListener('click', saveButtonClick)

//HTML functions
async function FlashButtonClick(e){
    //Displays upload screen
    uploadScreen.style.display = "flex";

}

function ResetUploadScreen(){
    uploadScreen.style.display = "none";
    saveButton.style.display = "none";
    previsualisation.style.display = "none";
    previsualisation.src = "";
    fileInput.value = "";
}

function ReturnButtonClick(e){
    //Closes upload window and resets it
    
    ResetUploadScreen()
}

async function saveButtonClick(e){
    //Adds point at map view center 
    //A faire : compression et redimensionnement en frontend pour éviter de le faire avec des crédits cloudinary
    const bbox = map.getBounds()
    const center = bbox.getCenter()
    const lat = center.lat
    const lng = center.lng

    let [file] = fileInput.files
    
    const response = post_point(lat, lng, "test cloudinary", file)
    console.log(response)
    

    ResetUploadScreen()
    show_points_in_bbox()

}

function AddFile(e){
    let [file] = fileInput.files
    console.log(fileInput)

    //Preview
    const reader = new FileReader();
    reader.onload = (e) => {
        previsualisation.style.display = "block";
        saveButton.style.display = "block";
        previsualisation.src = e.target.result;
    };
    reader.onerror = err => {
        console.error("Error reading file:", err);
        alert("An error occured while reading the file.");
    };

    reader.readAsDataURL(file);
}

//Leaflet functions
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
        const popup_msg = `<b>id</b>: ${layer.feature.id}<br><b>commentaire</b>: ${layer.feature.properties.user_com}</b><img src="${layer.feature.properties.img}" style="height:100px">`
        return popup_msg
    }

    flashLayer = L.geoJSON(features).bindPopup(popup_setup).addTo(map);
}

// async function post_point(lat, lng, com){
//Old version to be deleted

//     try{
//         const response = await fetch("http://127.0.0.1:5000/api/flash", {
//             method : "POST",
//             headers: {
//                 "Content-Type": "application/json"
//             },
//             body : JSON.stringify({
//                 user_com: com,
//                 user_id: 1,
//                 latitude: lat,
//                 longitude: lng
//                 })
//         })
        
//         return response
//     } catch(error){
//         console.error('Echec de la récupération:', error.message)
//         return null
//     }

// }
async function post_point(lat, lng, com, file){
    const formData = new FormData()

    //Defining request paramters
    formData.append("file", file)
    formData.append("user_com", com)
    formData.append("user_id", 1)
    formData.append("latitude", lat)
    formData.append("longitude", lng)

    try{
        //Fetching data to API
        const response = await fetch("http://127.0.0.1:5000/api/flash", {
            method : "POST",
            body : formData
        })
        if (!response.ok){
            const errorData = await response.json()
            throw new Error(errorData.message)
        }
        return response
    } catch(error){
        console.error('Echec de la récupération:', error.message)
        return null
    }

}

async function onMapClick(e) {
    const latlng = e.latlng
    const ok = confirm("Ajouter un point à la carte ?")
    //Posting point by clicking the map is deprecated and to be removed
    if (ok == true){
        try{
            const response = await post_point(latlng.lat, latlng.lng, "Ceci est un test JS")
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

//map.on('click', onMapClick);
map.on('zoomend', onZoomEnd)
map.on('moveend', onMoveEnd)

//Les objets layer sont des objets js basiques, similaire à des dict python.
//Quand ils sont créés via un geojson ils ont automatiquement la structure du geojson (features, properties, geometry)
//Quand ils sont créés via L.Marker par exemple on peut leur ajouter des clefs manuellement : Layer.newData = {"city" : Paris}


