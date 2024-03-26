const { log } = require("console");
const express = require("express");
const fs = require("fs");

const app = express();

const { spawn } = require('child_process');

const pythonSkript = 'scripts/collectData.py';


let data = reloadDataBase();

function reloadDataBase(){
    fs.readFile("data/media.json", (err, filedata)=>{
        if (err){
            console.log(err);
            return;
        }

        data = JSON.parse(filedata);
        console.log("data loaded!");
        return data;
    })
}

function runPythonScript(res){
    const pythonProzess = spawn('python', [pythonSkript]);

    pythonProzess.stdout.on('data', (data) => {
        console.log(`Python-Skript-Ausgabe: ${data}`);
    });

    pythonProzess.stderr.on('data', (data) => {
        console.error(`Fehler bei der Ausführung des Python-Skripts: ${data}`);
    });

    pythonProzess.on('close', (code) => {
        console.log(`Python-Skript wurde mit Exit-Code ${code} beendet`);
        data = reloadDataBase();
        res.send('Reloaded');
    });
}

function clearSubtitleString(sub){
    return sub.replace("/", "").replace(".vtt", "");
}


app.get('/reload', function(req, res){
    runPythonScript(res);
})


app.get("/media", function(req, res){
    res.setHeader("Access-Control-Allow-Origin", '*')
    // ! needs to send only needed data !
    res.send(data);
})
 


app.get("/poster/:media", function (req, res){
    try{
        const obj = data[req.params.media];
        const path = obj['path']+"/"+obj['banner'];
        res.sendFile(path);
    }catch(err){
        if(!err instanceof TypeError){
            console.log(err);
            res.status(404).send("Not Found");
        }
    }
})




app.get("/movie/:media/:version", function (req, res){

    const media = req.params.media;
    const version = req.params.version
    const range = req.headers.range;
    // if(!range){
    //     res.status(400).send("Requires Range header");
    // }


    const videoPath = data[media].path + data[media]['versions'][version];
    streamVideo(videoPath, req, res);
    // const videoSize = fs.statSync(videoPath).size;

    // let start = 0;
    // let end = 1;
    // if (!(range == "bytes=0-1")){
    //     const CHUNK_SIZE = 10**6;
    //     start = parseInt(range.split('=')[1].split('-')[0]);
    //     end = parseInt(range.split('-')[1]);
        
    //     if (Number.isNaN(end)){
    //         end = Math.min(start + CHUNK_SIZE, videoSize -1);
    //     }
    // }

    // const contentLength = end - start + 1;
    // const headers = {
    //     "Content-Range": `bytes ${start}-${end}/${videoSize}`,
    //     "Accept-Ranges": "bytes",
    //     "Content-Length": contentLength,
    //     "Content-Type": "video/mp4"
    // }
    // res.writeHead(206, headers);

    // const videoStream = fs.createReadStream(videoPath, { start, end });
    // videoStream.pipe(res);

});



app.get("/series/:media/:season/:episode", function (req, res){

    const media = req.params.media;
    const season = req.params.season;
    const episode = req.params.episode;

    // const range = req.headers.range;
    // if(!range){
    //     res.status(400).send("Requires Range header");
    // }


    const videoPath = data[media].path + data[media]['seasons'][season]['episodes'][episode].path;
    streamVideo(videoPath, req, res);
    // const videoSize = fs.statSync(videoPath).size;

    // let start = 0;
    // let end = 1;
    // if (!(range == "bytes=0-1")){
    //     const CHUNK_SIZE = 10**6;
    //     start = parseInt(range.split('=')[1].split('-')[0]);
    //     end = parseInt(range.split('-')[1]);
        
    //     if (Number.isNaN(end)){
    //         end = Math.min(start + CHUNK_SIZE, videoSize -1);
    //     }
    // }

    // const contentLength = end - start + 1;
    // const headers = {
    //     "Content-Range": `bytes ${start}-${end}/${videoSize}`,
    //     "Accept-Ranges": "bytes",
    //     "Content-Length": contentLength,
    //     "Content-Type": "video/mp4"
    // }
    // res.writeHead(206, headers);

    // const videoStream = fs.createReadStream(videoPath, { start, end });
    // videoStream.pipe(res);

});

app.get('/subtitles/:media', function(req, res){
    res.setHeader("Access-Control-Allow-Origin", '*')
    const media = req.params.media;
    const subtitles = data[media].subtitles;

    if (data[media].subtitles == undefined){
        res.send({"error": "No subtitles available"});
        return;
    }
    var subdata = {}

    subtitles.forEach(sub => {
        subdata[clearSubtitleString(sub)] = fs.readFileSync(data[media].path+sub, encode='utf-8');
    });

    res.send(subdata);
});


function streamVideo(videoPath, req, res){
    const range = req.headers.range;
    if(!range){
        res.status(400).send("Requires Range header");
    }


    const videoSize = fs.statSync(videoPath).size;

    let start = 0;
    let end = 1;
    if (!(range == "bytes=0-1")){
        const CHUNK_SIZE = 10**6;
        start = parseInt(range.split('=')[1].split('-')[0]);
        end = parseInt(range.split('-')[1]);
        
        if (Number.isNaN(end)){
            end = Math.min(start + CHUNK_SIZE, videoSize -1);
        }
    }

    const contentLength = end - start + 1;
    const headers = {
        "Content-Range": `bytes ${start}-${end}/${videoSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": contentLength,
        "Content-Type": "video/mp4"
    }
    res.writeHead(206, headers);

    const videoStream = fs.createReadStream(videoPath, { start, end });
    videoStream.pipe(res);
}



app.listen(8000, function(){
    console.log("listening on port 8000");
    console.log("http://127.0.0.1:8000");
});

