/*********************************************************************/
/* Title: Music2CSV */
/* Author: Scott McGrath */
/* Date: 2023-09-07 */
/* Purpose: Chrome extension that will take a file and send it to the audd.io enterprise API for processing. */
/*         The results will be returned as a CSV file. */
/*********************************************************************/




var apiToken;
var limit;
var every;
var skip;
var dry_run;
var api_file_contents;


// var uniqueSongs = [];
// Define a map called uniqueSongs
var uniqueSongs = new Map();
var uniqueSongTitles = new Set();


// Use FileReader to try to read the API key out of api_key.txt and put it in the form

const keyFile = new File(["api_key"], "api_key.txt", {
    type: "text/plain",
  });

  
const reader = new FileReader();
reader.onload = function(e) {
    api_file_contents = e.target.result;            
    
    // Call the function to do the request
    doRequest();            

}

reader.readAsText(keyFile);

console.log(api_file_contents);

if (api_file_contents != null) {
    document.getElementById('api_token').value = api_file_contents;
}
// });




const form = document.querySelector('#myForm');
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    apiToken = formData.get('api_token');

    limit = formData.get('limit');
    // verify this is a number
    if (isNaN(limit)) {
        console.log("Got a bad limit of " + limit + ". Using default limit of 1");
        limit = 1;
    }

    // every = formData.get('every');
    // if (isNaN(every)) {
    //     console.log("Got a bad every of " + every + ". Using default every of 1");
    //     every = 1;    
    // }
    every = 1;

    // skip = formData.get('skip');
    // if (isNaN(skip)) {
    //     console.log("Got a bad skip of " + skip + ". Using default skip of 9");
    //     skip = 9;
    // }

    skip = 9;

    dry_run = false;

        
    
    doRequest();

});  // End of form.addEventListener




/* This function sends the file and options to audd.io retrieves the results, and then initiates the CSV creation on the results */

async function doRequest() {

    // Construct the data object
    const data = {
        'api_token': apiToken,
        'limit': limit,
        'every': every,
        'skip': skip,        
        // 'url': 'https://URLtoFile.mp3',',        
        'accurate_offsets': 'true'
    };

    console.log(data);    

    // Encode the data as multipart/form-data using a FormData object
    const formData = new FormData();
    for (const key in data) {
        formData.append(key, data[key]);
    }

    // Append the file to the formData object
    const fileInput = document.querySelector('#the_file');
    formData.append('file', fileInput.files[0]);

    

    if (dry_run == false) {
        console.log("Sending request to audd.io");

        // Show a throbber animation while we wait for the response
        $('#output').html('<img src="../icons/Spinning_wheel_throbber.gif" alt="Loading...">');

        try {
            const response = await fetch('https://enterprise.audd.io/', {
                method: 'POST',
                // body: JSON.stringify(data),   // Don't use for multipart/form-data
                // body: data,
                body: formData                // The formData object
            });
            //console.log(await response.json());
            // Wait for the response and then output it as a CSV
            const result = await response.json();
            console.log(result);

            // Output the results as a CSV
            createCSV(result.result);           


        } catch (error) {
            console.error(error);
        }
    }   // End of if (dry_run == false)

        
} // End of doRequest function



function createCSV(results)
{
    // If results is undefined or empty here, then we didn't get any results
    if (!results || results.length == 0) {
    
        console.log ("No results found");
        $('#output').html('<p>No results found</p>');

        return;
    }
    else {
        console.log ("Results length: " + results.length);
        var csv_header = "Time,Artist,Title\n";
    
        for (let i = 0; i < results.length; i++) {
            const songs = results[i].songs;
            
            
            // Iterate through the songs array for each result
            for (let j = 0; j < songs.length; j++) {
                const song = songs[j];
                
                // console.log ("start_offset: " + results[i].songs[j].start_offset);

                // const songTime = parseInt(results[i].offset,10) + parseInt(results[i].songs[j].start_offset,10);
                // The song time is the offset mm:ss + start_offset seconds
                // Convert the offset to seconds
                                
                const offset = results[i].offset;
                console.log ("offset: " + offset);
                console.log ("startoffset: " + results[i].songs[j].start_offset);
                console.log ("timecode: " + results[i].songs[j].timecode);
                

                songTimeFormatted = offset;
                // This attempts to instead calculate the start position of the song, but it's often wrong and not really useful I think
                // songTimeFormatted = subtractTimes(offset, results[i].songs[j].timecode);


                // This adds the offset into the 12 second block that it was found in, makes it a little more accurate
                songTimeFormatted = addTimes(offset, msToTime(results[i].songs[j].start_offset ));

                // const songTime = song.timecode;
                const songTitle = song.title;
                const songArtist = song.artist;

                console.log(`Time: ${songTimeFormatted}, Artist: ${songArtist}, Title: ${songTitle}`);

                // Dump uniqueSongTitles to the console
                console.log("uniqueSongTitles: " + JSON.stringify(uniqueSongTitles));

                // Keep track of unique song titles
                if (!uniqueSongTitles.has(songTitle)) {
                    console.log("Adding song to uniqueSongs:" + songTitle);
                    uniqueSongTitles.add(songTitle);
                    // uniqueSongs.push({ timecode: songTime, artist: songArtist, title: songTitle });
                    // Add this to the map
                    uniqueSongs.set(songTitle, { timecode: songTimeFormatted, artist: songArtist, title: songTitle });
                }     
            }       
                
        }       

        
        
        // Combine the map into a comma delimited string
        var csvContent = "data:text/csv;charset=utf-8," + csv_header + Array.from(uniqueSongs.values()).map(e => Object.values(e).join(",")).join("\n");
        console.log(csvContent);

        // Encode the CSV string
        var encodedUri = encodeURI(csvContent);

        // Create and display a download link to the CSV         
        $('#output').html('<a href="' + encodedUri + '" download="output.csv">Download CSV</a>');

    }
} // End of createCSV function


function pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}


// Convenience function to add two times together
function addTimes(time1, time2) {
    const [hours1, minutes1] = time1.split(':').map(Number);
    const [hours2, minutes2] = time2.split(':').map(Number);
  
    const totalMinutes = (hours1 + hours2) * 60 + minutes1 + minutes2;
    const hours = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
    const minutes = (totalMinutes % 60).toString().padStart(2, '0');
  
    return `${hours}:${minutes}`;
  }

// Convenience function to subtract time2 from time1, returns 00:00 if the result is negative
function subtractTimes(time1, time2) {
    const [hours1, minutes1] = time1.toString().split(':').map(Number);
    const [hours2, minutes2] = time2.toString().split(':').map(Number);

    const totalMinutes = (hours1 - hours2) * 60 + minutes1 - minutes2;
    if (totalMinutes < 0) {
        return "00:00";
    }
    else {
        const hours = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
        const minutes = (totalMinutes % 60).toString().padStart(2, '0');

        return `${hours}:${minutes}`;
    }
}

// Convenience function to convert miliseconds to mm:ss
function msToTime(duration) {
    var milliseconds = parseInt((duration%1000)/100)
        , seconds = parseInt((duration/1000)%60)
        // , minutes = parseInt((duration/(1000*60))%60)
        , minutes = parseInt((duration/(1000*60)))
        // , hours = parseInt((duration/(1000*60*60))%24);
        , hours = parseInt((duration/(1000*60*60)));

    // hours = (hours < 10) ? "0" + hours : hours;
    // minutes = (minutes < 10) ? "0" + minutes : minutes;
    // seconds = (seconds < 10) ? "0" + seconds : seconds;

    // return hours + ":" + minutes + ":" + seconds + "." + milliseconds;
    return minutes + ":" + seconds;
}


// function estimate_api_requests (theFile) {
//     // Estimate the number of API requests based on the file size
//     // 1 API request per 12 seconds of audio

//     // Get the file size in bytes
//     const fileSize = theFile.size;
//     console.log("File size: " + fileSize);

// }
