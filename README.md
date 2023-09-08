# Music2CSV

Music playlists from audio & video files
---


Music2CSV is a simple application that can analyze an audio or video file, determine a playlist of music and deliver it in CSV format, with time stamps.
It uses the AudD.io music recognition API.  You will need to sign up and get an [API token](https://dashboard.audd.io).
Music2CSV is very conservative with API requests (one request for every 120 seconds of audio), and allows you to limit how many requests will be made, at maximum.


## Installation
At present, the most straightforward way to install this plugin is to:

1. Clone this repository to a temp folder
1. Visit chrome://extensions in the Chrome address bar
2. Turn on the "Developer Mode" switch at top right
3. Click "Load unpacked"
4. Browse to the folder containing the downloaded files
5. Optionally click the puzzle piece and pin the extension for easy access

## Usage
The program requires an API key/token from AudD.io.  You simply plug this in to the box labeled "AudD.io API Key"


### API Requests Limit
As a rule of them, the number of requests required is approximately 
`L / 120`
...where L is the length of the file in seconds.
So for example, a 4 hour audio file would have 4 * 60 * 00 seconds of audio, or 14400 seconds.
The number of requests would be:
`14400 / 120 = 120 Requests`


### File
Finally, you just browse to an audio or video file on your system that will be analyzed.  Audd.io claims to handle "hours-long or even days-long" audio.

### CSV output
After a short while of uploading your file (or a long while, depending on the size), a "Download CSV" link will appear.  This is a basic spreadsheet containing the artist and title of the song, preceeded by the time stamp in the file in which it was seen.  Note that this time stamp doesn't correspond to the actual beginning or end of the recognized song.

## AudD
AudD is a music recognition API that makes Mousai possible. For more information, you can check their [Privacy Policy](https://audd.io/privacy/) and [Terms of Service](https://audd.io/terms/).