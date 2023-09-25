const vosk = require('vosk')
const fs = require("fs");
const { Readable, Transform, PassThrough } = require("stream");
const wav = require("wav");
const Speaker = require('speaker');

const MODEL_PATH = "model"
let FILE_NAME = "./test_materials/test_stereo.wav"

if (!fs.existsSync(MODEL_PATH)) {
    console.log("Please download the model from https://alphacephei.com/vosk/models and unpack as " + MODEL_PATH + " in the current folder.")
    process.exit()
}

if (process.argv.length > 2)
    FILE_NAME = process.argv[2]

vosk.setLogLevel(0);
const model = new vosk.Model(MODEL_PATH);

const wfReader = new wav.Reader();
const wfReadable = new Readable().wrap(wfReader);

wfReader.on('format', async (format) => {
    let { audioFormat, sampleRate, channels } = format
    if (audioFormat != 1 || (channels != 1 && channels != 2)) {
        console.error("Audio file must be WAV format mono or stereo PCM.");
        process.exit(1);
    }

    const speaker = new Speaker(format);

    const rec = new vosk.Recognizer({model: model, sampleRate: sampleRate});
    rec.setMaxAlternatives(10);
    rec.setWords(true);
    rec.setPartialWords(true);

    let transformStream;

    if (channels === 1) {
        // If mono, no need to modify the audio data.
        transformStream = new PassThrough();
    } else {
        // If stereo, convert to mono by averaging the channels.
        transformStream = new Transform({
            transform(chunk, encoding, callback) {
                const monoData = Buffer.alloc(chunk.length / 2);
                for (let i = 0, j = 0; i < chunk.length - 2; i += 4) {
                    const sampleLeft = chunk.readInt16LE(i);
                    const sampleRight = chunk.readInt16LE(i + 2);
                    const monoSample = Math.round((sampleLeft + sampleRight) / 2);
                    monoData.writeInt16LE(monoSample, j);
                    j += 2;
                }
                this.push(monoData);
                callback();
            }
        });
    }

    wfReadable.pipe(speaker)

    for await (const data of wfReadable.pipe(transformStream)) {
        // speaker.write(data)
        const end_of_speech = rec.acceptWaveform(data);
        if (end_of_speech) {
            let text_strs = rec.result().alternatives.map(item => item.text)
            // console.log(JSON.stringify(rec.result(), null, 4));
            console.log(JSON.stringify(text_strs, null, 4));
        } else {
            // console.log(rec.partialResult().partial)
            //   console.log(JSON.stringify(rec.partialResult(), null, 4));
        }
    }

    let text_strs = rec.result().alternatives.map(item => item.text)
    console.log('end')
    console.log(JSON.stringify(text_strs, null, 4));
    // console.log(JSON.stringify(rec.finalResult(rec), null, 4));
    rec.free();

    speaker.end(() => {
        console.log(`read Audio file ${FILE_NAME} over.`);
    })
});

fs.createReadStream(FILE_NAME, {'highWaterMark': 4096}).pipe(wfReader).on('finish', 
    function (err) {
        model.free();
});