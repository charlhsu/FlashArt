const fileInput = document.getElementById("uploadTag")
const imageOutput = document.getElementById("output");
const imageContainer = document.getElementById("imageContainer")
const uploadScreen = document.getElementById("uploadScreen")

fileInput.addEventListener("change", async()=>{
    let [file] = fileInput.files

    
    //imageContainer.style.display = "flex";
    uploadScreen.style.display = "none";
    
    /*Preview
    const reader = new FileReader();
    reader.onload = (e) => {
        imageOutput.src = e.target.result;
    };
    reader.onerror = err => {
        console.error("Error reading file:", err);
        alert("An error occured while reading the file.");
    };*/

    //Fetch api cloudinary
    const formData = new FormData()
    formData.append("file", file)

    let img_url
    try{
        console.log(1)
        const response = await fetch ("http://127.0.0.1:5000/cloudinary/image",{
            method : "POST",
            body : formData
        })

        if (!response.ok){
            const errorData = await response.json()
            console.error("Erreur backend; ", errorData)
            throw new Error("Erreur serveur")
        }

        console.log(2)
        const data = await response.json()
        console.log(data.srcURL)
        console.log(3)
    }catch(error){
        console.log(4)
        console.log('Echec de upload:', error.message)
    }

    //reader.readAsDataURL(file);
    
})