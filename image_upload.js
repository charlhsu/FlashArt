const fileInput = document.getElementById("uploadTag")
const imageOutput = document.getElementById("output");
const imageContainer = document.getElementById("imageContainer")
const uploadScreen = document.getElementById("uploadScreen")

fileInput.addEventListener("change", async()=>{
    let [file] = fileInput.files

    
    imageContainer.style.display = "flex";
    uploadScreen.style.display = "none";

    const reader = new FileReader();
    reader.onload = (e) => {
        imageOutput.src = e.target.result;
    };
    reader.onerror = err => {
        console.error("Error reading file:", err);
        alert("An error occured while reading the file.");
    };

    reader.readAsDataURL(file);
    
})