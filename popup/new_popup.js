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

// fs.readFile('api_key.txt', 'utf8' , (err, data) => {
//     if (err) {
//         console.error(err);
//         return;
//     }
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


    // // See if the dry_run checkbox is checked    
    // const dryRunCheckbox = document.getElementById('dry_run');
    // if (dryRunCheckbox.checked) {
    //     console.log('Dry run is checked');
    //     dry_run = true;
    // } else {
    //     console.log('Dry run is not checked');
    //     dry_run = false;
    // }

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
    }
        
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

                console.log ("offset: " + results[i].offset);
                console.log ("start_offset: " + results[i].songs[j].start_offset);

                // const songTime = parseInt(results[i].offset,10) + parseInt(results[i].songs[j].start_offset,10);
                // The song time is the offset mm:ss + start_offset seconds
                // Convert the offset to seconds
                const offset = results[i].offset;
                const offsetMinutes = parseInt(offset.substring(0,2),10);
                const offsetSeconds = parseInt(offset.substring(3,5),10);
                const offsetSecondsTotal = offsetMinutes * 60 + offsetSeconds;
                // console.log("offsetSecondsTotal: " + offsetSecondsTotal);

                // Add the start offset
                const startOffset = results[i].songs[j].start_offset;
                const startOffsetSeconds = parseInt(startOffset,10);
                // console.log("startOffsetSeconds: " + startOffsetSeconds);
                songTime = offsetSecondsTotal + startOffsetSeconds;
                

                console.log("songTime: " + songTime);

                // Convert this to mm:ss format
                const minutes = pad(Math.floor(songTime / 60),2);
                console.log("minutes: " + minutes);
                const seconds = pad(songTime - (minutes * 60),2);
                console.log("seconds: " + seconds);
                const songTimeFormatted = minutes + ":" + seconds;

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


// function estimate_api_requests (theFile) {
//     // Estimate the number of API requests based on the file size
//     // 1 API request per 12 seconds of audio

//     // Get the file size in bytes
//     const fileSize = theFile.size;
//     console.log("File size: " + fileSize);

// }
