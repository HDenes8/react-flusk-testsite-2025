function deleteNote(noteId) {
    fetch('/delete-note', {
        method: 'POST',
        body: JSON.stringify({ noteId: noteId })
    }).then((_res) => {
        window.location.href = "/";
    });
}


// settings stuff

//toggle the visibility of profile picture
document.getElementById('selectProfilePicButton').addEventListener('click', function() {
    const menu = document.getElementById('profilePicMenu');
    menu.style.display = (menu.style.display === 'block') ? 'none' : 'block';
});

// Close the menu if the user clicks outside of it
window.addEventListener('click', function(event) {
    const menu = document.getElementById('profilePicMenu');
    const button = document.getElementById('selectProfilePicButton');
    
    if (!menu.contains(event.target) && event.target !== button) {
        menu.style.display = 'none';
    }
});

// settings stuff end

// email box inlargement
document.getElementById("inviteEmails").addEventListener("input", function () {
    this.style.height = "auto"; // Reset height to auto
    this.style.height = (this.scrollHeight) + "px"; // Adjust height
});
// email box inlargement end