const vosk = require('vosk')
const fs = require("fs");
const mic = require("mic");
const wav = require('wav');
const Speaker = require('speaker');
const { Transform } = require('stream')

let MODEL_PATH = "model"
let SAMPLE_RATE = 16000

if (!fs.existsSync(MODEL_PATH)) {
    console.log("Please download the model from https://alphacephei.com/vosk/models and unpack as " + MODEL_PATH + " in the current folder.")
    process.exit()
}

vosk.setLogLevel(0);
const model = new vosk.Model(MODEL_PATH);
const rec = new vosk.Recognizer({model: model, sampleRate: SAMPLE_RATE});

const micInstance = mic({
    rate: String(SAMPLE_RATE),
    channels: '1',
    bitwidth: '16',
    debug: true,
    device: 'default',    
});

const micInputStream = micInstance.getAudioStream();

// Write the audio data to a WAV file
const outputFile = './test_materials/output.wav';
const outputAudioFormat = {
    sampleRate: SAMPLE_RATE,
    channels: 1,
    bitDepth: 16,
}
const writer = new wav.FileWriter(outputFile, outputAudioFormat);
const speaker = new Speaker(outputAudioFormat);

const downmixStream = new Transform({
    transform(chunk, encoding, callback) {
        // Convert 2-channel data to 1 channel by averaging samples
        const monoData = Buffer.alloc(chunk.length / 2);
        for (let i = 0, j = 0; i < chunk.length; i += 4) {
            const sampleLeft = chunk.readInt16LE(i);
            const sampleRight = chunk.readInt16LE(i + 2);
            const monoSample = Math.round((sampleLeft + sampleRight) / 2);
            monoData.writeInt16LE(monoSample, j);
            j += 2;
        }

        this.push(monoData)
        callback()
    }
})

micInputStream.pipe(downmixStream).pipe(writer)
downmixStream.pipe(speaker)

downmixStream.on('data', data => {
    if (rec.acceptWaveform(data)) {
        console.log(rec.result());
    } else {
        console.log(rec.partialResult());
    }
});

micInputStream.on('audioProcessExitComplete', function() {
    console.log("Cleaning up");
    console.log(rec.finalResult());
    rec.free();
    model.free();
});

process.on('SIGINT', function() {
    console.log("\nStopping");
    micInstance.stop();

    writer.end(() => {
        console.log(`Audio saved as ${outputFile}`);
    });
});

micInstance.start();