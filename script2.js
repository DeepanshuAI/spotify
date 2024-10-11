let currentSong = new Audio();
let songs;
let currFolder;

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

async function getSongs(folder) {
    currFolder = folder;
    try {
        let response = await fetch(`/${folder}/`);
        if (!response.ok) {
            console.error(`Failed to fetch songs from folder: ${folder}`);
            return;
        }

        let html = await response.text();
        let div = document.createElement("div");
        div.innerHTML = html;
        let anchors = div.getElementsByTagName("a");
        songs = [];
        for (let element of anchors) {
            if (element.href.endsWith(".mp3")) {
                songs.push(element.href.split(`/${folder}/`)[1]);
            }
        }

        // Display songs in the playlist
        let songUL = document.querySelector(".songlist ul");
        songUL.innerHTML = "";
        for (const song of songs) {
            songUL.innerHTML += `<li>
                                   <img class="invert" width="34" src="img/music.svg" alt="">
                                   <div class="info">
                                       <div>${song.replaceAll("%20", " ")}</div>
                                       <div>Artist Name</div>
                                   </div>
                                   <div class="playNow">
                                       <span>Play Now</span>
                                       <img class="invert" src="img/play.svg" alt="">
                                   </div>
                                 </li>`;
        }

        // Attach event listener to play selected song
        document.querySelectorAll(".songlist li").forEach(e => {
            e.addEventListener("click", () => {
                playMusic(e.querySelector(".info div").textContent.trim());
            });
        });
    } catch (error) {
        console.error(`Error fetching songs from folder ${folder}:`, error);
    }
}

const playMusic = (track, pause = false) => {
    currentSong.src = `/${currFolder}/` + track;
    if (!pause) {
        currentSong.play();
        play.src = "pause.svg";
    }
    document.querySelector(".songinfo").textContent = decodeURI(track);
    document.querySelector(".songtime").textContent = "00:00 / 00:00";
};

async function displayAlbums() {
    try {
        let response = await fetch(`/songs/`);
        if (!response.ok) {
            console.error("Failed to fetch albums list from /songs/");
            return;
        }

        let html = await response.text();
        let div = document.createElement("div");
        div.innerHTML = html;
        let anchors = div.getElementsByTagName("a");
        let cardContainer = document.querySelector(".cardContainer");

        cardContainer.innerHTML = "";  // Clear existing cards

        for (let e of anchors) {
            if (e.href.includes("/songs/") && !e.href.includes(".htaccess")) {
                let folder = e.href.split("/").slice(-2)[0];
                
                try {
                    let albumResponse = await fetch(`/songs/${folder}/info.json`);
                    if (!albumResponse.ok) {
                        console.warn(`No info.json found for album: ${folder}`);
                        continue;
                    }

                    let albumData = await albumResponse.json();

                    // Check if the cover image exists before adding the card
                    let coverImage = `/songs/${folder}/cover2.jpg`;
                    let coverImageResponse = await fetch(coverImage);
                    if (!coverImageResponse.ok) {
                        console.warn(`Cover image not found for album: ${folder}`);
                        coverImage = "default-cover.jpg"; // Fallback image
                    }

                    // Dynamically insert album card
                    cardContainer.innerHTML += `
                        <div data-folder="${folder}" class="card">
                            <img src="${coverImage}" alt="Cover of ${albumData.title}">
                            <div class="play">
                                <div class="circle">
                                    <img src="play-svgrepo-com.svg" alt="play button">
                                </div>
                            </div>
                            <h3>${albumData.title}</h3>
                            <p>${albumData.description}</p>
                        </div>`;
                } catch (err) {
                    console.error(`Error fetching album data for folder ${folder}:`, err);
                }
            }
        }

        // Add event listeners to dynamically created album cards
        document.querySelectorAll(".card").forEach(card => {
            card.addEventListener("click", async () => {
                const folder = card.getAttribute("data-folder");
                console.log(`Album clicked: ${folder}`);
                await getSongs(`songs/${folder}`);
                playMusic(songs[0]);
            });
        });
    } catch (error) {
        console.error("Error loading albums:", error);
    }
}

async function main() {
    // Initialize with default album (Shiva)
    await getSongs("songs/Shiva");
    playMusic(songs[0], true);

    // Display all albums dynamically
    displayAlbums();

    // Add play/pause event listener
    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "pause.svg";
        } else {
            currentSong.pause();
            play.src = "play.svg";
        }
    });

    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").textContent = `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
        document.querySelector(".circle2").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
    });

    // Seekbar event to skip through the song
    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle2").style.left = percent + "%";
        currentSong.currentTime = ((currentSong.duration) * percent) / 100;
    });

    // Add click event for the hamburger menu
    document.querySelector(".hamburgerr").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    // Previous and Next song functionality
    previous.addEventListener("click", () => {
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
        if ((index - 1) >= 0) {
            playMusic(songs[index - 1]);
        }
    });

    next.addEventListener("click", () => {
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
        if ((index + 1) < songs.length) {
            playMusic(songs[index + 1]);
        }
    });
}

main();
